import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load the environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # DB_USER: str = os.getenv("DB_USER", "root")
    # DB_PASSWORD: str = os.getenv("DB_PASSWORD", "toor")    
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    # DB_HOST: str = os.getenv("DB_HOST", "10.2.16.116:6543")
    # DB_NAME: str = os.getenv("DB_NAME", "Node-Simulator")
    DB_HOST: str = os.getenv("DB_HOST", "localhost:5432")
    DB_NAME: str = os.getenv("DB_NAME", "nodesimulator")

settings = Settings()