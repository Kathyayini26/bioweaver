from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    gene: str = Field(..., description="The symbol of the gene to evaluate (e.g., BRCA1)")
    disease: str = Field(..., description="The name of the disease to evaluate (e.g., Breast Cancer)")

class PredictionResponse(BaseModel):
    gene: str
    disease: str
    prediction: int
    probability: float
    resolved_gene: str = Field(..., description="The exact database node resolved for the gene")
    resolved_disease: str = Field(..., description="The exact database node resolved for the disease")
