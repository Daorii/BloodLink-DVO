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
     * Create a donation record (called by Registry staff).
     * Accepts serial number from the physical DHQ form.
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donorId'          => 'required|integer|exists:donors,donor_id',
            'eventId'          => 'nullable|integer',
            'donationDate'     => 'required|date|before_or_equal:today',
            'serialNumber'     => ['nullable', 'string', 'max:30', 'regex:/^[A-Za-z0-9-]+$/', 'unique:donations,serial_number'],
            'screeningOutcome' => 'nullable|string|in:Accepted,Temporarily Deferred,Permanently Deferred,Indefinite Deferral',
            'deferralReason'   => 'required_unless:screeningOutcome,Accepted|nullable|string|max:255',
            'deferralEndDate'  => 'nullable|date|after_or_equal:donationDate',
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
            'serial_number'     => $v['serialNumber'] ?? null,
            'screening_outcome' => $v['screeningOutcome'] ?? null,
            'deferral_reason'   => $v['deferralReason'] ?? null,
            'deferral_end_date' => $v['deferralEndDate'] ?? null,
            'recorded_by'       => $request->user()?->user_id,
        ]);

        // Keep the donor summary synchronized with the authoritative donation records.
        if (!empty($v['screeningOutcome'])) {
            $status = $v['screeningOutcome'] === 'Accepted' ? 'Regular' : 'Lapsed';
            Donor::where('donor_id', $v['donorId'])->update(['donor_status' => $status]);
        }
        $this->syncDonorDonationStats($v['donorId']);

        return response()->json([
            'donation' => $this->format($donation->load(['donor', 'event'])),
            'message'  => 'Donation record created successfully.',
        ], 201);
    }

    /**
     * Look up a donation by serial number (used by Serology to auto-fill donor info).
     * GET /api/donations/by-serial/{serial}
     */
    public function findBySerial(string $serial): JsonResponse
    {
        $donation = Donation::with(['donor', 'event', 'labResult'])
            ->where('serial_number', $serial)
            ->first();

        if (!$donation) {
            return response()->json(['message' => 'No donation found with this serial number.'], 404);
        }

        return response()->json([
            'donation'     => $this->format($donation),
            'hasLabResult' => $donation->labResult !== null,
        ]);
    }

    /**
     * Update only the screening outcome of an existing donation.
     */
    public function updateOutcome(Request $request, int $id): JsonResponse
    {
        $donation = Donation::find($id);
        if (!$donation) {
            return response()->json(['message' => 'Donation not found.'], 404);
        }

        if (!LabTestResult::where('donation_id', $id)->exists()) {
            return response()->json([
                'message' => 'Cannot record outcome — lab results must be recorded first.'
            ], 422);
        }

        $v = $request->validate([
            'screeningOutcome' => 'required|string|max:30|in:Accepted,Temporarily Deferred,Permanently Deferred,Indefinite Deferral',
            'deferralReason'   => 'required_unless:screeningOutcome,Accepted|nullable|string|max:255',
            'deferralEndDate'  => 'nullable|date',
        ]);

        $donation->update([
            'screening_outcome' => $v['screeningOutcome'],
            'deferral_reason'   => $v['deferralReason']  ?? null,
            'deferral_end_date' => $v['deferralEndDate'] ?? null,
        ]);

        $status = $v['screeningOutcome'] === 'Accepted' ? 'Regular' : 'Lapsed';
        Donor::where('donor_id', $donation->donor_id)->update(['donor_status' => $status]);
        $this->syncDonorDonationStats($donation->donor_id);

        return response()->json([
            'donation' => $this->format($donation->fresh(['donor', 'event', 'labResult'])),
            'message'  => 'Screening outcome recorded successfully.',
        ]);
    }

    public function formatPublic(Donation $d): array { return $this->format($d); }

    /** Synchronize the donor summary after a donation outcome changes. */
    private function syncDonorDonationStats(int $donorId): void
    {
        $acceptedDonations = Donation::where('donor_id', $donorId)
            ->where('screening_outcome', 'Accepted');

        Donor::where('donor_id', $donorId)->update([
            'total_donations'    => $acceptedDonations->count(),
            'last_donation_date' => $acceptedDonations->max('donation_date'),
        ]);
    }

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
            'serialNumber'     => $d->serial_number,
            'screeningOutcome' => $d->screening_outcome,
            'deferralReason'   => $d->deferral_reason,
            'deferralEndDate'  => $d->deferral_end_date,
            'recordedBy'       => $d->recorded_by,
            'hasLabResult'     => $d->labResult !== null,
            'createdAt'        => $d->created_at?->toDateTimeString(),
        ];
    }
}
