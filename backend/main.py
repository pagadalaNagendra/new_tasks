from fastapi import FastAPI
from app.routers import verticals, parameters, nodes, services
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Include the routers
app.include_router(verticals.router)
app.include_router(parameters.router)
app.include_router(nodes.router)
app.include_router(services.router)