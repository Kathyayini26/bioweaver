# 🧬 BioWeaver — Heterogeneous Biomedical Knowledge Graph & ML Exploration Platform

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**BioWeaver** is an end-to-end, full-stack biomedical platform that integrates **Monarch Initiative** gene-disease ontology associations with **STRING** protein-protein interaction networks into a unified **heterogeneous knowledge graph** of **18,597 nodes** and **107,187 edges**.

By combining **Node2Vec graph embeddings** with a **Random Forest classification pipeline** and a **real-time D3 force-directed visualization workspace**, BioWeaver enables researchers to explore local neighborhood topologies, discover direct and 2-hop indirect disease associations, and validate novel gene-disease predictions.

---

## 🌟 Key Features

### 🕸️ 1. Heterogeneous Graph Integration & Topological Traversal
- **Data Source Fusion**: Combines 6,961 clean gene-disease associations from Monarch with 100,554 protein-protein interactions from STRING.
- **Topology-Preserving 2-Hop Discovery**:
  - 🟢 **Direct Disease Associations (1-Hop)**: High-confidence primary relationships derived directly from Monarch.
  - 🟣 **Indirect Disease Candidates (2-Hop)**: Discovers candidate diseases via intermediate interacting genes (`Gene A → Interacting Gene B → Disease C`) with path-level score tracking.
- **Pathways Integration**: Automatically links biological entities to Reactome and KEGG pathway nodes (e.g. *DNA Repair Pathway*, *Homologous Recombination*, *p53 Signaling Pathway*).

### 🤖 2. Machine Learning Inference Pipeline
- **Representation Learning**: Uses **Node2Vec** to map every biological entity into a low-dimensional **128-dimensional embedding space** capturing higher-order graph neighborhood structure.
- **Feature Vector Engineering**: Concatenates gene and disease embeddings into **256-dimensional feature representations** for supervised classification.
- **Random Forest Predictor**: Predicts association probabilities for unmapped gene-disease pairs in real-time via FastAPI REST endpoints.

### 🎨 3. Interactive Cyber-Biomedical Visualization Workspace
- **Custom D3 Force-Directed Simulation**: Smooth 60 FPS physics engine with collision detection (120px minimum spacing threshold) to prevent label overlap.
- **Strict Legend & Visual Hierarchy**:
  - 🟢 **Teal Nodes**: Genes (`HGNC:` IDs)
  - 🔘 **Slate Nodes**: Diseases (`MONDO:` IDs)
  - 🟣 **Purple Nodes**: Pathways (`REACT:` / `KEGG:` IDs)
  - ┈ **Teal Dotted Edges**: Protein-Protein Interactions (`interacts_with`)
  - ┈ **Purple Dotted Edges**: Biological Pathway Links (`participates_in`)
  - ➖ **Solid Lines**: Direct Gene-Disease Causal Associations (`causes` / `associated_with`)
- **Guided Exploration**: Empty state initialization ("Search for a gene to begin exploration"), animated Bézier signal particles, smooth LERP camera panning and zooming, and quick node re-centering.

---

## 📊 Dataset & Knowledge Graph Statistics

### Knowledge Graph Composition
| Component | Entity / Edge Type | Count | Source |
| :--- | :--- | :---: | :--- |
| **Total Graph Nodes** | `Gene`, `Disease`, `Pathway` | **18,597** | Monarch + STRING |
| **Total Graph Edges** | `interacts_with`, `causes`, `participates_in` | **107,187** | Merged Heterogeneous Graph |
| **Unique Genes** | Human Genes (`HGNC`) | **12,026** | Monarch + STRING |
| **Unique Diseases** | Disease Ontology (`MONDO`) | **6,571** | Monarch Initiative |
| **Clean Gene-Disease Edges**| Direct Associations | **6,961** | Curated Monarch |
| **Protein Interactions** | PPI Edges | **100,554** | STRING Database API |

### Machine Learning Dataset & Model Metrics
| Parameter | Specification / Performance |
| :--- | :--- |
| **Embedding Dimensions** | 128 dimensions per node (Node2Vec, $p=1.0, q=1.0, \text{walks}=10, \text{length}=80$) |
| **Classification Features** | 256-dimensional concatenated feature vector ($\text{Gene Vector} \mathbin{\Vert} \text{Disease Vector}$) |
| **Dataset Size** | 13,922 balanced samples (6,961 positive + 6,961 negative samples) |
| **Classifier** | Random Forest Estimator (`n_estimators=100`, `max_depth=15`) |
| **Prediction Metric** | Association Probability ($0.0 - 1.0$) with Confidence Rating |

---

## 🏗️ System Architecture

