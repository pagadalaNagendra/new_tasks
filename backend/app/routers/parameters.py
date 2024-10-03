from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/parameters",
    tags=["parameters"],
)

@router.post("/", response_model=schemas.Parameter)
def create_parameter(parameter: schemas.ParameterCreate, db: Session = Depends(get_db)):
    return crud.create_parameter(db=db, parameter=parameter)

@router.get("/", response_model=List[schemas.Parameter])
def read_parameters(skip: int = 0, limit: int = 10, vertical_id: Optional[int] = None, db: Session = Depends(get_db)):
    if vertical_id is not None:
        parameters = crud.get_parameters_by_vertical(db=db, vertical_id=vertical_id)
    else:
        parameters = crud.get_parameters(db=db, skip=skip, limit=limit)
    
    if not parameters:
        raise HTTPException(status_code=404, detail="No parameters found")
    
    return parameters

@router.get("/{parameter_id}", response_model=schemas.Parameter)
def read_parameter(parameter_id: int, db: Session = Depends(get_db)):
    parameter = crud.get_parameter(db, parameter_id=parameter_id)
    if parameter is None:
        raise HTTPException(status_code=404, detail="Parameter not found")
    return parameter

@router.put("/{parameter_id}", response_model=schemas.Parameter)
def update_parameter(parameter_id: int, parameter: schemas.ParameterCreate, db: Session = Depends(get_db)):
    updated_parameter = crud.update_parameter(db=db, parameter_id=parameter_id, parameter_update=parameter)
    if updated_parameter is None:
        raise HTTPException(status_code=404, detail="Parameter not found")
    return updated_parameter

@router.delete("/{parameter_id}", response_model=schemas.Parameter)
def delete_parameter(parameter_id: int, db: Session = Depends(get_db)):
    deleted_parameter = crud.delete_parameter(db=db, parameter_id=parameter_id)
    if deleted_parameter is None:
        raise HTTPException(status_code=404, detail="Parameter not found")
    return deleted_parameter
