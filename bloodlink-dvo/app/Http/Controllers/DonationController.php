<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\Donor;
use App\Models\LabTestResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationController extends Controller
{
    public function index(): JsonResponse
    {
        $donations = Donation::with(['donor', 'event', 'labResult'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['donations' => $donations->map(fn($d) => $this->format($d))]);
    }

    /**
     * Create a PENDING donation (no outcome yet).
     * Called by lab staff when starting a new donation record.
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donorId'      => 'required|integer',
            'eventId'      => 'nullable|integer',
            'donationDate' => 'required|date',
        ]);

        $eventId = null;
        if (!empty($v['eventId'])) {
            $exists  = \App\Models\DonationEvent::where('event_id', $v['eventId'])->exists();
            $eventId = $exists ? $v['eventId'] : null;
        }

        $donation = Donation::create([
            'donor_id'          => $v['donorId'],
            'event_id'          => $eventId,
            'donation_date'     => $v['donationDate'],
            'screening_outcome' => null, // pending — will be set after lab results
            'recorded_by'       => $request->user()?->user_id,
        ]);

        return response()->json([
            'donation' => $this->format($donation->load(['donor', 'event'])),
            'message'  => 'Donation record created (pending outcome).',
        ], 201);
    }

    /**
     * Update only the screening outcome of an existing donation.
     * Called after lab results are recorded.
     */
    public function updateOutcome(Request $request, int $id): JsonResponse
    {
        $donation = Donation::find($id);
        if (!$donation) {
            return response()->json(['message' => 'Donation not found.'], 404);
        }

        // Must have lab results before recording outcome
        if (!LabTestResult::where('donation_id', $id)->exists()) {
            return response()->json([
                'message' => 'Cannot record outcome — lab results must be recorded first.'
            ], 422);
        }

        $v = $request->validate([
            'screeningOutcome' => 'required|string|max:30|in:Accepted,Temporarily Deferred,Permanently Deferred,Indefinite Deferral',
            'deferralReason'   => 'nullable|string',
            'deferralEndDate'  => 'nullable|date',
        ]);

        $donation->update([
            'screening_outcome' => $v['screeningOutcome'],
            'deferral_reason'   => $v['deferralReason']  ?? null,
            'deferral_end_date' => $v['deferralEndDate'] ?? null,
        ]);

        // Update donor status
        $status = match($v['screeningOutcome']) {
            'Accepted'             => 'Regular',
            default                => 'Lapsed',
        };
        Donor::where('donor_id', $donation->donor_id)->update(['donor_status' => $status]);

        return response()->json([
            'donation' => $this->format($donation->fresh(['donor', 'event', 'labResult'])),
            'message'  => 'Screening outcome recorded successfully.',
        ]);
    }

    /** Public wrapper so other controllers can format a donation */
    public function formatPublic(Donation $d): array { return $this->format($d); }

    private function format(Donation $d): array
    {
        $eventId = $d->event_id
            ? ('EVT-' . str_pad((string) $d->event_id, 3, '0', STR_PAD_LEFT))
            : null;

        return [
            'donationId'       => 'DON-' . str_pad((string) $d->donation_id, 3, '0', STR_PAD_LEFT),
            'donation_id'      => $d->donation_id,
            'donorId'          => $d->donor_id,
            'donorName'        => $d->donor ? $d->donor->name : null,
            'eventId'          => $eventId,
            'donationDate'     => $d->donation_date,
            'screeningOutcome' => $d->screening_outcome,  // null = pending
            'deferralReason'   => $d->deferral_reason,
            'deferralEndDate'  => $d->deferral_end_date,
            'recordedBy'       => $d->recorded_by,
            'hasLabResult'     => $d->labResult !== null,
            'createdAt'        => $d->created_at?->toDateTimeString(),
        ];
    }
}
