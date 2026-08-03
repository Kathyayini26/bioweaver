import pandas as pd

df = pd.read_csv("data/processed/string_interactions.csv")

print("=" * 50)
print("STRING DATASET ANALYSIS")
print("=" * 50)

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 10 rows:")
print(df.head(10))

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())

print("\nTop interacting genes:")

print(df["gene1"].value_counts().head(10))