from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(
    prefix="/nodes",
    tags=["nodes"],
)

@router.post("/", response_model=schemas.Node)
def create_node(node: schemas.NodeCreate, db: Session = Depends(get_db)):
    return crud.create_node(db=db, node=node)

@router.get("/{node_id}", response_model=schemas.Node)
def read_node(node_id: str, db: Session = Depends(get_db)):
    db_node = crud.get_node(db=db, node_id=node_id)
    if db_node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return db_node

@router.get("/all/{node_id}", response_model=schemas.NodeWithDetails)
def get_node_with_details(node_id: str, db: Session = Depends(get_db)):
    # Fetch the node from the database
    db_node = db.query(models.Node).filter(models.Node.node_id == node_id).first()

    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Use eval() to convert the string 'parameter_id' into a list
    try:
        parameter_ids = eval(db_node.parameter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid parameter_id format")

    # Ensure that the result is a list
    if not isinstance(parameter_ids, list):
        raise HTTPException(status_code=400, detail="parameter_id should be a list")

    # Query each parameter by ID and collect the results
    db_parameters = []
    for param_id in parameter_ids:
        param = db.query(models.Parameter).filter(models.Parameter.id == param_id).first()
        if param:
            db_parameters.append(param)

    # Fetch vertical name
    vertical_name = db_node.vertical.name if db_node.vertical else None

    # Prepare the response data
    response_data = {
        "node_id": db_node.node_id,
        "platform": db_node.platform,
        "protocol": db_node.protocol,
        "frequency": db_node.frequency,
        "status": db_node.services,  # Ensure 'status' matches 'services' in the schema
        "vertical_name": vertical_name,
        "parameters": db_parameters  # Return the list of parameters
    }

    return response_data


@router.get("/", response_model=List[schemas.Node])
def read_nodes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_nodes(db=db, skip=skip, limit=limit)

@router.put("/{node_id}", response_model=schemas.Node)
def update_node(node_id: str, node_update: schemas.NodeUpdate, db: Session = Depends(get_db)):
    return crud.update_node(db=db, node_id=node_id, node_update=node_update)

@router.delete("/{node_id}")
def delete_node(node_id: str, db: Session = Depends(get_db)):
    return crud.delete_node(db=db, node_id=node_id)

# New route to fetch nodes by vertical_id
@router.get("/vertical/{vertical_id}", response_model=List[schemas.Node])
def get_nodes_by_vertical(vertical_id: int, db: Session = Depends(get_db)):
    # Query the nodes based on vertical_id
    db_nodes = db.query(models.Node).filter(models.Node.vertical_id == vertical_id).all()

    if not db_nodes:
        raise HTTPException(status_code=404, detail="No nodes found for the specified vertical")

    return db_nodes