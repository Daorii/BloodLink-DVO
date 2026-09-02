<?php

namespace App\Http\Controllers;

use App\Models\BloodRequest;
use App\Models\BloodRequestItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BloodRequestController extends Controller
{
    /**
     * GET /api/blood-requests
     * Return all requests with their items, hospital name, and submitter info.
     */
    public function index(): JsonResponse
    {
        $requests = BloodRequest::with(['hospital', 'requestedBy', 'processedBy', 'items'])
            ->orderByDesc('date_submitted')
            ->get();

        return response()->json([
            'bloodRequests' => $requests->map(fn($r) => $this->format($r)),
        ]);
    }

    /**
     * POST /api/blood-requests
     * Create a new request + its line items in one transaction.
     *
     * Expected body:
     * {
     *   hospitalId, urgency, dateNeeded, requestingPersonnel,
     *   hospitalRefNo?, ward?, diagnosis?, remarks?, filedByIssuance?,
     *   items: [{ bloodType, component, units }]
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'hospitalId'           => 'required|integer|exists:hospitals,hospital_id',
            'urgency'              => 'required|string|in:Routine,Urgent,Emergency',
            'dateNeeded'           => 'required|date',
            'requestingPersonnel'  => 'required|string|max:100',
            'hospitalRefNo'        => 'nullable|string|max:50',
            'ward'                 => 'nullable|string|max:100',
            'diagnosis'            => 'nullable|string|max:255',
            'remarks'              => 'nullable|string',
            'filedByIssuance'      => 'nullable|boolean',
            'items'                => 'required|array|min:1',
            'items.*.bloodType'    => 'required|string|max:10',
            'items.*.component'    => 'required|string|max:50',
            'items.*.units'        => 'required|integer|min:1',
        ]);

        $initialStatus = ($v['filedByIssuance'] ?? false) ? 'Verified' : 'Pending Verification';

        $bloodRequest = DB::transaction(function () use ($v, $request, $initialStatus) {
            $br = BloodRequest::create([
                'hospital_id'           => $v['hospitalId'],
                'requested_by_user_id'  => $request->user()?->user_id,
                'urgency_level'         => ucfirst(strtolower($v['urgency'])),
                'date_needed'           => $v['dateNeeded'],
                'date_submitted'        => now(),
                'requesting_personnel'  => $v['requestingPersonnel'],
                'hospital_ref_no'       => $v['hospitalRefNo'] ?? null,
                'ward'                  => $v['ward'] ?? null,
                'diagnosis'             => $v['diagnosis'] ?? null,
                'remarks'               => $v['remarks'] ?? null,
                'request_status'        => $initialStatus,
                'filed_by_issuance'     => $v['filedByIssuance'] ?? false,
            ]);

            foreach ($v['items'] as $item) {
                BloodRequestItem::create([
                    'request_id'         => $br->request_id,
                    'blood_type'         => $item['bloodType'],
                    'component'          => $item['component'],
                    'quantity_requested' => $item['units'],
                ]);
            }

            return $br->load(['hospital', 'requestedBy', 'processedBy', 'items']);
        });

        return response()->json([
            'bloodRequest' => $this->format($bloodRequest),
            'message'      => 'Blood request submitted successfully.',
        ], 201);
    }

    /**
     * PUT /api/blood-requests/{id}/status
     * Update a request's status (Verified / Approved / Rejected / Fulfilled / etc.)
     *
     * Expected body: { status, remarks?, processedBy? }
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $br = BloodRequest::with(['hospital', 'requestedBy', 'processedBy', 'items'])->findOrFail($id);

        $v = $request->validate([
            'status'  => 'required|string|in:Pending,Pending Verification,Verified,Ready for Release,Partially Fulfilled,Released,Rejected',
            'remarks' => 'nullable|string',
        ]);

        $br->update([
            'request_status' => $v['status'],
            'remarks'        => $v['remarks'] ?? $br->remarks,
            'processed_by'   => $request->user()?->user_id ?? $br->processed_by,
        ]);

        return response()->json([
            'bloodRequest' => $this->format($br->fresh(['hospital', 'requestedBy', 'processedBy', 'items'])),
            'message'      => 'Request status updated.',
        ]);
    }

    /**
     * Format a BloodRequest into the shape the frontend expects.
     */
    private function format(BloodRequest $r): array
    {
        $refNo = 'REQ-' . str_pad((string) $r->request_id, 4, '0', STR_PAD_LEFT);

        return [
            'refNo'               => $refNo,
            'requestId'           => $r->request_id,
            'hospitalId'          => 'HOSP-' . str_pad((string) $r->hospital_id, 3, '0', STR_PAD_LEFT),
            'hospital'            => $r->hospital?->name ?? 'Unknown Hospital',
            'urgency'             => strtolower($r->urgency_level),
            'dateNeeded'          => $r->date_needed?->format('Y-m-d'),
            'submittedAt'         => $r->date_submitted?->format('M j, Y, g:i A'),
            'requestingPersonnel' => $r->requesting_personnel,
            'hospitalRefNo'       => $r->hospital_ref_no ?? '',
            'ward'                => $r->ward ?? '',
            'diagnosis'           => $r->diagnosis ?? '',
            'status'              => $r->request_status,
            'remarks'             => $r->remarks ?? '',
            'filedByIssuance'     => (bool) $r->filed_by_issuance,
            'filedBy'             => $r->requestedBy?->name ?? null,
            'processedBy'         => $r->processedByUser?->name ?? null,
            'items'               => $r->items->map(fn($i) => [
                'bloodType' => $i->blood_type,
                'component' => $i->component,
                'units'     => $i->quantity_requested,
            ])->toArray(),
        ];
    }
}
