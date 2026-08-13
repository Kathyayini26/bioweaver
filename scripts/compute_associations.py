import os
import json
import joblib
import pandas as pd
import numpy as np

def main():
    print("Step 1: Computing real associations from actual datasets...")
    
    # Paths to files
    train_edges_path = "data/processed/train_edges.csv"
    string_path = "data/processed/string_interactions.csv"
    embeddings_path = "data/processed/node_embeddings.csv"
    model_path = "data/processed/random_forest_model.pkl"
    output_path = "frontend/src/data/realAssociations.json"
    
    # Load files
    if not os.path.exists(train_edges_path):
        raise FileNotFoundError(f"Missing train edges at {train_edges_path}")
    if not os.path.exists(string_path):
        raise FileNotFoundError(f"Missing STRING interactions at {string_path}")
    if not os.path.exists(embeddings_path):
        raise FileNotFoundError(f"Missing embeddings at {embeddings_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Missing model at {model_path}")
        
    print("Loading datasets...")
    df_gd = pd.read_csv(train_edges_path)
    df_str = pd.read_csv(string_path)
    df_emb = pd.read_csv(embeddings_path)
    model = joblib.load(model_path)
    
    # Load embeddings dictionary
    print("Processing embeddings...")
    embeddings = {}
    for _, row in df_emb.iterrows():
        node_name = row["node"]
        vector = row.iloc[1:].values.astype(float)
        embeddings[node_name] = vector
        
    def get_association_score(gene, disease):
        gene_emb = embeddings.get(gene)
        disease_emb = embeddings.get(disease)
        if gene_emb is None or disease_emb is None:
            return None
        features = np.concatenate([gene_emb, disease_emb]).reshape(1, -1)
        input_df = pd.DataFrame(features, columns=[str(i) for i in range(256)])
        probs = model.predict_proba(input_df)[0]
        return float(probs[1])

    # Build direct map: gene -> set of diseases
    print("Building direct gene-disease map...")
    direct_gd = {}
    for _, row in df_gd.iterrows():
        gene = str(row["subject_label"]).strip()
        disease = str(row["object_label"]).strip()
        if gene not in direct_gd:
            direct_gd[gene] = set()
        direct_gd[gene].add(disease)
        
    # Build PPI network: gene -> list of (neighbor_gene, ppi_score)
    print("Building PPI interaction map...")
    ppi_map = {}
    for _, row in df_str.iterrows():
        g1 = str(row["gene1"]).strip()
        g2 = str(row["gene2"]).strip()
        score = float(row["score"])
        if pd.isna(score):
            continue
            
        if g1 not in ppi_map:
            ppi_map[g1] = []
        if g2 not in ppi_map:
            ppi_map[g2] = []
            
        ppi_map[g1].append((g2, score))
        ppi_map[g2].append((g1, score))

    # All unique genes from both datasets
    all_genes = set(direct_gd.keys()).union(ppi_map.keys())
    print(f"Total unique genes to process: {len(all_genes)}")
    
    results = {}
    
    for idx, gene in enumerate(all_genes):
        if idx % 500 == 0:
            print(f"Processed {idx} genes...")
            
        direct_list = []
        indirect_list = []
        
        # 1. Compute Direct Associations
        direct_diseases = direct_gd.get(gene, set())
        for disease in direct_diseases:
            score = get_association_score(gene, disease)
            if score is None:
                continue # Exclude if score/embedding is missing
            direct_list.append({
                "disease": disease,
                "score": score,
                "path": [gene, disease]
            })
            
        # Sort direct list by score descending
        direct_list = sorted(direct_list, key=lambda x: x["score"], reverse=True)
        
        # 2. Compute Indirect Associations (2-hop: gene -> neighbor_gene -> disease)
        neighbors = ppi_map.get(gene, [])
        seen_indirect_diseases = {} # disease -> best_entry
        
        for neighbor, ppi_score in neighbors:
            neighbor_diseases = direct_gd.get(neighbor, set())
            for disease in neighbor_diseases:
                # Exclude any disease already reached directly
                if disease in direct_diseases:
                    continue
                # Exclude if it's the gene itself (self-referential)
                if disease == gene:
                    continue
                    
                neighbor_score = get_association_score(neighbor, disease)
                if neighbor_score is None:
                    continue # Exclude if score/embedding is missing
                    
                indirect_score = ppi_score * neighbor_score
                path = [gene, neighbor, disease]
                
                # Keep the path with the highest score if multiple neighbors connect to the same disease
                if disease in seen_indirect_diseases:
                    if indirect_score > seen_indirect_diseases[disease]["score"]:
                        seen_indirect_diseases[disease] = {
                            "disease": disease,
                            "score": indirect_score,
                            "path": path
                        }
                else:
                    seen_indirect_diseases[disease] = {
                        "disease": disease,
                        "score": indirect_score,
                        "path": path
                    }
                    
        indirect_list = sorted(list(seen_indirect_diseases.values()), key=lambda x: x["score"], reverse=True)
        
        # Only save if there is at least some direct or indirect associations
        if direct_list or indirect_list:
            results[gene] = {
                "direct": direct_list,
                "indirect": indirect_list
            }
            
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print("Writing results to JSON...")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"✅ Success! Saved {len(results)} genes associations to {output_path}")

if __name__ == "__main__":
    main()
