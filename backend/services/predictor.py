import os
import joblib
import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

class PredictorService:
    def __init__(self):
        self.model = None
        self.embeddings: Dict[str, np.ndarray] = {}
        
        # Robust project-relative paths using pathlib
        base_dir = Path(__file__).resolve().parent.parent.parent
        
        env_model_path = os.getenv("MODEL_PATH", "").strip()
        env_embeddings_path = os.getenv("EMBEDDINGS_PATH", "").strip()
        
        self.model_path = Path(env_model_path) if env_model_path else base_dir / "data" / "processed" / "random_forest_model.pkl"
        self.embeddings_path = Path(env_embeddings_path) if env_embeddings_path else base_dir / "data" / "processed" / "node_embeddings.csv"

    def load_assets(self):
        """Loads the random forest model and node embeddings into memory."""
        logger.info(f"Starting asset loading... Model path: {self.model_path}")
        
        # 1. Load Model
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        
        try:
            self.model = joblib.load(str(self.model_path))
            logger.info("Random Forest model successfully loaded.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Failed to load model: {e}")

        # 2. Load Embeddings
        if not self.embeddings_path.exists():
            raise FileNotFoundError(f"Embeddings file not found at {self.embeddings_path}")
            
        try:
            logger.info(f"Loading node embeddings CSV from {self.embeddings_path}...")
            df = pd.read_csv(str(self.embeddings_path))
            
            # Map node column to embedding vectors
            self.embeddings = {}
            for _, row in df.iterrows():
                node_name = row["node"]
                vector = row.iloc[1:].values.astype(float)
                self.embeddings[node_name] = vector
                
            logger.info(f"Loaded {len(self.embeddings)} node embeddings successfully.")
        except Exception as e:
            logger.error(f"Failed to load embeddings: {e}")
            raise RuntimeError(f"Failed to load embeddings: {e}")

    def get_embedding(self, node_name: str) -> Optional[np.ndarray]:
        """Gets embedding vector for a node if it exists."""
        return self.embeddings.get(node_name)

    def predict(self, gene_node: str, disease_node: str) -> Tuple[int, float]:
        """
        Concatenates gene and disease embeddings and performs prediction.
        Returns (prediction, probability).
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded.")
            
        gene_emb = self.get_embedding(gene_node)
        disease_emb = self.get_embedding(disease_node)
        
        if gene_emb is None or disease_emb is None:
            raise ValueError("Embedding not found for the requested nodes.")
            
        # Concatenate features: 128 + 128 = 256
        features = np.concatenate([gene_emb, disease_emb]).reshape(1, -1)
        
        # Wrap in a pandas DataFrame to match expected feature columns
        input_df = pd.DataFrame(features, columns=[str(i) for i in range(256)])
        
        # Inference
        prediction = int(self.model.predict(input_df)[0])
        probabilities = self.model.predict_proba(input_df)[0]
        # Probability of positive class (index 1)
        probability = float(probabilities[1])
        
        return prediction, probability

# Singleton instance
predictor_service = PredictorService()
