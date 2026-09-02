<?php

namespace App\Http\Controllers;

use App\Models\BloodIssuance;
use App\Models\BloodIssuanceItem;
use App\Models\BloodRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BloodIssuanceController extends Controller
{
    /**
     * GET /api/blood-issuances
     * List all issuances with request, hospital, and item details.
     */
    public function index(): JsonResponse
    {
        $issuances = BloodIssuance::with([
            'bloodRequest.hospital',
            'processedBy',
            'releaseApprovedBy',
            'items',
        ])->orderByDesc('issuance_date')->get();

        return response()->json([
            'issuances' => $issuances->map(fn($i) => $this->format($i)),
        ]);
    }

    /**
     * POST /api/blood-issuances
     * Blood Bank Staff processes a request:
     *   - Creates a blood_issuance + items
     *   - Updates blood_request status to "Ready for Release" (or "Partially Fulfilled")
     *
     * Expected body:
     * {
     *   requestId,          // numeric DB ID of the blood request
     *   items: [{ bloodType, component, quantityIssued }],
     *   remarks?,
     *   isPartial?          // true = Partially Fulfilled, false = Ready for Release
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'requestId'                   => 'required|integer|exists:blood_requests,request_id',
            'items'                       => 'required|array|min:1',
            'items.*.bloodType'           => 'required|string|max:10',
            'items.*.component'           => 'required|string|max:50',
            'items.*.quantityIssued'      => 'required|integer|min:1',
            'remarks'                     => 'nullable|string',
            'isPartial'                   => 'nullable|boolean',
        ]);

        $issuance = DB::transaction(function () use ($v, $request) {
            // Create issuance record
            $iss = BloodIssuance::create([
                'request_id'   => $v['requestId'],
                'processed_by' => $request->user()->user_id,
                'issuance_date' => now(),
                'status'       => 'Prepared',
                'remarks'      => $v['remarks'] ?? null,
            ]);

            // Create line items
            foreach ($v['items'] as $item) {
                BloodIssuanceItem::create([
                    'issuance_id'     => $iss->issuance_id,
                    'blood_type'      => $item['bloodType'],
                    'component'       => $item['component'],
                    'quantity_issued' => $item['quantityIssued'],
                ]);
            }

            // Update blood request status
            $newStatus = ($v['isPartial'] ?? false) ? 'Partially Fulfilled' : 'Ready for Release';
            BloodRequest::where('request_id', $v['requestId'])->update(['request_status' => $newStatus]);

            return $iss->load(['bloodRequest.hospital', 'processedBy', 'releaseApprovedBy', 'items']);
        });

        return response()->json([
            'issuance' => $this->format($issuance),
            'message'  => 'Blood units prepared. Request is now Ready for Release.',
        ], 201);
    }

    /**
     * PUT /api/blood-issuances/{id}/release
     * Issuance Personnel approves the physical release.
     * Updates issuance status → Released, blood_request status → Released.
     */
    public function release(Request $request, $id): JsonResponse
    {
        $issuance = BloodIssuance::with(['bloodRequest', 'items'])->findOrFail($id);

        $v = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($issuance, $request, $v) {
            $issuance->update([
                'status'              => 'Released',
                'release_approved_by' => $request->user()->user_id,
                'release_date'        => now(),
                'remarks'             => $v['remarks'] ?? $issuance->remarks,
            ]);

            BloodRequest::where('request_id', $issuance->request_id)
                ->update(['request_status' => 'Released']);
        });

        return response()->json([
            'issuance' => $this->format($issuance->fresh(['bloodRequest.hospital', 'processedBy', 'releaseApprovedBy', 'items'])),
            'message'  => 'Blood units released to hospital.',
        ]);
    }

    /**
     * Format a BloodIssuance into the shape the frontend expects.
     */
    private function format(BloodIssuance $i): array
    {
        $req = $i->bloodRequest;
        $reqRefNo = $req ? ('REQ-' . str_pad((string) $req->request_id, 4, '0', STR_PAD_LEFT)) : '—';

        return [
            'issuanceId'        => $i->issuance_id,
            'issuanceRef'       => 'ISS-' . str_pad((string) $i->issuance_id, 4, '0', STR_PAD_LEFT),
            'requestId'         => $i->request_id,
            'requestRef'        => $reqRefNo,
            'hospital'          => $req?->hospital?->name ?? '—',
            'hospitalId'        => $req ? ('HOSP-' . str_pad((string) $req->hospital_id, 3, '0', STR_PAD_LEFT)) : '—',
            'processedBy'       => $i->processedBy?->name ?? '—',
            'issuanceDate'      => $i->issuance_date?->format('M j, Y, g:i A'),
            'releaseApprovedBy' => $i->releaseApprovedBy?->name ?? null,
            'releaseDate'       => $i->release_date?->format('M j, Y, g:i A'),
            'status'            => $i->status,
            'remarks'           => $i->remarks ?? '',
            'items'             => $i->items->map(fn($it) => [
                'bloodType'      => $it->blood_type,
                'component'      => $it->component,
                'quantityIssued' => $it->quantity_issued,
            ])->toArray(),
            // Request context for display
            'urgency'    => $req?->urgency_level ?? '—',
            'dateNeeded' => $req?->date_needed?->format('Y-m-d'),
            'requestItems' => $req?->items->map(fn($ri) => [
                'bloodType' => $ri->blood_type,
                'component' => $ri->component,
                'units'     => $ri->quantity_requested,
            ])->toArray() ?? [],
        ];
    }
}
