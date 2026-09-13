"""
BloodLink MLR Training Script -- One-Hot Encoded Global Model
==============================================================
Uses one-hot encoding for hospital, blood type, and component so each
group gets its own coefficient (distinct baseline demand). This is the
academically correct MLR implementation for categorical predictors.

Run ONCE before starting the Flask API:
    python train.py
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# -- Load Dataset --------------------------------------------------------------
CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'BloodLink_Hospital_Demand_Dataset.csv')
print(f"Loading dataset: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"  Rows: {len(df)}")
print(f"  Blood types : {sorted(df['blood_type'].unique())}")
print(f"  Components  : {sorted(df['component_type'].unique())}")
print(f"  Hospitals   : {df['hospital_name'].unique().tolist()}")
print()

# -- Feature Engineering -------------------------------------------------------
# Categorical: hospital_id, blood_type, component_type  -> OneHotEncoded
# Numeric    : month, trend_index                       -> pass through
CATEGORICAL = ['hospital_id', 'blood_type', 'component_type']
NUMERIC     = ['month', 'trend_index']
TARGET      = 'quantity_issued'

# Convert hospital_id to string so OHE handles it as categorical
df['hospital_id'] = df['hospital_id'].astype(str)

X = df[CATEGORICAL + NUMERIC]
y = df[TARGET].values

# -- Train / Test Split --------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train samples: {len(X_train)}  |  Test samples: {len(X_test)}")

# -- Build Scikit-learn Pipeline -----------------------------------------------
preprocessor = ColumnTransformer(transformers=[
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL),
    ('num', 'passthrough', NUMERIC),
])

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor',    LinearRegression()),
])

pipeline.fit(X_train, y_train)

# -- Evaluate ------------------------------------------------------------------
y_pred_train = pipeline.predict(X_train)
y_pred_test  = pipeline.predict(X_test)

r2_train  = r2_score(y_train, y_pred_train)
r2_test   = r2_score(y_test,  y_pred_test)
rmse      = np.sqrt(mean_squared_error(y_test, y_pred_test))
mae       = mean_absolute_error(y_test, y_pred_test)

print()
print("=" * 55)
print("  MLR Training Complete (One-Hot Encoded)")
print("=" * 55)
print(f"  R^2 (Train)  : {r2_train:.4f}")
print(f"  R^2 (Test)   : {r2_test:.4f}")
print(f"  RMSE         : {rmse:.4f} units/week")
print(f"  MAE          : {mae:.4f} units/week")

# -- Hospitals metadata --------------------------------------------------------
hospitals_df = (df[['hospital_id', 'hospital_name']]
                .drop_duplicates()
                .sort_values('hospital_id'))

# -- Save Artifact -------------------------------------------------------------
artifact = {
    'pipeline':     pipeline,            # full sklearn Pipeline (OHE + MLR)
    'blood_types':  sorted(df['blood_type'].unique().tolist()),
    'components':   sorted(df['component_type'].unique().tolist()),
    'hospitals':    hospitals_df.to_dict('records'),   # [{hospital_id, hospital_name}]
    'max_trend':    int(df['trend_index'].max()),
    'categorical':  CATEGORICAL,
    'numeric':      NUMERIC,
    'metrics': {
        'r2_train': round(r2_train, 4),
        'r2_test':  round(r2_test,  4),
        'rmse':     round(rmse, 4),
        'mae':      round(mae,  4),
    },
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
joblib.dump(artifact, MODEL_PATH)
print()
print(f"  Model saved -> {MODEL_PATH}")
print("=" * 55)
print("  Next step: python app.py")
