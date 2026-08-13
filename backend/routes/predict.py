from fastapi import APIRouter, HTTPException
from backend.models.predict import PredictionRequest, PredictionResponse
from backend.services.predictor import predictor_service
from backend.utils.matching import resolve_node

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_association(request: PredictionRequest):
    # Ensure assets are loaded
    if predictor_service.model is None or not predictor_service.embeddings:
        raise HTTPException(
            status_code=500,
            detail="Predictor assets (model or embeddings) are not loaded on the server."
        )
        
    # Resolve gene node
    resolved_gene = resolve_node(request.gene, predictor_service.embeddings)
    if not resolved_gene:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown gene: '{request.gene}' could not be matched to any node in the database."
        )
        
    # Resolve disease node
    resolved_disease = resolve_node(request.disease, predictor_service.embeddings)
    if not resolved_disease:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown disease: '{request.disease}' could not be matched to any node in the database."
        )
        
    try:
        prediction, probability = predictor_service.predict(resolved_gene, resolved_disease)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
        
    return PredictionResponse(
        gene=request.gene,
        disease=request.disease,
        prediction=prediction,
        probability=round(probability, 4),
        resolved_gene=resolved_gene,
        resolved_disease=resolved_disease
    )
