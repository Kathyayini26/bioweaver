from fastapi import APIRouter, HTTPException
from backend.services.graph_service import graph_service

router = APIRouter()

@router.get("/graph/{gene}", tags=["Knowledge Graph"])
def get_gene_subgraph(gene: str):
    """
    Returns the real knowledge-graph-derived subgraph for a gene.
    
    Includes:
    - directGenes: all 1-hop gene neighbors from the real graph
    - directDiseases: all 1-hop disease neighbors from the real graph  
    - indirectDiseases: all valid 2-hop diseases (gene -> neighbor_gene -> disease)
      where the intermediate PPI edge has an explicit score
    
    Direct takes priority: a disease that is directly connected to the gene 
    will NOT appear in indirectDiseases.
    """
    if graph_service.G is None:
        raise HTTPException(status_code=503, detail="Knowledge graph not loaded.")
    
    result = graph_service.get_subgraph(gene)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Gene '{gene}' not found in knowledge graph.")
    
    return result


@router.get("/genes", tags=["Knowledge Graph"])
def get_gene_list():
    """Returns the list of all gene symbols in the knowledge graph."""
    if graph_service.G is None:
        raise HTTPException(status_code=503, detail="Knowledge graph not loaded.")
    return {"genes": graph_service.get_gene_list()}
