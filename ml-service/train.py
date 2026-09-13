"""
BloodLink MLR Training Script -- One-Hot Encoded Global Model
==============================================================
Training data sources (merged automatically):
  1. CSV baseline  : data/BloodLink_Hospital_Demand_Dataset.csv  (7488 rows)
  2. Real DB data  : http://localhost:8000/api/ml/training-data   (grows over time)

Run ONCE before starting the Flask API, or re-run to retrain with new real data:
    python train.py
"""

import os
import sys
import pandas as pd
import numpy as np
import requests
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# -- Config --------------------------------------------------------------------
CSV_PATH       = os.path.join(os.path.dirname(__file__), 'data', 'BloodLink_Hospital_Demand_Dataset.csv')
LARAVEL_API    = 'http://localhost:8000/api/ml/training-data'
MODEL_PATH     = os.path.join(os.path.dirname(__file__), 'model.pkl')

# -- Step 1: Load CSV baseline -------------------------------------------------
print("=" * 55)
print("  BloodLink MLR Training")
print("=" * 55)
print(f"\n[1] Loading CSV baseline: {CSV_PATH}")
df_csv = pd.read_csv(CSV_PATH)
df_csv['hospital_id'] = df_csv['hospital_id'].astype(str)
print(f"    Rows: {len(df_csv)}")

# -- Step 2: Fetch real issuance data from Laravel API -------------------------
print(f"\n[2] Fetching real issuance data from: {LARAVEL_API}")
df_real = pd.DataFrame()
try:
    resp = requests.get(LARAVEL_API, timeout=10)
    if resp.status_code == 200:
        payload = resp.json()
        records = payload.get('records', [])
        if records:
            df_real = pd.DataFrame(records)
            df_real['hospital_id'] = df_real['hospital_id'].astype(str)
            print(f"    Real records fetched: {len(df_real)}")
        else:
            print("    No real issuance records yet (system is new). Using CSV only.")
    else:
        print(f"    API returned {resp.status_code}. Using CSV only.")
except Exception as e:
    print(f"    Could not reach Laravel API: {e}. Using CSV only.")

# -- Step 3: Merge datasets ----------------------------------------------------
REQUIRED_COLS = ['hospital_id', 'blood_type', 'component_type', 'quantity_issued', 'month', 'trend_index']

if not df_real.empty:
    # Align column names (API may use same names as CSV)
    df_combined = pd.concat([df_csv[REQUIRED_COLS], df_real[REQUIRED_COLS]], ignore_index=True)
    print(f"\n[3] Combined dataset: {len(df_csv)} CSV + {len(df_real)} real = {len(df_combined)} total rows")
else:
    df_combined = df_csv[REQUIRED_COLS].copy()
    print(f"\n[3] Using CSV only: {len(df_combined)} rows")

print(f"    Blood types : {sorted(df_combined['blood_type'].unique().tolist())}")
print(f"    Components  : {sorted(df_combined['component_type'].unique().tolist())}")
print(f"    Hospitals   : {df_combined['hospital_id'].nunique()} unique")

# -- Step 4: Feature Engineering -----------------------------------------------
CATEGORICAL = ['hospital_id', 'blood_type', 'component_type']
NUMERIC     = ['month', 'trend_index']
TARGET      = 'quantity_issued'

X = df_combined[CATEGORICAL + NUMERIC]
y = df_combined[TARGET].values

# -- Step 5: Train / Test Split ------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"\n[4] Train samples: {len(X_train)}  |  Test samples: {len(X_test)}")

# -- Step 6: Build Pipeline and Train ------------------------------------------
preprocessor = ColumnTransformer(transformers=[
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL),
    ('num', 'passthrough', NUMERIC),
])
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor',    LinearRegression()),
])
pipeline.fit(X_train, y_train)

# -- Step 7: Evaluate ----------------------------------------------------------
y_pred_train = pipeline.predict(X_train)
y_pred_test  = pipeline.predict(X_test)
r2_train  = r2_score(y_train, y_pred_train)
r2_test   = r2_score(y_test,  y_pred_test)
rmse      = np.sqrt(mean_squared_error(y_test, y_pred_test))
mae       = mean_absolute_error(y_test, y_pred_test)

print()
print("=" * 55)
print("  MLR Training Complete")
print("=" * 55)
print(f"  R^2 (Train)  : {r2_train:.4f}")
print(f"  R^2 (Test)   : {r2_test:.4f}")
print(f"  RMSE         : {rmse:.4f} units/week")
print(f"  MAE          : {mae:.4f} units/week")
print(f"  CSV rows     : {len(df_csv)}")
print(f"  Real rows    : {len(df_real)}")
print(f"  Total rows   : {len(df_combined)}")

# -- Step 8: Save Artifact -----------------------------------------------------
hospitals_df = df_combined[['hospital_id']].drop_duplicates().sort_values('hospital_id')

# Map hospital_id back to name from CSV
hosp_names = df_csv[['hospital_id', 'hospital_name']].drop_duplicates()
hosp_names['hospital_id'] = hosp_names['hospital_id'].astype(str)

artifact = {
    'pipeline':     pipeline,
    'blood_types':  sorted(df_combined['blood_type'].unique().tolist()),
    'components':   sorted(df_combined['component_type'].unique().tolist()),
    'hospitals':    hosp_names.to_dict('records'),
    'max_trend':    int(df_combined['trend_index'].max()),
    'metrics': {
        'r2_train':   round(r2_train, 4),
        'r2_test':    round(r2_test,  4),
        'rmse':       round(rmse, 4),
        'mae':        round(mae,  4),
        'csv_rows':   len(df_csv),
        'real_rows':  len(df_real),
        'total_rows': len(df_combined),
    },
}

joblib.dump(artifact, MODEL_PATH)
print()
print(f"  Model saved -> {MODEL_PATH}")
print("=" * 55)
print("  Next step: python app.py")
