import pandas as pd
import numpy as np
import random

# ----------------------------
# Load Node Embeddings
# ----------------------------

embeddings = pd.read_csv(
    "data/processed/node_embeddings.csv"
)

print("=" * 60)
print("NODE EMBEDDINGS LOADED")
print("=" * 60)

print("Total Nodes:", len(embeddings))
print("\nFirst 5 rows:")
print(embeddings.head())

# ----------------------------
# Load Gene-Disease Relationships
# ----------------------------

relationships = pd.read_csv(
    "data/processed/gene_disease_cleaned.csv"
)

print("\n" + "=" * 60)
print("GENE-DISEASE RELATIONSHIPS LOADED")
print("=" * 60)

print("Total Relationships:", len(relationships))

print("\nFirst 5 Relationships:")
print(
    relationships[
        ["subject_label", "object_label"]
    ].head()
)

# ----------------------------
# Create Positive Samples
# ----------------------------

positive_samples = relationships[
    ["subject_label", "object_label"]
].copy()

positive_samples.columns = [
    "gene",
    "disease"
]

positive_samples["label"] = 1

print("\n" + "=" * 60)
print("POSITIVE SAMPLES CREATED")
print("=" * 60)

print("Total Positive Samples:", len(positive_samples))

print("\nFirst 5 Positive Samples:")
print(positive_samples.head())

# ----------------------------
# Create Negative Samples
# ----------------------------

# Get all unique genes
genes = positive_samples["gene"].unique()

# Get all unique diseases
diseases = positive_samples["disease"].unique()

# Existing relationships
positive_pairs = set(
    zip(
        positive_samples["gene"],
        positive_samples["disease"]
    )
)

negative_samples = []

while len(negative_samples) < len(positive_samples):

    gene = random.choice(genes)
    disease = random.choice(diseases)

    if (gene, disease) not in positive_pairs:

        negative_samples.append(
            [gene, disease, 0]
        )

negative_samples = pd.DataFrame(
    negative_samples,
    columns=["gene", "disease", "label"]
)

print("\n" + "=" * 60)
print("NEGATIVE SAMPLES CREATED")
print("=" * 60)

print("Total Negative Samples:", len(negative_samples))

print("\nFirst 5 Negative Samples:")
print(negative_samples.head())

# ----------------------------
# Combine Positive & Negative Samples
# ----------------------------

training_data = pd.concat(
    [positive_samples, negative_samples],
    ignore_index=True
)

# Shuffle dataset
training_data = training_data.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

print("\n" + "=" * 60)
print("TRAINING DATASET CREATED")
print("=" * 60)

print("Total Samples:", len(training_data))

print("\nLabel Distribution:")
print(training_data["label"].value_counts())

print("\nFirst 5 Samples:")
print(training_data.head())

# ----------------------------
# Convert Embeddings into Dictionary
# ----------------------------

embedding_dict = {}

for _, row in embeddings.iterrows():

    node = row["node"]

    vector = row.iloc[1:].values.astype(float)

    embedding_dict[node] = vector

print("\nEmbedding Dictionary Created")
print("Total Nodes:", len(embedding_dict))

# ----------------------------
# Create Feature Matrix
# ----------------------------

features = []
labels = []

for _, row in training_data.iterrows():

    gene = row["gene"]
    disease = row["disease"]

    if gene in embedding_dict and disease in embedding_dict:

        gene_embedding = embedding_dict[gene]

        disease_embedding = embedding_dict[disease]

        feature_vector = np.concatenate(
            [gene_embedding, disease_embedding]
        )

        features.append(feature_vector)

        labels.append(row["label"])

# ----------------------------
# Save Training Dataset
# ----------------------------

feature_df = pd.DataFrame(features)

feature_df["label"] = labels

feature_df.to_csv(
    "data/processed/training_dataset.csv",
    index=False
)

print("\n" + "=" * 60)
print("TRAINING DATASET CREATED")
print("=" * 60)

print("Samples:", len(feature_df))
print("Features:", feature_df.shape[1] - 1)

print("\nSaved to:")
print("data/processed/training_dataset.csv")