import pandas as pd
import networkx as nx

# Load cleaned dataset
df = pd.read_csv("data/processed/gene_disease_cleaned.csv")

# Create graph
G = nx.DiGraph()

for _, row in df.iterrows():
    G.add_node(row["subject_label"], node_type="Gene")
    G.add_node(row["object_label"], node_type="Disease")
    G.add_edge(
        row["subject_label"],
        row["object_label"],
        relationship=row["predicate"]
    )

print("=" * 60)
print("GRAPH ANALYSIS")
print("=" * 60)

print(f"Total Nodes : {G.number_of_nodes()}")
print(f"Total Edges : {G.number_of_edges()}")

# Gene nodes
gene_nodes = [
    n for n, d in G.nodes(data=True)
    if d["node_type"] == "Gene"
]

# Disease nodes
disease_nodes = [
    n for n, d in G.nodes(data=True)
    if d["node_type"] == "Disease"
]

print(f"\nGene Nodes : {len(gene_nodes)}")
print(f"Disease Nodes : {len(disease_nodes)}")

# Top 10 genes with highest degree
print("\nTop 10 Most Connected Genes")

gene_degree = []

for gene in gene_nodes:
    gene_degree.append((gene, G.degree(gene)))

gene_degree = sorted(gene_degree,
                     key=lambda x: x[1],
                     reverse=True)

for gene, degree in gene_degree[:10]:
    print(f"{gene} : {degree}")

# Top diseases
print("\nTop 10 Diseases Connected to Most Genes")

disease_degree = []

for disease in disease_nodes:
    disease_degree.append((disease, G.degree(disease)))

disease_degree = sorted(
    disease_degree,
    key=lambda x: x[1],
    reverse=True
)

for disease, degree in disease_degree[:10]:
    print(f"{disease} : {degree}")

total = sum(degree for _, degree in disease_degree)
print("\nTotal Degree of All Diseases:", total)