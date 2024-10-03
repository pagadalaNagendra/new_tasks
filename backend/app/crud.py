from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from . import models, schemas

# CRUD operations for Vertical (already defined)
def get_verticals(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Vertical).offset(skip).limit(limit).all()

def create_vertical(db: Session, vertical: schemas.VerticalCreate):
    existing_vertical = db.query(models.Vertical).filter(models.Vertical.name == vertical.name).first()
    if existing_vertical:
        raise HTTPException(status_code=400, detail="Vertical with this name already exists.")
    
    db_vertical = models.Vertical(name=vertical.name)
    try:
        db.add(db_vertical)
        db.commit()
        db.refresh(db_vertical)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Vertical with this name already exists.")
    return db_vertical

def update_vertical(db: Session, vertical_id: int, vertical: schemas.VerticalUpdate):
    db_vertical = db.query(models.Vertical).filter(models.Vertical.id == vertical_id).first()
    if db_vertical is None:
        return None
    for var, value in vars(vertical).items():
        setattr(db_vertical, var, value) if value else None
    db.commit()
    db.refresh(db_vertical)
    return db_vertical

def delete_vertical(db: Session, vertical_id: int):
    db_vertical = db.query(models.Vertical).filter(models.Vertical.id == vertical_id).first()
    if db_vertical is None:
        return None
    db.delete(db_vertical)
    db.commit()
    return db_vertical


# CRUD operations for Parameter

def create_parameter(db: Session, parameter: schemas.ParameterCreate):
    db_parameter = models.Parameter(**parameter.dict())
    db.add(db_parameter)
    db.commit()
    db.refresh(db_parameter)
    return db_parameter

def get_parameter(db: Session, parameter_id: int):
    return db.query(models.Parameter).filter(models.Parameter.id == parameter_id).first()

def get_parameters(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Parameter).offset(skip).limit(limit).all()

def get_parameters_by_vertical(db: Session, vertical_id: int, skip: int = 0, limit: int = 10):
    return db.query(models.Parameter).filter(models.Parameter.vertical_id == vertical_id).offset(skip).limit(limit).all()

def update_parameter(db: Session, parameter_id: int, parameter_update: schemas.ParameterCreate):
    db_parameter = db.query(models.Parameter).filter(models.Parameter.id == parameter_id).first()
    if db_parameter is None:
        return None
    for key, value in parameter_update.dict(exclude_unset=True).items():
        setattr(db_parameter, key, value)
    db.commit()
    db.refresh(db_parameter)
    return db_parameter

def delete_parameter(db: Session, parameter_id: int):
    db_parameter = db.query(models.Parameter).filter(models.Parameter.id == parameter_id).first()
    if db_parameter is None:
        return None
    db.delete(db_parameter)
    db.commit()
    return db_parameter


def create_node(db: Session, node: schemas.NodeCreate):
    # Default value for services
    services = node.services if node.services is not None else 'stop'

    # Create a new node object with all fields, including services
    db_node = models.Node(
        node_id=node.node_id,
        parameter_id=node.parameter_id,
        vertical_id=node.vertical_id,
        platform=node.platform,
        protocol=node.protocol,
        frequency=node.frequency,
        services=services  # Include services field
    )

    try:
        db.add(db_node)
        db.commit()
        db.refresh(db_node)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Node with this ID already exists.")
    
    return db_node


def get_node(db: Session, node_id: str):
    return db.query(models.Node).filter(models.Node.node_id == node_id).first()

def get_nodes(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Node).offset(skip).limit(limit).all()

def update_node(db: Session, node_id: str, node_update: schemas.NodeUpdate):
    db_node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if db_node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Handle updates for the node, including services
    for key, value in node_update.dict(exclude_unset=True).items():
        if key == 'services' and value not in ['start', 'stop']:
            raise HTTPException(status_code=400, detail="Invalid value for services. Must be 'start' or 'stop'.")
        setattr(db_node, key, value)
    
    try:
        db.commit()
        db.refresh(db_node)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error updating node")
    
    return db_node


def delete_node(db: Session, node_id: str):
    db_node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if db_node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    
    db.delete(db_node)
    db.commit()
    return {"detail": "Node deleted successfully"}
