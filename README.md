# BioWeaver

BioWeaver is an AI-powered biomedical knowledge graph that integrates gene–disease associations with protein–protein interactions to enable machine learning-based prediction of potential gene–disease relationships.

## Project Overview

The project combines data from the Monarch Initiative and the STRING database to construct a heterogeneous biomedical knowledge graph. The graph is transformed into low-dimensional vector representations using Node2Vec, and these embeddings are used to generate a machine learning dataset for gene–disease association prediction.

## Project Structure

```
BIOWEAVER
│
├── data
│   ├── raw
│   └── processed
│
├── src
│   ├── graph
│   ├── string
│   ├── embeddings
│   ├── models
│   ├── scoring
│   └── evaluation
│
├── frontend
├── notebooks
├── docs
├── README.md
├── requirements.txt
└── LICENSE
```

## Dataset Statistics

### Monarch Dataset

| Metric | Count |
|--------|------:|
| Original Relationships | 7,178 |
| Duplicate Relationships Removed | 217 |
| Clean Gene–Disease Relationships | 6,961 |
| Unique Genes | 4,800 |
| Unique Diseases | 6,571 |

### STRING Protein Interaction Dataset

| Metric | Count |
|--------|------:|
| Protein–Protein Interactions | 100,554 |

### Final Knowledge Graph

| Metric | Count |
|--------|------:|
| Total Nodes | 18,597 |
| Total Edges | 107,457 |

### Machine Learning Dataset

| Metric | Count |
|--------|------:|
| Positive Samples | 6,961 |
| Negative Samples | 6,961 |
| Total Samples | 13,922 |
| Features per Sample | 256 |

## Methodology

1. Load the Monarch gene–disease association dataset.
2. Clean the dataset by removing duplicate relationships.
3. Build a biomedical knowledge graph using NetworkX.
4. Extract all unique genes from the graph.
5. Retrieve protein–protein interactions from the STRING database using its API.
6. Merge the STRING interaction network with the biomedical knowledge graph.
7. Generate 128-dimensional node embeddings using Node2Vec.
8. Create balanced positive and negative gene–disease samples.
9. Construct a machine learning dataset by concatenating gene and disease embeddings into 256-dimensional feature vectors.
10. Train a machine learning model for gene–disease association prediction.

## Technologies Used

- Python
- Pandas
- NumPy
- NetworkX
- Node2Vec
- Gensim
- Scikit-learn
- Git
- GitHub

## Generated Files

| File | Description |
|------|-------------|
| gene_disease_cleaned.csv | Cleaned Monarch dataset |
| gene_list.csv | List of unique genes |
| string_interactions.csv | Protein interaction data retrieved from STRING |
| bioweaver_graph.pkl | Biomedical knowledge graph |
| node_embeddings.csv | 128-dimensional node embeddings |
| training_dataset.csv | Machine learning training dataset |

## Pipeline

```
Monarch Dataset
        +
STRING Database
        │
        ▼
Data Cleaning
        │
        ▼
Knowledge Graph Construction
        │
        ▼
STRING Integration
        │
        ▼
Merged Biomedical Graph
        │
        ▼
Node2Vec Embedding Generation
        │
        ▼
Training Dataset Creation
        │
        ▼
Machine Learning Model
        │
        ▼
Gene–Disease Association Prediction
```

## Author

Kathyayini Prabhu

Artificial Intelligence and Data Science Student

GitHub: https://github.com/Kathyayini26

## License

This project is licensed under the MIT License.
