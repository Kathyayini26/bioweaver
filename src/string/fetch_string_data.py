import pandas as pd
import requests
import time

# --------------------------
# Load genes
# --------------------------
genes = pd.read_csv(
    "data/processed/gene_list.csv"
)["gene"].tolist()

print(f"Total genes: {len(genes)}")

# STRING API
URL = "https://string-db.org/api/json/network"

BATCH_SIZE = 100

interactions = []

# --------------------------
# Process every gene
# --------------------------
for start in range(0, len(genes), BATCH_SIZE):

    batch = genes[start:start + BATCH_SIZE]

    print(f"\nProcessing genes {start+1} to {start+len(batch)}")

    for gene in batch:

        params = {
            "identifiers": gene,
            "species": 9606
        }

        try:

            response = requests.get(
                URL,
                params=params,
                timeout=30
            )

            if response.status_code == 200:

                data = response.json()

                for row in data:

                    interactions.append({
                        "gene1": row["preferredName_A"],
                        "gene2": row["preferredName_B"],
                        "score": row["score"]
                    })

        except Exception as e:
            print(f"{gene}: {e}")

        time.sleep(0.2)

# --------------------------
# Remove duplicates
# --------------------------
interaction_df = pd.DataFrame(interactions)

interaction_df = interaction_df.drop_duplicates()

# --------------------------
# Save
# --------------------------
interaction_df.to_csv(
    "data/processed/string_interactions.csv",
    index=False
)

print("\n==============================")
print("Finished")
print("==============================")
print("Total interactions:", len(interaction_df))