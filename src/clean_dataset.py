import pandas as pd

# Load the dataset
df = pd.read_csv(
    "data/raw/gene_disease.9606.tsv.gz",
    sep="\t",
    compression="gzip"
)

print("=" * 60)
print("DATA CLEANING")
print("=" * 60)

# Original shape
print("\nOriginal Shape:")
print(df.shape)

# Remove duplicate rows
df = df.drop_duplicates()

print("\nAfter Removing Duplicates:")
print(df.shape)

# Drop columns that are completely empty
columns_to_drop = [
    "negated",
    "qualifiers",
    "publications",
    "has_evidence"
]

df = df.drop(columns=columns_to_drop)

print("\nAfter Removing Empty Columns:")
print(df.shape)

# Check missing values
print("\nMissing Values:")
print(df.isnull().sum())

# Save cleaned dataset
df.to_csv(
    "data/processed/gene_disease_cleaned.csv",
    index=False
)

print("\n✅ Cleaned dataset saved successfully!")
print("Location: data/processed/gene_disease_cleaned.csv")