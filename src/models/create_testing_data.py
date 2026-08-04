import pandas as pd
import numpy as np
import random

# --------------------------------------------------
# Reproducibility
# --------------------------------------------------

random.seed(42)
np.random.seed(42)

# --------------------------------------------------
# Load Node Embeddings
# --------------------------------------------------

embeddings = pd.read_csv(
    "data/processed/node_embeddings.csv"
)

print("=" * 60)
print("NODE EMBEDDINGS LOADED")
print("=" * 60)

print("Total Nodes :", len(embeddings))

# --------------------------------------------------
# Load Testing Relationships
# --------------------------------------------------

relationships = pd.read_csv(
    "data/processed/test_edges.csv"
)

print("\n" + "=" * 60)
print("TEST RELATIONSHIPS LOADED")
print("=" * 60)

print("Relationships :", len(relationships))

# --------------------------------------------------
# Positive Samples
# --------------------------------------------------

positive_samples = relationships[
    ["subject_label", "object_label"]
].copy()

positive_samples.columns = [
    "gene",
    "disease"
]

positive_samples["label"] = 1

print("\nPositive Samples :", len(positive_samples))

# --------------------------------------------------
# Negative Samples
# --------------------------------------------------

genes = positive_samples["gene"].unique()

diseases = positive_samples["disease"].unique()

positive_pairs = set(
    zip(
        positive_samples["gene"],
        positive_samples["disease"]
    )
)

negative_samples = []
negative_pairs = set()

while len(negative_samples) < len(positive_samples):

    gene = random.choice(genes)
    disease = random.choice(diseases)

    if (
        (gene, disease) not in positive_pairs
        and
        (gene, disease) not in negative_pairs
    ):

        negative_samples.append(
            [gene, disease, 0]
        )

        negative_pairs.add(
            (gene, disease)
        )

negative_samples = pd.DataFrame(
    negative_samples,
    columns=[
        "gene",
        "disease",
        "label"
    ]
)

print("Negative Samples :", len(negative_samples))

# --------------------------------------------------
# Combine Samples
# --------------------------------------------------

testing_data = pd.concat(
    [
        positive_samples,
        negative_samples
    ],
    ignore_index=True
)

testing_data = testing_data.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

print("\nTotal Samples :", len(testing_data))

print("\nLabel Distribution")

print(
    testing_data["label"].value_counts()
)

# --------------------------------------------------
# Convert Embeddings into Dictionary
# --------------------------------------------------

embedding_dict = {}

for _, row in embeddings.iterrows():

    node = row["node"]

    vector = row.iloc[1:].values.astype(float)

    embedding_dict[node] = vector

print("\nEmbedding Dictionary Created")
print("Total Nodes :", len(embedding_dict))

# --------------------------------------------------
# Create Feature Matrix
# --------------------------------------------------

features = []
labels = []

missing_gene = 0
missing_disease = 0

for _, row in testing_data.iterrows():

    gene = row["gene"]
    disease = row["disease"]

    if gene not in embedding_dict:
        missing_gene += 1

    if disease not in embedding_dict:
        missing_disease += 1

    if gene in embedding_dict and disease in embedding_dict:

        gene_embedding = embedding_dict[gene]

        disease_embedding = embedding_dict[disease]

        feature_vector = np.concatenate(
            [
                gene_embedding,
                disease_embedding
            ]
        )

        features.append(feature_vector)

        labels.append(row["label"])

# --------------------------------------------------
# Save Testing Dataset
# --------------------------------------------------

feature_df = pd.DataFrame(features)

feature_df["label"] = labels

feature_df.to_csv(
    "data/processed/testing_dataset.csv",
    index=False
)

# --------------------------------------------------
# Summary
# --------------------------------------------------

print("\n" + "=" * 60)
print("TESTING DATASET CREATED")
print("=" * 60)

print("Samples :", len(feature_df))
print("Features :", feature_df.shape[1] - 1)

print("\nMissing Gene Embeddings :", missing_gene)
print("Missing Disease Embeddings :", missing_disease)

print("\nSaved to:")
print("data/processed/testing_dataset.csv")