"""
fix_hospitals.py
================
Renames the 3 CSV hospitals to match the actual BloodLink DVO hospitals,
then generates synthetic data for HOSP-004 (PRC Davao Chapter),
and saves the updated CSV back.

Run ONCE before retraining:
    python fix_hospitals.py
    python train.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'BloodLink_Hospital_Demand_Dataset.csv')

# ── Load ──────────────────────────────────────────────────────────────────────
df = pd.read_csv(CSV_PATH)
print(f"Loaded {len(df)} rows.")
print("Before:")
print(df[['hospital_id','hospital_name']].drop_duplicates().to_string(index=False))

# ── Rename existing hospitals to match BloodLink system ──────────────────────
HOSPITAL_MAP = {
    1: ('1', 'Southern Philippines Medical Center (SPMC)'),
    2: ('2', 'Davao Doctors Hospital'),
    3: ('3', 'San Pedro Hospital'),
}

df['hospital_name'] = df['hospital_id'].map(
    lambda hid: HOSPITAL_MAP.get(int(hid), (str(hid), 'Unknown'))[1]
)

# ── Generate synthetic data for PRC Davao (hospital_id = 4) ──────────────────
# PRC is a Blood Bank — medium-to-small scale, different component mix.
# We base it on San Pedro (hospital 3) data scaled by 0.7 (smaller volume).
df3 = df[df['hospital_id'] == 3].copy()

np.random.seed(42)
df4 = df3.copy()
df4['hospital_id']   = 4
df4['hospital_name'] = 'Philippine Red Cross - Davao Chapter'

# Blood banks issue less whole-blood products and more specialized components.
# Scale general demand down, adjust by component type.
COMP_SCALE = {
    'PRBC':                1.1,   # still high — primary product
    'Platelet Concentrate':0.8,
    'FFP':                 0.9,
    'Cryoprecipitate':     0.6,
    'Cryosupernate':       0.5,
}
def scale_qty(row):
    base  = row['quantity_issued'] * 0.7
    scale = COMP_SCALE.get(row['component_type'], 0.7)
    noise = np.random.normal(0, 0.5)
    return max(1, round(base * scale + noise))

df4['quantity_issued'] = df4.apply(scale_qty, axis=1)

# Give PRC rows new unique record_ids
max_id = df['record_id'].max()
df4['record_id'] = range(max_id + 1, max_id + 1 + len(df4))

# ── Combine and save ──────────────────────────────────────────────────────────
df_final = pd.concat([df, df4], ignore_index=True)
df_final.to_csv(CSV_PATH, index=False)

print(f"\nAfter — {len(df_final)} total rows:")
print(df_final[['hospital_id','hospital_name']].drop_duplicates().to_string(index=False))
print("\nCSV saved. Now run:  python train.py")
