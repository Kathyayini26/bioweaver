from fastapi import APIRouter
from backend.services.predictor import predictor_service

router = APIRouter()

@router.get("/", tags=["General"])
def get_root():
    return {"message": "BioWeaver Running"}

@router.get("/health", tags=["General"])
def get_health():
    model_loaded = predictor_service.model is not None
    embeddings_loaded = len(predictor_service.embeddings) > 0
    
    status = "healthy" if (model_loaded and embeddings_loaded) else "unhealthy"
    
    return {
        "status": status,
        "api_version": "1.0.0",
        "services": {
            "model_loaded": model_loaded,
            "embeddings_loaded": embeddings_loaded,
            "embeddings_count": len(predictor_service.embeddings)
        }
    }
