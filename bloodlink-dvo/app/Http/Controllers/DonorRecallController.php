<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\DonorRecall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonorRecallController extends Controller
{
    /**
     * GET /api/recalls
     * Returns all recall records, newest first.
     */
    public function index(): JsonResponse
    {
        $recalls = DonorRecall::with('donor')
            ->orderBy('recall_date', 'desc')
            ->orderBy('recall_id', 'desc')
            ->get();

        return response()->json([
            'recalls' => $recalls->map(fn($r) => $this->format($r)),
        ]);
    }

    /**
     * POST /api/recalls
     * Trigger a single SMS recall for one donor.
     *
     * Body: { donor_id, recall_reason? }
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donor_id'      => 'required|integer|exists:donors,donor_id',
            'recall_reason' => 'nullable|string|max:100',
        ]);

        $recall = DonorRecall::create([
            'donor_id'      => $v['donor_id'],
            'recall_date'   => now()->toDateString(),
            'sms_status'    => 'Sent',      // simulated — no real SMS gateway
            'donor_response'=> null,
            'recall_reason' => $v['recall_reason'] ?? 'Critical Shortage Match',
            'processed_by'  => $request->user()?->user_id,
        ]);

        return response()->json([
            'recall'  => $this->format($recall->load('donor')),
            'message' => 'Recall SMS sent successfully.',
        ], 201);
    }

    /**
     * POST /api/recalls/bulk
     * Trigger SMS recalls for multiple donors at once.
     *
     * Body: { donor_ids: [1, 2, 3], recall_reason? }
     */
    public function bulk(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donor_ids'     => 'required|array|min:1',
            'donor_ids.*'   => 'integer|exists:donors,donor_id',
            'recall_reason' => 'nullable|string|max:100',
        ]);

        $today  = now()->toDateString();
        $userId = $request->user()?->user_id;
        $reason = $v['recall_reason'] ?? 'Critical Shortage Match';

        $created = [];
        foreach ($v['donor_ids'] as $donorId) {
            $recall = DonorRecall::create([
                'donor_id'       => $donorId,
                'recall_date'    => $today,
                'sms_status'     => 'Sent',
                'donor_response' => null,
                'recall_reason'  => $reason,
                'processed_by'   => $userId,
            ]);
            $created[] = $this->format($recall->load('donor'));
        }

        return response()->json([
            'recalls' => $created,
            'count'   => count($created),
            'message' => count($created) . ' recall SMS messages sent.',
        ], 201);
    }

    /**
     * PUT /api/recalls/{id}/response
     * Update donor_response and/or sms_status after follow-up.
     *
     * Body: { donor_response?, sms_status? }
     */
    public function updateResponse(Request $request, int $id): JsonResponse
    {
        $recall = DonorRecall::findOrFail($id);

        $v = $request->validate([
            'donor_response' => 'nullable|string|max:30',
            'sms_status'     => 'nullable|string|max:20',
        ]);

        $recall->update(array_filter($v, fn($val) => !is_null($val)));

        return response()->json([
            'recall'  => $this->format($recall->load('donor')),
            'message' => 'Recall record updated.',
        ]);
    }

    /**
     * Format a DonorRecall for the API response.
     */
    private function format(DonorRecall $r): array
    {
        return [
            'recallId'       => $r->recall_id,
            'recall_id'      => $r->recall_id,
            'donorId'        => $r->donor_id,
            'donorName'      => $r->donor?->name ?? '-',
            'donorPhone'     => $r->donor?->phone ?? '-',
            'bloodType'      => $r->donor?->blood_type ?? '-',
            'recallDate'     => $r->recall_date?->toDateString(),
            'smsStatus'      => $r->sms_status,
            'donorResponse'  => $r->donor_response,
            'recallReason'   => $r->recall_reason,
            'processedBy'    => $r->processed_by,
            'createdAt'      => $r->created_at?->toDateTimeString(),
        ];
    }
}
