import pandas as pd

# Load dataset
df = pd.read_csv(
    "data/raw/gene_disease.9606.tsv.gz",
    sep="\t",
    compression="gzip"
)

print("=" * 60)
print("DATASET LOADED SUCCESSFULLY")
print("=" * 60)

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 Rows:")
print(df.head())

print("\nDataset Information:")
print(df.info())