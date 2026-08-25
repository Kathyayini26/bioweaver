import os
import sys
import pandas as pd
import numpy as np
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

# --------------------------------------------------
# 1. Load Combined 13,922 Dataset
# --------------------------------------------------
train_path = "data/processed/training_dataset.csv"
test_path = "data/processed/testing_dataset.csv"

train_df = pd.read_csv(train_path)
test_df = pd.read_csv(test_path)
full_df = pd.concat([train_df, test_df], axis=0).reset_index(drop=True)

print("=" * 60)
print("FULL DATASET LOADED FOR 80/20 SPLIT")
print("=" * 60)
print("Total Samples :", len(full_df))
print("Total Features:", full_df.shape[1] - 1)

X = full_df.drop("label", axis=1)
y = full_df["label"]

# --------------------------------------------------
# 2. Perform Exact 80/20 Stratified Train/Test Split
#    11,138 Train (80%) | 2,784 Test (20%)
# --------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    train_size=11138,
    test_size=2784,
    random_state=42,
    stratify=y
)

print("\n" + "=" * 60)
print("80/20 DATASET SPLIT SUMMARY")
print("=" * 60)
print(f"Total Dataset  : {len(full_df):>6} samples")
print(f"Train Set (80%): {len(X_train):>6} samples (5,569 Pos / 5,569 Neg)")
print(f"Test Set (20%) : {len(X_test):>6} samples (1,392 Pos / 1,392 Neg)")

# --------------------------------------------------
# 3. Train Random Forest Classifier
# --------------------------------------------------
print("\n" + "=" * 60)
print("TRAINING RANDOM FOREST MODEL...")
print("=" * 60)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    max_features="sqrt",
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("Training Completed!")

# --------------------------------------------------
# 4. Evaluation & Accuracy Metrics
# --------------------------------------------------
train_pred = model.predict(X_train)
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

train_accuracy = accuracy_score(y_train, train_pred)
test_accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 60)
print("MODEL ACCURACY & PERFORMANCE METRICS")
print("=" * 60)
print(f"Training Accuracy   : {train_accuracy * 100:.2f}%")
print(f"Testing Accuracy    : {test_accuracy * 100:.2f}%")
print(f"Precision (Class 1) : {precision * 100:.2f}%")
print(f"Recall (Class 1)    : {recall * 100:.2f}%")
print(f"F1-Score (Class 1)  : {f1 * 100:.2f}%")
print(f"ROC-AUC Score       : {roc_auc * 100:.2f}%")

print("\n" + "=" * 60)
print("CONFUSION MATRIX (2,784 Test Samples)")
print("=" * 60)
print(f"               Predicted 0    Predicted 1")
print(f"Actual 0 (TN/FP): {cm[0][0]:>9}      {cm[0][1]:>9}")
print(f"Actual 1 (FN/TP): {cm[1][0]:>9}      {cm[1][1]:>9}")

print("\n" + "=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(y_test, y_pred, digits=4))

# --------------------------------------------------
# 5. Save Retrained Model
# --------------------------------------------------
os.makedirs("data/processed", exist_ok=True)
os.makedirs("backend/models", exist_ok=True)

joblib.dump(model, "data/processed/random_forest_model.pkl")
joblib.dump(model, "backend/models/random_forest_model.pkl")

print("\nModel saved successfully!")
print("Saved to:")
print(" - data/processed/random_forest_model.pkl")
print(" - backend/models/random_forest_model.pkl")