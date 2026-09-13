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
import pandas as pd
import numpy as np
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

app  = Flask(__name__)
CORS(app)

# -- Load Model ----------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
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
