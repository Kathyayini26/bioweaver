import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# --------------------------------------------------
# Load Training Dataset
# --------------------------------------------------

train_data = pd.read_csv(
    "data/processed/training_dataset.csv"
)

print("=" * 60)
print("TRAINING DATA LOADED")
print("=" * 60)

print("Samples :", len(train_data))
print("Columns :", train_data.shape[1])

# --------------------------------------------------
# Training Features & Labels
# --------------------------------------------------

X_train = train_data.drop(
    "label",
    axis=1
)

y_train = train_data["label"]

print("\nTraining Features :", X_train.shape)
print("Training Labels   :", y_train.shape)

# --------------------------------------------------
# Load Testing Dataset
# --------------------------------------------------

test_data = pd.read_csv(
    "data/processed/testing_dataset.csv"
)

print("\n" + "=" * 60)
print("TESTING DATA LOADED")
print("=" * 60)

print("Samples :", len(test_data))
print("Columns :", test_data.shape[1])

X_test = test_data.drop(
    "label",
    axis=1
)

y_test = test_data["label"]

print("\nTesting Features :", X_test.shape)
print("Testing Labels   :", y_test.shape)

# --------------------------------------------------
# Create Random Forest Model
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    max_features="sqrt",
    bootstrap=True,
    random_state=42
)

# --------------------------------------------------
# Train Model
# --------------------------------------------------

print("\nTraining Random Forest...")

model.fit(
    X_train,
    y_train
)

print("Training completed!")

# --------------------------------------------------
# Training Accuracy
# --------------------------------------------------

train_pred = model.predict(
    X_train
)

train_accuracy = accuracy_score(
    y_train,
    train_pred
)

print("\nTraining Accuracy :",
      round(train_accuracy * 100, 2), "%")

# --------------------------------------------------
# Testing Prediction
# --------------------------------------------------

y_pred = model.predict(
    X_test
)

print("\n" + "=" * 60)
print("TESTING COMPLETED")
print("=" * 60)

print("Predictions :", len(y_pred))

# --------------------------------------------------
# Testing Accuracy
# --------------------------------------------------

test_accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\nTesting Accuracy :",
      round(test_accuracy * 100, 2), "%")

# --------------------------------------------------
# Classification Report
# --------------------------------------------------

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        y_pred
    )
)

# --------------------------------------------------
# Confusion Matrix
# --------------------------------------------------

print("Confusion Matrix\n")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)

# --------------------------------------------------
# Save Model
# --------------------------------------------------

joblib.dump(
    model,
    "data/processed/random_forest_model.pkl"
)

print("\nModel saved successfully!")
print("Saved to:")
print("data/processed/random_forest_model.pkl")