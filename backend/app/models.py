from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Vertical(Base):
    __tablename__ = "verticals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    parameters = relationship("Parameter", back_populates="vertical")
    nodes = relationship("Node", back_populates="vertical") 

class Parameter(Base):
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    min_value = Column(Float)
    max_value = Column(Float)
    vertical_id = Column(Integer, ForeignKey("verticals.id"))
    data_type = Column(String)

    vertical = relationship("Vertical", back_populates="parameters")
    nodes = relationship("Node", back_populates="parameter")  # Proper relationship definition


class Node(Base):
    __tablename__ = "nodes"

    node_id = Column(String, primary_key=True)
    parameter_id = Column(String, ForeignKey("parameters.id"))  
    vertical_id = Column(Integer, ForeignKey("verticals.id"))
    platform = Column(String)
    protocol = Column(String)
    frequency = Column(Integer)
    services = Column(String)  # Default value if needed

    parameter = relationship("Parameter")
    vertical = relationship("Vertical", back_populates="nodes")
