import pandas as pd

# Load cleaned dataset
df = pd.read_csv("data/processed/gene_disease_cleaned.csv")

# Extract unique genes
genes = sorted(df["subject_label"].unique())

print("Total unique genes:", len(genes))

# Save to CSV
pd.DataFrame({"gene": genes}).to_csv(
    "data/processed/gene_list.csv",
    index=False
)

print("gene_list.csv created successfully.")