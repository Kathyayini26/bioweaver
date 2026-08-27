# BioWeaver

### AI-Powered Biomedical Knowledge Graph for Gene–Disease Discovery

<p align="center">
  <img src="images/dashboard.png" alt="BioWeaver Dashboard" width="100%">
</p>

BioWeaver is a full-stack biomedical intelligence platform designed to support gene–disease discovery through the integration of biological knowledge graphs and machine learning. The platform combines gene–disease associations from the Monarch Initiative with protein–protein interaction data from the STRING Database to create a unified biomedical knowledge graph.

Using graph analytics, Node2Vec embeddings, and a Random Forest prediction model, BioWeaver enables researchers to explore direct disease associations, investigate protein interaction networks, discover indirect disease candidates through associated genes, and validate potential relationships using machine learning. The platform provides an interactive React-based research workspace for visualizing biological networks and analyzing evidence paths between genes and diseases.

---

## Key Highlights

- 18,597 Total Nodes
- 12,026 Gene Nodes
- 6,571 Disease Nodes
- 107,187 Graph Edges
- 6,961 Gene–Disease Associations
- 100,554 Protein–Protein Interactions
- 13,922 Machine Learning Samples
- 128D Node2Vec Embeddings
- 129D Feature Space
- 86.43% Test Accuracy
- 93.30% ROC-AUC

---

## Architecture

```text
Monarch Initiative + STRING Database
                ↓
      Biomedical Knowledge Graph
                ↓
        Node2Vec Embeddings
                ↓
        Feature Engineering
                ↓
      Random Forest Model
                ↓
          FastAPI Backend
                ↓
      React Research Workspace
```

---

## Features

- Interactive Knowledge Graph Visualization
- Gene-Centric Search
- Direct Disease Exploration
- Associated Gene Discovery
- Two-Hop Disease Discovery
- Evidence Path Analysis
- Machine Learning Validation
- Association Probability Scoring

---

## Tech Stack

### Data & Graph Analytics
- Python
- Pandas
- NumPy
- NetworkX
- Node2Vec

### Machine Learning
- Scikit-learn
- Random Forest

### Backend
- FastAPI
- Uvicorn
- Pydantic

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- D3.js
- Framer Motion

---

## Model Performance

| Metric | Score |
|----------|----------|
| Accuracy | 86.43% |
| Precision | 85.86% |
| Recall | 87.21% |
| F1 Score | 86.53% |
| ROC-AUC | 93.30% |

---

## Project Structure

```text
BIOWEAVER
├── backend/
├── frontend/
├── data/
├── src/
├── notebooks/
├── docs/
└── README.md
```

---

## Future Work

- Graph Neural Networks (GNNs)
- Explainable AI
- Drug–Gene–Disease Discovery
- Multi-Omics Integration
- Clinical Knowledge Integration

---

## Author

**Kathyayini Prabhu**  
Artificial Intelligence & Data Science

GitHub: https://github.com/Kathyayini26

## License

MIT License
