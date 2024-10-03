import os
import json
import random
import requests
import asyncio
import platform
import socket
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# Create router
router = APIRouter(prefix="/services", tags=["services"])

# Define the paths to your certificate and key files
base_dir = os.path.dirname(os.path.abspath(__file__))
cert_path = os.path.join(base_dir, 'certificates', 'SOTIiithWQ1.crt')
key_path = os.path.join(base_dir, 'certificates', 'SOTIiithWQ1.key')

url_template = "https://ccsp.m2m.cdot.in/{node_id}"

headers = {
    'Content-Type': 'application/json;ty=4',
    'X-M2M-Origin': 'SOTIiithWQ1',
    'X-M2M-RI': 'SmartCityiiith',
    'X-M2M-RVI': '3',
    'Accept': 'application/json'
}

# Global task and control variables
tasks: Dict[str, asyncio.Task] = {}
stop_events: Dict[str, asyncio.Event] = {}
frequencies: Dict[str, int] = {}

# Pydantic models for request validation
class Parameter(BaseModel):
    name: str
    min: float
    max: float

class RequestBody(BaseModel):
    node_id: str
    frequency: int
    parameters: List[Parameter]
    platform: str
    protocol: str

class StopRequestBody(BaseModel):
    node_id: str

# Log storage function
def write_log_to_file(log_message: dict):
    log_dir = os.path.join(base_dir, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f"node_{log_message['node_id']}_log.json")
    
    with open(log_file, 'a') as f:
        json.dump(log_message, f, indent=2)
        f.write(",\n")

# Generate random parameter data
def generate_parameters_data(data: List[Parameter]) -> str:
    temp = {}
    now = datetime.now()
    epoch_timestamp = int(now.timestamp())
    ans = [epoch_timestamp]

    for item in data:
        temp[item.name] = random.uniform(item.min, item.max)
        ans.append(temp[item.name])
    
    return str(ans)

# Perform HTTP POST request
async def post_request(node_id: str, parameters_data: str) -> str:
    url = url_template.format(node_id=node_id)
    payload = {"m2m:cin": {"con": parameters_data}}
    payload_json = json.dumps(payload)

    try:
        response = requests.post(
            url,
            headers=headers,
            data=payload_json,
            cert=(cert_path, key_path),
            verify=False
        )
        if response.ok:
            response_data = response.json()
            log_message = {
                "node_id": node_id,
                "response": response.status_code,
                "data": response_data
            }
        else:
            log_message = {
                "node_id": node_id,
                "response": response.status_code,
                "error": response.text
            }
        write_log_to_file(log_message)
        return log_message
    except requests.exceptions.RequestException as e:
        log_message = {
            "node_id": node_id,
            "response": "Error",
            "error": str(e)
        }
        write_log_to_file(log_message)
        return json.dumps(log_message, indent=2)

# Periodically send POST requests at a given frequency
async def periodic_post(node_id: str, parameters_data: str):
    stop_event = stop_events[node_id]
    while not stop_event.is_set():
        result = await post_request(node_id, parameters_data)
        print(result)  # Optionally print result to the console
        await asyncio.sleep(frequencies[node_id])  # Reference frequency dynamically

# Start a task for a node
@router.put("/start")
async def start_threads(bodies: List[RequestBody], db: Session = Depends(get_db)):
    global tasks, stop_events, frequencies
    for body in bodies:
        if body.node_id in tasks and not tasks[body.node_id].done():
            raise HTTPException(status_code=400, detail=f"Task for node_id {body.node_id} is already running.")

        # Fetch the node from the database
        db_node = db.query(models.Node).filter(models.Node.node_id == body.node_id).first()
        if not db_node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        db_node.services = "start"
        db.commit()

        parameters_data = generate_parameters_data(body.parameters)
        
        stop_event = asyncio.Event()
        stop_events[body.node_id] = stop_event
        frequencies[body.node_id] = body.frequency
        task = asyncio.create_task(periodic_post(body.node_id, parameters_data))
        tasks[body.node_id] = task

    return {"message": "Tasks started for the specified nodes."}

# Stop a task for a node
@router.put("/stop")
async def stop_threads(bodies: List[StopRequestBody], db: Session = Depends(get_db)):
    global tasks, stop_events
    for body in bodies:
        node_id = body.node_id
        if node_id not in tasks or tasks[node_id].done():
            raise HTTPException(status_code=400, detail=f"Task for node_id {node_id} is not running.")
        
        stop_events[node_id].set()
        await tasks[node_id]  # Wait for the task to finish
        del tasks[node_id]
        del stop_events[node_id]
        del frequencies[node_id]

        # Fetch the node from the database
        db_node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
        if db_node:
            db_node.services = "stop"
            db.commit()

    return {"message": "Tasks stopped for the specified nodes."}

# Stream all events
@router.get("/events")
async def stream_all_events():
    if not tasks:
        raise HTTPException(status_code=404, detail="No active tasks found.")

    async def generate_events():
        while True:
            for node_id, task in tasks.items():
                if not stop_events[node_id].is_set():
                    parameters_data = generate_parameters_data([Parameter(name="pm10", min=10.0, max=60.0), Parameter(name="pm25", min=10.0, max=60.0)])
                    result = await post_request(node_id, parameters_data)
                    yield f"data: {result}\n\n"
            await asyncio.sleep(1)  # Adjust sleep time as needed

    return StreamingResponse(generate_events(), media_type="text/event-stream")

# Get IP information
@router.get("/ip")
def get_ip_info():
    system_name = platform.node()
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    os_info = platform.system()
    os_version = platform.version()
    
    return {
        "system_name": system_name,
        "ip_address": ip_address,
        "os_info": os_info,
        "os_version": os_version
    }

# Health check
@router.get("/")
async def read_root():
    return {"message": "Use /start with a JSON body to start tasks for specified nodes. Use /stop with a JSON body to stop tasks for specified nodes. Access live data at /events."}
