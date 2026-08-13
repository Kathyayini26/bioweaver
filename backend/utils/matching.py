import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

def resolve_node(label: str, embeddings_dict: Dict) -> Optional[str]:
    """
    Resolves a gene or disease label to a key in the embeddings dictionary.
    Supports:
    1. Exact match.
    2. Case-insensitive exact match.
    3. Word token subset match (where the database node must contain ALL words/tokens of the query).
    """
    if not label:
        return None
        
    # 1. Exact Match
    if label in embeddings_dict:
        return label
        
    # 2. Case-insensitive match
    label_lower = label.lower().strip()
    for key in embeddings_dict.keys():
        if key.lower().strip() == label_lower:
            return key
            
    # 3. Word token subset match (ALL tokens must be present in the node name)
    # Filter out empty or single-character words to reduce noise
    tokens = [t.strip() for t in label_lower.split() if len(t.strip()) > 1]
    if tokens:
        # Look for a node containing ALL tokens
        for key in embeddings_dict.keys():
            key_lower = key.lower()
            if all(token in key_lower for token in tokens):
                logger.info(f"Resolved '{label}' to '{key}' via all-token match")
                return key
                
    return None
