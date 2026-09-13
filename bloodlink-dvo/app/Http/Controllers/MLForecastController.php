<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\BloodIssuanceItem;

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

    /**
     * GET /api/ml/training-data
     * Export real blood issuance records in the same format as the CSV training data.
     * Used by train.py to merge real issuances with the synthetic baseline dataset.
     */
    public function trainingData(): \Illuminate\Http\JsonResponse
    {
        // Pull all issued items with their issuance date and hospital info
        $rows = DB::table('blood_issuance_items as bii')
            ->join('blood_issuances as bi',       'bii.issuance_id',    '=', 'bi.issuance_id')
            ->join('blood_requests as br',         'bi.request_id',      '=', 'br.request_id')
            ->join('hospitals as h',               'br.hospital_id',     '=', 'h.hospital_id')
            ->select([
                'h.hospital_id',
                'h.name as hospital_name',
                'bii.blood_type',
                'bii.component',
                'bii.quantity_issued',
                'bi.issuance_date',
            ])
            ->whereNotNull('bi.issuance_date')
            ->get();

        // Transform into training row format matching the CSV columns
        $baseDate  = \Carbon\Carbon::parse('2024-01-01');
        $formatted = $rows->map(function ($row, $index) use ($baseDate) {
            $date       = \Carbon\Carbon::parse($row->issuance_date);
            $weekStart  = $date->copy()->startOfWeek()->format('d/m/Y');
            $month      = (int) $date->format('n');
            // Append trend_index after the CSV max (624) so real data comes after synthetic
            $trendIndex = 625 + $index;

            return [
                'hospital_id'    => $row->hospital_id,
                'hospital_name'  => $row->hospital_name,
                'week_start_date'=> $weekStart,
                'blood_type'     => $row->blood_type,
                'component_type' => $row->component,
                'quantity_issued'=> (float) $row->quantity_issued,
                'month'          => $month,
                'trend_index'    => $trendIndex,
            ];
        });

        return response()->json([
            'count'   => $formatted->count(),
            'records' => $formatted->values(),
        ]);
    }
}
