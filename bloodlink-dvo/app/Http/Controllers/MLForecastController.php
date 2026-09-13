<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MLForecastController extends Controller
{
    private string $mlServiceUrl;

    public function __construct()
    {
        // Python Flask ML service URL
        $this->mlServiceUrl = env('ML_SERVICE_URL', 'http://localhost:5001');
    }

    /**
     * GET /api/ml/health
     * Check if the ML service is running.
     */
    public function health()
    {
        try {
            $response = Http::timeout(5)->get("{$this->mlServiceUrl}/health");
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'status'       => 'unavailable',
                'model_loaded' => false,
                'error'        => 'ML service is not running. Start it with: python app.py',
            ], 503);
        }
    }

    /**
     * GET /api/ml/model-info
     * Return model metadata (R², coefficients, blood types, hospitals).
     */
    public function modelInfo()
    {
        try {
            $response = Http::timeout(5)->get("{$this->mlServiceUrl}/model-info");
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable.'], 503);
        }
    }

    /**
     * POST /api/ml/predict
     * Proxy demand forecast request to the Python ML service.
     *
     * Body (optional): { "weeks_ahead": 4 }
     */
    public function predict(Request $request)
    {
        $weeksAhead = (int) $request->input('weeks_ahead', 4);

        try {
            $response = Http::timeout(30)->post("{$this->mlServiceUrl}/predict", [
                'weeks_ahead' => $weeksAhead,
            ]);

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'ML service unavailable. Start it with: python app.py in the ml-service/ folder.',
            ], 503);
        }
    }
}
