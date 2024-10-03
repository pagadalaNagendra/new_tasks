from pydantic import BaseModel
from typing import List, Optional

class VerticalBase(BaseModel):
    name: str

class VerticalCreate(VerticalBase):
    pass

class VerticalUpdate(BaseModel):
    name: Optional[str] = None

class Vertical(VerticalBase):
    id: int
    name: str
    
    class Config:
        orm_mode = True

class ParameterBase(BaseModel):
    name: str
    min_value: float
    max_value: float
    vertical_id: int
    data_type: str

class ParameterCreate(ParameterBase):
    pass

class Parameter(ParameterBase):
    id: int
    name: str
    min_value: int
    max_value: int
    vertical_id: int
    data_type: str

    class Config:
        orm_mode = True
        
class NodeBase(BaseModel):
    parameter_id: str  # Keep as str, assuming it should be a comma-separated string
    vertical_id: int
    platform: str
    protocol: str
    frequency: int
    services:str
    node_id: str

class NodeCreate(NodeBase):
    pass

class NodeUpdate(BaseModel):
    platform: Optional[str] = None
    protocol: Optional[str] = None
    frequency: Optional[int] = None

class NodeWithDetails(BaseModel):
    node_id: str
    platform: str
    protocol: str
    frequency: int
    status: str
    vertical_name: Optional[str]
    parameters: List[Parameter]

    class Config:
        orm_mode = True
        
class Node(NodeBase):
    class Config:
        orm_mode = True  