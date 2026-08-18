import sys
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the project root is in python path regardless of execution directory
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

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
    # Startup: Load model, node embeddings, and knowledge graph
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

# CORS configuration supporting environment variables (FRONTEND_URL), Vercel domains, & local dev
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "https://bioweaver.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    for url in frontend_url.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

allow_all = os.getenv("ALLOW_ALL_ORIGINS", "true").lower() in ("true", "1")
if allow_all:
    allowed_origins = ["*"]

logger.info(f"Configured CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(graph_router)