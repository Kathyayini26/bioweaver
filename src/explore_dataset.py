import pandas as pd

# Load dataset
df = pd.read_csv(
    "data/raw/gene_disease.9606.tsv.gz",
    sep="\t",
    compression="gzip"
)

print("=" * 60)
print("DATASET EXPLORATION")
print("=" * 60)

# Number of records
print("\nTotal Relationships:")
print(len(df))

# Number of unique genes
print("\nUnique Genes:")
print(df["subject_label"].nunique())

# Number of unique diseases
print("\nUnique Diseases:")
print(df["object_label"].nunique())

# Relationship types
print("\nRelationship Types:")
print(df["predicate"].value_counts())

# Top 10 genes
print("\nTop 10 Genes:")
print(df["subject_label"].value_counts().head(10))

# Top 10 diseases
print("\nTop 10 Diseases:")
print(df["object_label"].value_counts().head(10))

# Data sources
print("\nKnowledge Sources:")
print(df["primary_knowledge_source"].value_counts())

# Duplicate rows
print("\nDuplicate Rows:")
print(df.duplicated().sum())

# Missing values
print("\nMissing Values:")
print(df.isnull().sum())