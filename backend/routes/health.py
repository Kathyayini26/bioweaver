from fastapi import APIRouter
from backend.services.predictor import predictor_service
from backend.services.graph_service import graph_service

router = APIRouter()

@router.get("/", tags=["General"])
def get_root():
    return {"message": "BioWeaver Prediction API Running", "status": "active"}

@router.get("/health", tags=["General"])
def get_health():
    model_loaded = predictor_service.model is not None
    embeddings_loaded = len(predictor_service.embeddings) > 0
    graph_loaded = graph_service.G is not None
    
    is_healthy = model_loaded and embeddings_loaded and graph_loaded
    status = "healthy" if is_healthy else "unhealthy"
    
    return {
        "status": status,
        "api_version": "1.0.0",
        "services": {
            "model_loaded": model_loaded,
            "embeddings_loaded": embeddings_loaded,
            "graph_loaded": graph_loaded,
            "embeddings_count": len(predictor_service.embeddings),
            "graph_nodes": graph_service.G.number_of_nodes() if graph_loaded else 0,
            "graph_edges": graph_service.G.number_of_edges() if graph_loaded else 0
        }
    }
