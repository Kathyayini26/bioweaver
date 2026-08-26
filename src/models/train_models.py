import os
import pickle
import numpy as np
import pandas as pd
import networkx as nx
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)
from node2vec import Node2Vec

def main():
    print("=" * 70)
    print("BIOWEAVER STRICT LEAKAGE-SAFE ML BENCHMARK PIPELINE")
    print("=" * 70)

    # 1. Load Knowledge Graph
    graph_path = "data/processed/bioweaver_graph.pkl"
    with open(graph_path, "rb") as f:
        G = pickle.load(f)

    print(f"[1/8] Loaded Knowledge Graph: {G.number_of_nodes()} Nodes, {G.number_of_edges()} Edges")

    # 2. Load Cleaned Positive Gene-Disease Edges
    gd_path = "data/processed/gene_disease_cleaned.csv"
    gd_df = pd.read_csv(gd_path)
    
    pos_pairs_set = set()
    for _, row in gd_df.iterrows():
        g = str(row["subject_label"]).strip()
        d = str(row["object_label"]).strip()
        if G.has_node(g) and G.has_node(d):
            if G.has_edge(g, d) or G.has_edge(d, g):
                pair = (g, d) if g < d else (d, g)
                pos_pairs_set.add(pair)

    pos_pairs = sorted(list(pos_pairs_set))
    print(f"[2/8] Extracted {len(pos_pairs)} Unique Positive Gene-Disease Edges present in Knowledge Graph.")

    # 3. Split Positive Edges into 80% Train / 20% Test (random_state=42)
    train_pos, test_pos = train_test_split(pos_pairs, test_size=0.20, random_state=42)
    train_pos_set = set(train_pos)
    test_pos_set = set(test_pos)

    # VERIFICATION 1: No overlap between train and test positive pairs
    overlap = train_pos_set.intersection(test_pos_set)
    assert len(overlap) == 0, f"ERROR: Train/Test positive pair overlap detected: {len(overlap)}"
    print(f"[3/8] Split Positive Edges: {len(train_pos)} Train Positives (80%), {len(test_pos)} Test Positives (20%).")
    print(f"      VERIFIED: Zero overlap between Train and Test positive pairs.")

    # 4. Construct Pruned Training Graph G_train (Remove ALL Test Positive Edges BEFORE Node2Vec)
    G_train = G.copy()
    removed_edges_count = 0
    for g, d in test_pos:
        if G_train.has_edge(g, d):
            G_train.remove_edge(g, d)
            removed_edges_count += 1
        if G_train.has_edge(d, g):
            G_train.remove_edge(d, g)
            removed_edges_count += 1

    print(f"[4/8] Pruned Training Graph Construction:")
    print(f"      Removed {removed_edges_count} directional edge connections corresponding to held-out test pairs.")
    print(f"      G_train Edges: {G_train.number_of_edges()} (Original: {G.number_of_edges()})")

    # VERIFICATION 2: No held-out test edge exists in G_train
    for g, d in test_pos:
        assert not G_train.has_edge(g, d) and not G_train.has_edge(d, g), \
            f"ERROR: Held-out test edge ({g}, {d}) still exists in G_train!"
    print("      VERIFIED: No held-out test edge exists in G_train used for Node2Vec.")

    # 5. Generate Node2Vec Embeddings ONLY on G_train
    print(f"[5/8] Generating Node2Vec Embeddings on G_train (Zero-Leakage)...")
    node2vec = Node2Vec(
        G_train,
        dimensions=64,
        walk_length=15,
        num_walks=30,
        workers=4,
        seed=42,
        quiet=True
    )
    n2v_model = node2vec.fit(window=5, min_count=1, batch_words=4)

    # Extract valid vectors & reject zero-vectors
    node_embeddings = {}
    zero_vec_count = 0
    for node in G_train.nodes():
        node_str = str(node)
        if node_str in n2v_model.wv:
            vec = n2v_model.wv[node_str]
            if np.linalg.norm(vec) > 1e-6:
                node_embeddings[node_str] = vec
            else:
                zero_vec_count += 1

    print(f"      Embeddings generated for {len(node_embeddings)} nodes. (Zero-vectors rejected: {zero_vec_count})")

    # VERIFICATION 3: Filter pairs to ensure no missing node embeddings are accepted
    valid_train_pos = [(g, d) for g, d in train_pos if g in node_embeddings and d in node_embeddings]
    valid_test_pos = [(g, d) for g, d in test_pos if g in node_embeddings and d in node_embeddings]
    print(f"      Valid Train Positives with embeddings: {len(valid_train_pos)} / {len(train_pos)}")
    print(f"      Valid Test Positives with embeddings : {len(valid_test_pos)} / {len(test_pos)}")

    # 6. Generate Balanced Negative Samples (Ensure test/train contamination is avoided)
    print(f"[6/8] Generating Balanced Negative Samples...")
    all_nodes = list(G_train.nodes())
    gene_nodes = [str(n) for n in all_nodes if G_train.nodes[n].get("node_type") == "Gene" and str(n) in node_embeddings]
    disease_nodes = [str(n) for n in all_nodes if G_train.nodes[n].get("node_type") == "Disease" and str(n) in node_embeddings]

    np.random.seed(42)
    train_neg_set = set()
    while len(train_neg_set) < len(valid_train_pos):
        g = str(np.random.choice(gene_nodes))
        d = str(np.random.choice(disease_nodes))
        pair = (g, d) if g < d else (d, g)
        if pair not in pos_pairs_set and pair not in train_neg_set:
            train_neg_set.add(pair)

    test_neg_set = set()
    while len(test_neg_set) < len(valid_test_pos):
        g = str(np.random.choice(gene_nodes))
        d = str(np.random.choice(disease_nodes))
        pair = (g, d) if g < d else (d, g)
        if pair not in pos_pairs_set and pair not in train_neg_set and pair not in test_neg_set:
            test_neg_set.add(pair)

    train_neg = list(train_neg_set)
    test_neg = list(test_neg_set)

    # VERIFICATION 4: No train/test pair contamination
    train_pairs_all = set(valid_train_pos).union(train_neg_set)
    test_pairs_all = set(valid_test_pos).union(test_neg_set)
    pair_intersection = train_pairs_all.intersection(test_pairs_all)
    assert len(pair_intersection) == 0, f"ERROR: Train/Test pair contamination detected: {len(pair_intersection)}"
    print(f"      Train Set: {len(valid_train_pos)} Positives + {len(train_neg)} Negatives = {len(valid_train_pos) + len(train_neg)} Total")
    print(f"      Test Set : {len(valid_test_pos)} Positives + {len(test_neg)} Negatives = {len(valid_test_pos) + len(test_neg)} Total")
    print(f"      VERIFIED: Zero overlap/contamination between all Train and Test pairs.")

    # 7. Feature Construction: Hadamard Operator (gene * disease) + Cosine Similarity
    def compute_edge_features(gene, disease):
        u = node_embeddings[gene]
        v = node_embeddings[disease]
        # Hadamard Operator (element-wise product)
        hadamard = u * v
        # Cosine Similarity
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)
        cosine = np.array([np.dot(u, v) / (norm_u * norm_v + 1e-9)])
        return np.concatenate([hadamard, cosine])

    X_train_list, y_train_list = [], []
    for g, d in valid_train_pos:
        X_train_list.append(compute_edge_features(g, d))
        y_train_list.append(1)
    for g, d in train_neg:
        X_train_list.append(compute_edge_features(g, d))
        y_train_list.append(0)

    X_test_list, y_test_list = [], []
    for g, d in valid_test_pos:
        X_test_list.append(compute_edge_features(g, d))
        y_test_list.append(1)
    for g, d in test_neg:
        X_test_list.append(compute_edge_features(g, d))
        y_test_list.append(0)

    X_train = np.array(X_train_list)
    y_train = np.array(y_train_list)
    X_test = np.array(X_test_list)
    y_test = np.array(y_test_list)

    print(f"[7/8] Feature Matrix Constructed: {X_train.shape[1]} features per edge (Hadamard 64D + Cosine 1D = 65D).")

    # 8. Train Regularized Random Forest Classifier
    print(f"[8/8] Training Regularized Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        min_samples_split=20,
        min_samples_leaf=10,
        max_features="sqrt",
        bootstrap=True,
        random_state=42,
        n_jobs=-1
    )

    rf_model.fit(X_train, y_train)
    print("      Model Training Completed Successfully.")

    # 9. Measured Performance Metrics
    train_preds = rf_model.predict(X_train)
    test_preds = rf_model.predict(X_test)
    test_probs = rf_model.predict_proba(X_test)[:, 1]

    train_acc = accuracy_score(y_train, train_preds)
    test_acc = accuracy_score(y_test, test_preds)
    precision = precision_score(y_test, test_preds)
    recall = recall_score(y_test, test_preds)
    f1 = f1_score(y_test, test_preds)
    roc_auc = roc_auc_score(y_test, test_probs)
    cm = confusion_matrix(y_test, test_preds)
    train_test_gap = abs(train_acc - test_acc)

    print("\n" + "=" * 70)
    print("FINAL MEASURED LEAKAGE-SAFE BENCHMARK RESULTS")
    print("=" * 70)
    print(f"Training Accuracy           : {train_acc * 100:.2f}%")
    print(f"Testing Accuracy            : {test_acc * 100:.2f}%")
    print(f"Precision                   : {precision * 100:.2f}%")
    print(f"Recall                      : {recall * 100:.2f}%")
    print(f"F1-Score                    : {f1 * 100:.2f}%")
    print(f"ROC-AUC Score               : {roc_auc * 100:.2f}%")
    print(f"Train-Test Gap              : {train_test_gap * 100:.2f}%")
    print(f"Training Samples (Pos/Neg)  : {len(valid_train_pos)} Positives / {len(train_neg)} Negatives ({len(y_train)} Total)")
    print(f"Testing Samples (Pos/Neg)   : {len(valid_test_pos)} Positives / {len(test_neg)} Negatives ({len(y_test)} Total)")

    print("\nCONFUSION MATRIX (Test Set):")
    print(f"                 Predicted Neg (0)   Predicted Pos (1)")
    print(f"Actual Neg (0): {cm[0][0]:>15}  {cm[0][1]:>18}")
    print(f"Actual Pos (1): {cm[1][0]:>15}  {cm[1][1]:>18}")

    print("\nCLASSIFICATION REPORT:")
    print(classification_report(y_test, test_preds, digits=4))

    # 10. Save Model Artifacts
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("backend/models", exist_ok=True)

    joblib.dump(rf_model, "data/processed/random_forest_model.pkl")
    joblib.dump(rf_model, "backend/models/random_forest_model.pkl")
    print("\n[SUCCESS] Model artifacts successfully saved to:")
    print(" - data/processed/random_forest_model.pkl")
    print(" - backend/models/random_forest_model.pkl")
    print("=" * 70)

if __name__ == "__main__":
    main()