import pickle

GRAPH_PATH = "data/processed/bioweaver_graph.pkl"

with open(GRAPH_PATH, "rb") as f:
    graph = pickle.load(f)

gene = "H3-2"

if gene not in graph:
    print(f"{gene} not found")
    exit()

print(f"\n2-hop relationships from {gene}\n")

# First-hop neighbors
for associated_gene in graph.neighbors(gene):

    # Only inspect genes as intermediate nodes
    # Adjust this condition depending on your graph's node attributes
    print(f"\n{gene} -> {associated_gene}")

    for disease in graph.neighbors(associated_gene):
        if disease != gene:
            print(f"    {associated_gene} -> {disease}")