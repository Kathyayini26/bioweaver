import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the project root is in the python path for modules import
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.predictor import predictor_service
from backend.services.graph_service import graph_service
from backend.routes.health import router as health_router
from backend.routes.predict import router as predict_router
from backend.routes.graph import router as graph_router

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPI Lifespan Handler (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load model and node embeddings
    logger.info("Initializing application lifespan startup...")
    try:
        predictor_service.load_assets()
        logger.info("All model and embedding assets successfully initialized.")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to load predictor assets during server startup: {e}")
    try:
        graph_service.load_graph()
        logger.info("Knowledge graph successfully loaded.")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to load knowledge graph during server startup: {e}")
        
    yield
    # Shutdown: Clean up resources
    logger.info("Cleaning up lifespan resources...")

# Create FastAPI application
app = FastAPI(
    title="BioWeaver Prediction API",
    description="FastAPI Backend for predicting gene-disease associations using Heterogeneous Graph Embeddings.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration to support direct frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(graph_router)