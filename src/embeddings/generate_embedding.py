import pickle
import pandas as pd
import networkx as nx
from node2vec import Node2Vec

# --------------------------------------------------
# Load Knowledge Graph
# --------------------------------------------------

with open("data/processed/bioweaver_graph.pkl", "rb") as f:
    G = pickle.load(f)

print("=" * 60)
print("GRAPH LOADED")
print("=" * 60)

print("Nodes :", G.number_of_nodes())
print("Edges :", G.number_of_edges())

# --------------------------------------------------
# Validate Graph
# --------------------------------------------------

isolated_nodes = list(nx.isolates(G))

print("\nGraph Validation")
print("-" * 60)
print("Isolated Nodes :", len(isolated_nodes))

if len(isolated_nodes) == 0:
    print("Graph validation successful.")
else:
    print("Warning! Graph contains isolated nodes.")

# --------------------------------------------------
# Generate Node2Vec Embeddings
# --------------------------------------------------

print("\nInitializing Node2Vec...")

node2vec = Node2Vec(
    G,
    dimensions=128,
    walk_length=30,
    num_walks=200,
    workers=4,
    seed=42
)

print("\nTraining Node2Vec model...")

model = node2vec.fit(
    window=10,
    min_count=1,
    batch_words=4
)

print("Training completed!")

# --------------------------------------------------
# Save Embeddings
# --------------------------------------------------

embeddings = []

for node in G.nodes():

    if node in model.wv:

        vector = model.wv[node]

        embeddings.append(
            [node] + vector.tolist()
        )

columns = ["node"] + [
    f"dim_{i}" for i in range(128)
]

embedding_df = pd.DataFrame(
    embeddings,
    columns=columns
)

embedding_df.to_csv(
    "data/processed/node_embeddings.csv",
    index=False
)

print("\n" + "=" * 60)
print("EMBEDDINGS GENERATED")
print("=" * 60)

print("Total Embeddings :", len(embedding_df))
print("Embedding Dimension :", 128)

print("\nSaved to:")
print("data/processed/node_embeddings.csv")