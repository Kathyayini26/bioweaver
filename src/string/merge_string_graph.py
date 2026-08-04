import pandas as pd
import networkx as nx
import pickle

# --------------------------------------------------
# Load Training Monarch Edges
# --------------------------------------------------

monarch = pd.read_csv(
    "data/processed/train_edges.csv"
)

# --------------------------------------------------
# Load STRING Interactions
# --------------------------------------------------

string = pd.read_csv(
    "data/processed/string_interactions.csv"
)

# --------------------------------------------------
# Create Knowledge Graph
# --------------------------------------------------

G = nx.DiGraph()

# --------------------------------------------------
# Add Gene → Disease Edges
# --------------------------------------------------

for _, row in monarch.iterrows():

    gene = row["subject_label"]
    disease = row["object_label"]

    G.add_node(
        gene,
        node_type="Gene"
    )

    G.add_node(
        disease,
        node_type="Disease"
    )

    G.add_edge(
        gene,
        disease,
        relationship="causes"
    )

# --------------------------------------------------
# Add Gene → Gene STRING Edges
# --------------------------------------------------

for _, row in string.iterrows():

    gene1 = row["gene1"]
    gene2 = row["gene2"]

    G.add_node(
        gene1,
        node_type="Gene"
    )

    G.add_node(
        gene2,
        node_type="Gene"
    )

    G.add_edge(
        gene1,
        gene2,
        relationship="interacts_with",
        score=row["score"]
    )

# --------------------------------------------------
# Graph Summary
# --------------------------------------------------

print("=" * 60)
print("FINAL BIOWEAVER GRAPH")
print("=" * 60)

print("Nodes :", G.number_of_nodes())
print("Edges :", G.number_of_edges())

# --------------------------------------------------
# Count Edge Types
# --------------------------------------------------

causes = 0
interacts = 0

for _, _, edge_data in G.edges(data=True):

    if edge_data["relationship"] == "causes":
        causes += 1

    elif edge_data["relationship"] == "interacts_with":
        interacts += 1

print("\nCauses Edges      :", causes)
print("Interaction Edges :", interacts)

# --------------------------------------------------
# Sample Edges
# --------------------------------------------------

print("\nSample Edges:\n")

count = 0

for u, v, edge_data in G.edges(data=True):

    print(u, "---->", v, edge_data)

    count += 1

    if count == 15:
        break

# --------------------------------------------------
# Graph Validation
# --------------------------------------------------

print("\n" + "=" * 60)
print("GRAPH VALIDATION")
print("=" * 60)

isolated_nodes = list(nx.isolates(G))

print("Isolated Nodes :", len(isolated_nodes))

if len(isolated_nodes) == 0:
    print("Graph validation successful.")
else:
    print("Warning: Graph contains isolated nodes.")

# --------------------------------------------------
# Save Graph
# --------------------------------------------------

with open(
    "data/processed/bioweaver_graph.pkl",
    "wb"
) as f:

    pickle.dump(G, f)

print("\nGraph saved successfully!")
print("Saved to: data/processed/bioweaver_graph.pkl")