"""
BloodLink ML Service -- Flask API (One-Hot Encoded Pipeline MLR)
=================================================================
Serves MLR predictions for blood demand forecasting.

Start:
    python app.py
Runs on: http://localhost:5001
"""

import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import requests
import pandas as pd
import numpy as np
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

app  = Flask(__name__)
CORS(app)

# -- Load Model ----------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
CSV_PATH   = os.path.join(os.path.dirname(__file__), 'data', 'BloodLink_Hospital_Demand_Dataset.csv')
artifact   = None

try:
    artifact    = joblib.load(MODEL_PATH)
    pipeline    = artifact['pipeline']
    hospitals   = artifact['hospitals']
    blood_types = artifact['blood_types']
    components  = artifact['components']
    max_trend   = artifact['max_trend']
    metrics     = artifact['metrics']
    print(f"[BloodLink ML] Model loaded -- R2={metrics['r2_test']}, RMSE={metrics['rmse']}")
except FileNotFoundError:
    print("[BloodLink ML] WARNING: model.pkl not found. Run train.py first.")
    pipeline = None

# -- Load CSV for historical data ----------------------------------------------
df_csv = None
try:
    df_csv = pd.read_csv(CSV_PATH)
    df_csv['hospital_id'] = df_csv['hospital_id'].astype(str)
    print(f"[BloodLink ML] CSV loaded -- {len(df_csv)} rows for historical data")
except Exception as e:
    print(f"[BloodLink ML] WARNING: Could not load CSV for historical data: {e}")


# -- Helpers -------------------------------------------------------------------
def make_hosp_id(numeric_id) -> str:
    return f"HOSP-{str(numeric_id).zfill(3)}"


