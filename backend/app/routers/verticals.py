from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/verticals",
    tags=["verticals"],
)

@router.post("/", response_model=schemas.Vertical)
def create_vertical(vertical: schemas.VerticalCreate, db: Session = Depends(get_db)):
    db_vertical = crud.create_vertical(db=db, vertical=vertical)
    return db_vertical

@router.get("/", response_model=list[schemas.Vertical])
def read_verticals(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    verticals = crud.get_verticals(db, skip=skip, limit=limit)
    return verticals

@router.put("/{vertical_id}", response_model=schemas.Vertical)
def update_vertical(vertical_id: int, vertical: schemas.VerticalUpdate, db: Session = Depends(get_db)):
    db_vertical = crud.update_vertical(db, vertical_id, vertical)
    if db_vertical is None:
        raise HTTPException(status_code=404, detail="Vertical not found")
    return db_vertical

@router.delete("/{vertical_id}", response_model=schemas.Vertical)
def delete_vertical(vertical_id: int, db: Session = Depends(get_db)):
    db_vertical = crud.delete_vertical(db, vertical_id)
    if db_vertical is None:
        raise HTTPException(status_code=404, detail="Vertical not found")
    return db_vertical
