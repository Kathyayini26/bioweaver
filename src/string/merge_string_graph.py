import pandas as pd
import networkx as nx

# ----------------------------
# Load Monarch dataset
# ----------------------------
monarch = pd.read_csv(
    "data/processed/gene_disease_cleaned.csv"
)

# ----------------------------
# Load STRING interactions
# ----------------------------
string = pd.read_csv(
    "data/processed/string_interactions.csv"
)

# ----------------------------
# Create graph
# ----------------------------
G = nx.DiGraph()

# ============================
# Add Gene -> Disease edges
# ============================

for _, row in monarch.iterrows():

    gene = row["subject_label"]
    disease = row["object_label"]

    G.add_node(gene, node_type="Gene")
    G.add_node(disease, node_type="Disease")

    G.add_edge(
        gene,
        disease,
        relationship="causes"
    )

# ============================
# Add Gene -> Gene edges
# ============================

for _, row in string.iterrows():

    gene1 = row["gene1"]
    gene2 = row["gene2"]

    G.add_node(gene1, node_type="Gene")
    G.add_node(gene2, node_type="Gene")

    G.add_edge(
        gene1,
        gene2,
        relationship="interacts_with",
        score=row["score"]
    )

print("=" * 60)
print("FINAL BIOWEAVER GRAPH")
print("=" * 60)

print("Nodes :", G.number_of_nodes())
print("Edges :", G.number_of_edges())

print("\nSample edges:\n")

count = 0

for u, v, data in G.edges(data=True):

    print(u, "---->", v, data)

    count += 1

    if count == 15:
        break

    causes = 0
interacts = 0

for _, _, data in G.edges(data=True):
    if data["relationship"] == "causes":
        causes += 1
    elif data["relationship"] == "interacts_with":
        interacts += 1

print("\nCauses edges:", causes)
print("Interaction edges:", interacts)

import networkx as nx

import pickle

with open("data/processed/bioweaver_graph.pkl", "wb") as f:
    pickle.dump(G, f)

print("Graph saved successfully!")