def predict_demand(h_id: str, bt: str, comp: str, weeks_ahead: int = 4) -> list:
    """Predict weekly demand for the next `weeks_ahead` weeks."""
    current_month = datetime.now().month
    preds = []

    for w in range(1, weeks_ahead + 1):
        trend = max_trend + w
        month = ((current_month + ((w - 1) // 4)) - 1) % 12 + 1

        row = pd.DataFrame([{
            'hospital_id':    str(h_id),
            'blood_type':     bt,
            'component_type': comp,
            'month':          month,
            'trend_index':    trend,
        }])

        pred = float(pipeline.predict(row)[0])
        preds.append(max(0.0, round(pred, 2)))

    return preds


# -- Routes --------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':       'ok',
        'model_loaded': pipeline is not None,
        'metrics':      metrics if pipeline else None,
        'timestamp':    datetime.now().isoformat(),
    })


@app.route('/model-info', methods=['GET'])
def model_info():
    if pipeline is None:
        return jsonify({'error': 'Model not loaded. Run train.py first.'}), 503

    return jsonify({
        'metrics':    metrics,
        'blood_types': blood_types,
        'components':  components,
        'hospitals': [
            {'hospitalId': make_hosp_id(h['hospital_id']), 'name': h['hospital_name']}
            for h in hospitals
        ],
        'approach': 'Global MLR with One-Hot Encoded categorical features',
    })


@app.route('/historical', methods=['GET'])
def historical():
    """
    GET /historical?weeks=8
    Returns REAL weekly aggregated demand from the CSV training data.
    Used by the frontend to display the green (historical actual) chart line.

    Response shape:
    {
      "weeks": 8,
      "overview": [                          # summed across ALL groups per week
        { "weekIndex": 1, "label": "Wk 1", "weekStartDate": "...", "totalDemand": 158 },
        ...
      ],
      "byGroup": [                           # per hospital x blood_type x component
        {
          "hospitalId": "HOSP-001",
          "hospitalName": "...",
          "bloodTypeId": "A+",
          "componentId": "PRBC",
          "weeks": [
            { "weekIndex": 1, "label": "Wk 1", "weekStartDate": "...", "demand": 7 },
            ...
          ]
        },
        ...
      ]
    }
    """
    if df_csv is None:
        return jsonify({'error': 'CSV data not loaded.'}), 503

    weeks = min(int(request.args.get('weeks', 8)), 52)  # max 52 weeks of history

    # -- Step 1: Get last `weeks` of CSV data ----------------------------------
    sorted_trends = sorted(df_csv['trend_index'].unique())
    last_trends   = sorted_trends[-weeks:]
    df_hist = df_csv[df_csv['trend_index'].isin(last_trends)].copy()
    df_hist['source'] = 'csv'

    # -- Step 2: Try to fetch real issuances from Laravel API ------------------
    real_rows = []
    try:
        resp = requests.get('http://localhost:8000/api/ml/training-data', timeout=5)
        if resp.status_code == 200:
            records = resp.json().get('records', [])
            if records:
                df_real = pd.DataFrame(records)
                df_real['source'] = 'real'
                # Only include records that have all required columns
                required = ['hospital_id', 'blood_type', 'component_type', 'quantity_issued', 'trend_index']
                if all(c in df_real.columns for c in required):
                    df_real['hospital_id'] = df_real['hospital_id'].astype(str)
                    real_rows = df_real
    except Exception:
        pass  # Laravel not reachable, use CSV only

    # -- Step 3: If real data exists, replace the most recent week(s) ----------
    if len(real_rows) > 0:
        # Group real data by (hospital_id, blood_type, component_type) and sum
        # Treat all real records as "week 9" (most recent actual week)
        # so they appear at the RIGHT side of the historical chart
        real_agg = real_rows.groupby(['hospital_id', 'blood_type', 'component_type'])['quantity_issued'].sum().reset_index()
        real_agg['trend_index'] = sorted_trends[-1] + 1  # next trend after CSV
        real_agg['week_start_date'] = datetime.now().strftime('%d/%m/%Y')
        real_agg['source'] = 'real'

        # Use last (weeks-1) CSV weeks + 1 real week
        last_trends = sorted_trends[-(weeks - 1):]
        df_hist     = df_csv[df_csv['trend_index'].isin(last_trends)].copy()
        df_hist['source'] = 'csv'

        # Combine with real data as the final week
        all_trends  = list(last_trends) + [real_agg['trend_index'].iloc[0]]
        df_combined = pd.concat([df_hist, real_agg], ignore_index=True)
    else:
        all_trends  = list(last_trends)
        df_combined = df_hist

    # -- Overview: sum ALL groups per week (CSV + real) -----------------------
    overview_rows = []
    for i, trend in enumerate(all_trends):
        week_data   = df_combined[df_combined['trend_index'] == trend]
        total       = float(week_data['quantity_issued'].sum())
        week_date   = week_data['week_start_date'].iloc[0] if 'week_start_date' in week_data.columns and len(week_data) else ''
        is_real     = bool(week_data['source'].eq('real').any()) if 'source' in week_data.columns else False
        overview_rows.append({
            'weekIndex':     i + 1,
            'label':         f'Wk {i + 1}',
            'weekStartDate': week_date,
            'totalDemand':   round(total, 2),
            'isRealData':    is_real,
        })

    # -- By group: per hospital x blood_type x component ----------------------
    by_group = []
    for hospital in hospitals:
        h_id   = str(hospital['hospital_id'])
        h_name = hospital['hospital_name']
        hosp_id = make_hosp_id(h_id)

        df_h = df_combined[df_combined['hospital_id'] == h_id]

        for bt in blood_types:
            df_bt = df_h[df_h['blood_type'] == bt]

            for comp in components:
                df_g = df_bt[df_bt['component_type'] == comp]

                week_rows = []
                for i, trend in enumerate(all_trends):
                    week_data = df_g[df_g['trend_index'] == trend]
                    demand    = float(week_data['quantity_issued'].sum()) if len(week_data) else 0.0
                    week_date = week_data['week_start_date'].iloc[0] if len(week_data) and 'week_start_date' in week_data.columns else ''
                    is_real   = bool(week_data['source'].eq('real').any()) if 'source' in week_data.columns and len(week_data) else False
                    week_rows.append({
                        'weekIndex':     i + 1,
                        'label':         f'Wk {i + 1}',
                        'weekStartDate': week_date,
                        'demand':        round(demand, 2),
                        'isRealData':    is_real,
                    })

                by_group.append({
                    'hospitalId':   hosp_id,
                    'hospitalName': h_name,
                    'bloodTypeId':  bt,
                    'componentId':  comp,
                    'weeks':        week_rows,
                })

    return jsonify({
        'weeks':    weeks,
        'source':   'csv_training_data',
        'overview': overview_rows,
        'byGroup':  by_group,
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    POST /predict
    Body (optional): { "weeks_ahead": 4 }
    Returns demand predictions for all hospital x blood_type x component combos.
    """
    if pipeline is None:
        return jsonify({'error': 'Model not loaded. Run train.py first.'}), 503

    data        = request.get_json(silent=True) or {}
    weeks_ahead = int(data.get('weeks_ahead', 4))

    predictions = []

    for hospital in hospitals:
        h_id    = hospital['hospital_id']
        h_name  = hospital['hospital_name']
        hosp_id = make_hosp_id(h_id)

        for bt in blood_types:
            for comp in components:
                weekly = predict_demand(h_id, bt, comp, weeks_ahead)

                for w_idx, pred in enumerate(weekly):
                    predictions.append({
                        'hospitalId':      hosp_id,
                        'hospitalName':    h_name,
                        'bloodTypeId':     bt,
                        'componentId':     comp,
                        'weeksAhead':      w_idx + 1,
                        'predictedDemand': pred,
                    })

    return jsonify({
        'predictions': predictions,
        'metadata': {
            'r2_train':    metrics['r2_train'],
            'r2_test':     metrics['r2_test'],
            'rmse':        metrics['rmse'],
            'mae':         metrics['mae'],
            'weeksAhead':  weeks_ahead,
            'totalRows':   len(predictions),
            'generatedAt': datetime.now().isoformat(),
        },
    })


# -- Run -----------------------------------------------------------------------
if __name__ == '__main__':
    print("[BloodLink ML] Flask service starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
