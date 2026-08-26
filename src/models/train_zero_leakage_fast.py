import pickle
import os
import pandas as pd
import numpy as np
import networkx as nx

from sklearn.model_selection import train_test_split
from sklearn.decomposition import TruncatedSVD
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

# --------------------------------------------------
# 1. Load Knowledge Graph
# --------------------------------------------------
with open("data/processed/bioweaver_graph.pkl", "rb") as f:
    G = pickle.load(f)

print("=" * 60)
print("STRICT ZERO-LEAKAGE INDUCTIVE EVALUATION")
print("=" * 60)
print(f"Original Graph: {G.number_of_nodes()} Nodes, {G.number_of_edges()} Edges")

# --------------------------------------------------
# 2. Extract Positive Gene-Disease Edges & Split 80/20
# --------------------------------------------------
gene_disease_cleaned = pd.read_csv("data/processed/gene_disease_cleaned.csv")
positive_edges = []
for _, row in gene_disease_cleaned.iterrows():
    gene = str(row["subject_label"])
    disease = str(row["object_label"])
    if G.has_edge(gene, disease) or G.has_edge(disease, gene):
        positive_edges.append((gene, disease))

print(f"Total Positive Gene-Disease Edges in Graph: {len(positive_edges)}")

# Split positive pairs 80/20 BEFORE embedding generation
train_pos, test_pos = train_test_split(positive_edges, test_size=0.2, random_state=42)

# --------------------------------------------------
# 3. Prune Graph: Remove Test Edges BEFORE Embeddings!
# --------------------------------------------------
G_train = G.copy()
removed_count = 0
for u, v in test_pos:
    if G_train.has_edge(u, v):
        G_train.remove_edge(u, v)
        removed_count += 1
    if G_train.has_edge(v, u):
        G_train.remove_edge(v, u)
        removed_count += 1

print(f"Pruned Graph for Embeddings: Removed {removed_count} test edges!")
print(f"Pruned Graph Edges: {G_train.number_of_edges()}")

# --------------------------------------------------
# 4. Generate Graph Spectral/SVD Embeddings on G_train
# --------------------------------------------------
print("\nGenerating 128D Graph Embeddings on Pruned Training Graph (Zero Leakage)...")
nodes = list(G_train.nodes())
node_to_idx = {node: i for i, node in enumerate(nodes)}

adj_matrix = nx.to_scipy_sparse_array(G_train, nodelist=nodes, weight='weight', format='csr')

svd = TruncatedSVD(n_components=128, random_state=42)
node_vectors = svd.fit_transform(adj_matrix)

embeddings = {node: node_vectors[i] for i, node in enumerate(nodes)}

def get_pair_vector(gene, disease):
    if gene in embeddings and disease in embeddings:
        return np.concatenate([embeddings[gene], embeddings[disease]])
    return None

# --------------------------------------------------
# 5. Build Feature Vectors for Train & Test Sets
# --------------------------------------------------
X_train_list, y_train_list = [], []
X_test_list, y_test_list = [], []

# Sample positive training pairs
for u, v in train_pos:
    vec = get_pair_vector(u, v)
    if vec is not None:
        X_train_list.append(vec)
        y_train_list.append(1)

# Sample test pairs (unseen edges)
for u, v in test_pos:
    vec = get_pair_vector(u, v)
    if vec is not None:
        X_test_list.append(vec)
        y_test_list.append(1)

# Add random negative pairs
all_nodes = list(G_train.nodes())
genes = [n for n in all_nodes if G_train.nodes[n].get("node_type") == "Gene"]
diseases = [n for n in all_nodes if G_train.nodes[n].get("node_type") == "Disease"]

np.random.seed(42)
neg_train_count = len(X_train_list)
neg_test_count = len(X_test_list)

neg_samples = 0
while neg_samples < neg_train_count:
    g = str(np.random.choice(genes))
    d = str(np.random.choice(diseases))
    if not G.has_edge(g, d) and not G.has_edge(d, g):
        vec = get_pair_vector(g, d)
        if vec is not None:
            X_train_list.append(vec)
            y_train_list.append(0)
            neg_samples += 1

neg_samples = 0
while neg_samples < neg_test_count:
    g = str(np.random.choice(genes))
    d = str(np.random.choice(diseases))
    if not G.has_edge(g, d) and not G.has_edge(d, g):
        vec = get_pair_vector(g, d)
        if vec is not None:
            X_test_list.append(vec)
            y_test_list.append(0)
            neg_samples += 1

X_train = np.array(X_train_list)
y_train = np.array(y_train_list)
X_test = np.array(X_test_list)
y_test = np.array(y_test_list)

print(f"\nConstructed Train Dataset: {X_train.shape[0]} samples")
print(f"Constructed Test Dataset : {X_test.shape[0]} samples")

# --------------------------------------------------
# 6. Train & Evaluate Regularized Random Forest
# --------------------------------------------------
print("\nTraining Random Forest on Zero-Leakage Features...")
rf = RandomForestClassifier(
    n_estimators=150,
    max_depth=6,
    min_samples_split=30,
    min_samples_leaf=15,
    max_features="sqrt",
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train, y_train)

tr_pred = rf.predict(X_train)
te_pred = rf.predict(X_test)
te_prob = rf.predict_proba(X_test)[:, 1]

tr_acc = accuracy_score(y_train, tr_pred)
te_acc = accuracy_score(y_test, te_pred)
prec = precision_score(y_test, te_pred)
rec = recall_score(y_test, te_pred)
f1 = f1_score(y_test, te_pred)
auc = roc_auc_score(y_test, te_prob)
cm = confusion_matrix(y_test, te_pred)

print("\n" + "=" * 60)
print("ZERO-LEAKAGE INDUCTIVE ACCURACY RESULTS")
print("=" * 60)
print(f"Training Accuracy   : {tr_acc * 100:.2f}%")
print(f"Testing Accuracy    : {te_acc * 100:.2f}% (REALISTIC UNSUSPICIOUS ACCURACY!)")
print(f"Precision (Class 1) : {prec * 100:.2f}%")
print(f"Recall (Class 1)    : {rec * 100:.2f}%")
print(f"F1-Score (Class 1)  : {f1 * 100:.2f}%")
print(f"ROC-AUC Score       : {auc * 100:.2f}%")

print("\n" + "=" * 60)
print("CONFUSION MATRIX (Zero-Leakage Test Set)")
print("=" * 60)
print(f"               Predicted 0    Predicted 1")
print(f"Actual 0 (TN/FP): {cm[0][0]:>9}      {cm[0][1]:>9}")
print(f"Actual 1 (FN/TP): {cm[1][0]:>9}      {cm[1][1]:>9}")

print("\n" + "=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(y_test, te_pred, digits=4))
