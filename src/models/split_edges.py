import pandas as pd
import random
from collections import defaultdict

# --------------------------------------------------
# Load cleaned Monarch dataset
# --------------------------------------------------

data = pd.read_csv(
    "data/processed/gene_disease_cleaned.csv"
)

print("=" * 60)
print("ORIGINAL DATA")
print("=" * 60)
print("Relationships :", len(data))

# --------------------------------------------------
# Count degree of every Gene and Disease
# --------------------------------------------------

gene_degree = defaultdict(int)
disease_degree = defaultdict(int)

for _, row in data.iterrows():

    gene = row["subject_label"]
    disease = row["object_label"]

    gene_degree[gene] += 1
    disease_degree[disease] += 1

print("\nUnique Genes    :", len(gene_degree))
print("Unique Diseases :", len(disease_degree))

# --------------------------------------------------
# Shuffle edges
# --------------------------------------------------

random.seed(42)

edges = data.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

# --------------------------------------------------
# Degree-safe split
# --------------------------------------------------

train_rows = []
test_rows = []

target_test_size = int(len(edges) * 0.20)

for _, row in edges.iterrows():

    gene = row["subject_label"]
    disease = row["object_label"]

    # Move to test only if both endpoints
    # still keep at least one training edge

    if (
        len(test_rows) < target_test_size
        and gene_degree[gene] > 1
        and disease_degree[disease] > 1
    ):

        test_rows.append(row)

        gene_degree[gene] -= 1
        disease_degree[disease] -= 1

    else:

        train_rows.append(row)

# --------------------------------------------------
# Convert to DataFrame
# --------------------------------------------------

train_edges = pd.DataFrame(train_rows)
test_edges = pd.DataFrame(test_rows)

print("\n" + "=" * 60)
print("DEGREE-SAFE SPLIT COMPLETED")
print("=" * 60)

print("Training Edges :", len(train_edges))
print("Testing Edges  :", len(test_edges))

print("\nTraining Percentage :",
      round(len(train_edges) / len(data) * 100, 2), "%")

print("Testing Percentage  :",
      round(len(test_edges) / len(data) * 100, 2), "%")

# --------------------------------------------------
# Verify no isolated Gene
# --------------------------------------------------

train_gene_degree = defaultdict(int)
train_disease_degree = defaultdict(int)

for _, row in train_edges.iterrows():

    train_gene_degree[row["subject_label"]] += 1
    train_disease_degree[row["object_label"]] += 1

isolated_genes = sum(
    1 for degree in train_gene_degree.values()
    if degree == 0
)

isolated_diseases = sum(
    1 for degree in train_disease_degree.values()
    if degree == 0
)

print("\nVerification")
print("-" * 60)

print("Genes with zero training edges    :", isolated_genes)
print("Diseases with zero training edges :", isolated_diseases)

# --------------------------------------------------
# Save
# --------------------------------------------------

train_edges.to_csv(
    "data/processed/train_edges.csv",
    index=False
)

test_edges.to_csv(
    "data/processed/test_edges.csv",
    index=False
)

print("\nFiles saved successfully!")

print("Train -> data/processed/train_edges.csv")
print("Test  -> data/processed/test_edges.csv")
import pandas as pd

df = pd.read_csv("data/processed/gene_disease_cleaned.csv")

print(df["object_label"].value_counts().describe())
