import pandas as pd
import networkx as nx

# Load cleaned dataset
df = pd.read_csv("data/processed/gene_disease_cleaned.csv")

# Create directed graph
G = nx.DiGraph()

# Add nodes and edges
for _, row in df.iterrows():

    gene = row["subject_label"]
    disease = row["object_label"]
    relation = row["predicate"]

    # Gene node
    G.add_node(gene, node_type="Gene")

    # Disease node
    G.add_node(disease, node_type="Disease")

    # Relationship
    G.add_edge(gene, disease, relationship=relation)

print("=" * 60)
print("BIOWEAVER KNOWLEDGE GRAPH")
print("=" * 60)

print("Total Nodes :", G.number_of_nodes())
print("Total Edges :", G.number_of_edges())

print("\nSample Relationships:")

for i, (u, v, data) in enumerate(G.edges(data=True)):
    print(f"{u} ----> {v} ({data['relationship']})")

    if i == 9:
        break