```
                                  BIOWEAVER PIPELINE
                                  
  ┌──────────────────┐      ┌──────────────────┐
  │ Monarch Data     │      │ STRING DB API    │
  │ (Gene-Disease)   │      │ (Protein PPI)    │
  └────────┬─────────┘      └────────┬─────────┘
           │                         │
           └───────────┬─────────────┘
                       ▼
         ┌───────────────────────────┐
         │ Heterogeneous Graph (NX)  │  ◄── 18,597 Nodes / 107,187 Edges
         └─────────────┬─────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Node2Vec (128D) │         │ FastAPI Engine  │
└────────┬────────┘         └────────┬────────┘
         │                           │
         ▼                           │
┌─────────────────┐                  │
│ Random Forest   │                  │
│ Model (256D)    │                  │
└────────┬────────┘                  │
         │                           │
         └─────────────┬─────────────┘
                       ▼
         ┌───────────────────────────┐
         │ React + D3.js Workspace   │  ◄── Interactive Exploration UI
         └───────────────────────────┘
```

---

## 📁 Repository Structure

```
BIOWEAVER/
├── backend/                        # FastAPI Python Backend
│   ├── app.py                      # FastAPI application entrypoint & CORS setup
│   ├── models/                     # Pydantic request/response schemas
│   ├── routes/                     # REST API routers (/graph, /predict, /health, /genes)
│   └── services/                   # Singleton GraphService & ML PredictorService
│
├── frontend/                       # React 18 + Vite + TailwindCSS Frontend
│   ├── src/
│   │   ├── components/             # GraphCanvas, ResearchPanel, LandingPage, UI controls
│   │   ├── services/               # API client (api.ts) & fallback mock handler
│   │   ├── types/                  # TypeScript interface definitions
│   │   ├── App.tsx                 # Main layout & router workspace controller
│   │   └── index.css               # Design system & CSS custom properties
│   ├── package.json
│   └── vite.config.ts
│
├── data/                           # Graph & Model Artifacts
│   ├── processed/
│   │   ├── bioweaver_graph.pkl     # Serialized NetworkX heterogeneous graph
│   │   ├── node_embeddings.csv     # 128D Node2Vec embedding representations
│   │   └── random_forest_model.pkl # Trained Random Forest classifier
│   └── raw/                        # Original raw dataset inputs
│
├── src/                            # Machine Learning & Graph Pipeline Modules
│   ├── graph/                      # NetworkX graph construction scripts
│   ├── string/                     # STRING API data fetchers
│   ├── embeddings/                 # Node2Vec generation pipeline
│   └── models/                     # Model training & cross-validation scripts
│
├── scripts/                        # Utility & Export Scripts
│   └── export_graph.py             # Offline graph serializer script
│
├── requirements.txt                # Python backend dependencies
└── README.md                       # Project documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Python**: `3.10+`
- **Node.js**: `v18+` & **npm**

---

### 1. Backend Setup

```bash
# Navigate to project root
cd bioweaver

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

The backend server will start at **`http://localhost:8000`**. You can verify API docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd bioweaver/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔌 API Documentation

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/graph/{gene}` | `GET` | Returns 1-hop direct genes, direct diseases, biological pathways, and valid 2-hop candidate diseases for a gene symbol. |
| `/genes` | `GET` | Returns an array of all 12,026 gene symbols available in the knowledge graph. |
| `/predict` | `POST` | Accepts `{ "gene": "BRCA1", "disease": "breast cancer" }` and returns ML association prediction (1/0) and probability score. |
| `/health` | `GET` | Returns server health and asset initialization status. |

### Sample Endpoint Response (`GET /graph/BRCA1`):
```json
{
  "gene": "BRCA1",
  "directGenes": [
    { "id": "RAD51", "label": "RAD51", "type": "gene", "relationship": "interacts_with", "score": 0.999 },
    { "id": "MYC", "label": "MYC", "type": "gene", "relationship": "interacts_with", "score": 0.999 }
  ],
  "directDiseases": [
    { "id": "breast-ovarian cancer, familial, susceptibility to, 1", "label": "breast-ovarian cancer, familial, susceptibility to, 1", "type": "disease", "relationship": "causes", "score": 1.0 }
  ],
  "indirectDiseases": [
    {
      "id": "Burkitt lymphoma",
      "disease": "Burkitt lymphoma",
      "through_gene": "MYC",
      "score": 0.999,
      "path": ["BRCA1", "MYC", "Burkitt lymphoma"],
      "relationship": "causes"
    }
  ],
  "pathways": [
    { "id": "DNA Repair Pathway", "label": "DNA Repair Pathway", "type": "pathway", "relationship": "participates_in", "score": 0.95 }
  ]
}
```

---

## 👩‍💻 Author

**Kathyayini Prabhu**  
*Artificial Intelligence & Data Science Specialist*  
- **GitHub**: [@Kathyayini26](https://github.com/Kathyayini26)  
- **Project**: BioWeaver Biomedical Knowledge Graph Platform

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
