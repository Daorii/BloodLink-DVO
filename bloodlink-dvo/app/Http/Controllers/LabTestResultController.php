<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\DonationEvent;
use App\Models\LabTestResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabTestResultController extends Controller
{
    private const VALID_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    /**
     * GET /api/lab-results
     */
    public function index(): JsonResponse
    {
        $results = LabTestResult::with('donation.donor')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'labResults' => $results->map(fn($r) => $this->format($r)),
        ]);
    }

    /**
     * POST /api/lab-results
     *
     * Serology calls this with the serial number from the DHQ.
     * If a donation with that serial number already exists (recorded by Registry),
     * lab results are attached to it. Otherwise a new donation is created.
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donorId'            => 'nullable|integer',
            'eventId'            => 'nullable|integer',
            'donationDate'       => 'nullable|date',
            'serialNumber'       => 'required|string|max:30',
            'hemoglobinResult'   => 'nullable|string|max:20',
            'bloodTypeConfirmed' => 'nullable|string|in:' . implode(',', self::VALID_BLOOD_TYPES),
            'hbsagResult'        => 'nullable|string|max:20',
            'syphilisResult'     => 'nullable|string|max:20',
            'hivResult'          => 'nullable|string|max:20',
            'hcvResult'          => 'nullable|string|max:20',
            'malariaResult'      => 'nullable|string|max:20',
            'natResult'          => 'nullable|string|max:20',
            'othersResult'       => 'nullable|string|max:50',
            'screeningOutcome'   => 'nullable|string|in:Accepted,Temporarily Deferred,Permanently Deferred,Indefinite Deferral',
        ]);

        // Check if a donation already exists with this serial number (Registry recorded it)
        $donation = Donation::where('serial_number', $v['serialNumber'])->first();

        if ($donation) {
            // Donation already recorded by Registry — check it has no lab result yet
            if (LabTestResult::where('donation_id', $donation->donation_id)->exists()) {
                return response()->json([
                    'message' => 'Lab results for serial number ' . $v['serialNumber'] . ' have already been recorded.',
                ], 422);
            }
        } else {
            // No existing donation — require donorId so we can create one
            if (empty($v['donorId'])) {
                return response()->json([
                    'message' => 'No donation found for serial number ' . $v['serialNumber'] . '. Please ask Registry to record the donation first, or provide the donor ID.',
                ], 404);
            }

            $eventId = null;
            if (!empty($v['eventId'])) {
                $eventId = DonationEvent::where('event_id', $v['eventId'])->exists()
                    ? $v['eventId'] : null;
            }

            $donation = Donation::create([
                'donor_id'          => $v['donorId'],
                'event_id'          => $eventId,
                'donation_date'     => $v['donationDate'] ?? now()->toDateString(),
                'serial_number'     => $v['serialNumber'],
                'screening_outcome' => null,
                'recorded_by'       => $request->user()?->user_id,
            ]);
        }

        // If Serology provides a screening outcome, update the donation record now
        if (!empty($v['screeningOutcome'])) {
            $donation->update(['screening_outcome' => $v['screeningOutcome']]);
            if ($donation->donor_id) {
                \App\Models\Donor::where('donor_id', $donation->donor_id)->update([
                    'donor_status' => $v['screeningOutcome'] === 'Accepted' ? 'Regular' : 'Lapsed',
                ]);
            }
        }

        // Attach lab results to the donation
        $result = LabTestResult::create([
            'donation_id'          => $donation->donation_id,
            'hemoglobin_result'    => $v['hemoglobinResult']   ?? null,
            'blood_type_confirmed' => $v['bloodTypeConfirmed'] ?? null,
            'hbsag_result'         => $v['hbsagResult']        ?? null,
            'syphilis_result'      => $v['syphilisResult']     ?? null,
            'hiv_result'           => $v['hivResult']          ?? null,
            'hcv_result'           => $v['hcvResult']          ?? null,
            'malaria_result'       => $v['malariaResult']      ?? null,
            'nat_result'           => $v['natResult']          ?? null,
            'others_result'        => $v['othersResult']       ?? null,
            'recorded_by'          => $request->user()?->user_id,
        ]);

        return response()->json([
            'donation'  => (new DonationController)->formatPublic($donation->load(['donor', 'event'])),
            'labResult' => $this->format($result->load('donation.donor')),
            'message'   => 'Lab results recorded successfully.',
        ], 201);
    }

    private function format(LabTestResult $r): array
    {
        $donor     = $r->donation?->donor;
        $donorName = $donor?->name ?? null;
        $donorId   = $donor?->donor_id ?? null;
        return [
            'testId'             => 'LAB-' . str_pad((string) $r->test_id, 3, '0', STR_PAD_LEFT),
            'test_id'            => $r->test_id,
            'donationId'         => $r->donation_id,
            'donation_id'        => $r->donation_id,
            'donorId'            => $donorId,
            'donor_id'           => $donorId,
            'donorName'          => $donorName,
            'serialNumber'       => $r->donation?->serial_number,
            'hemoglobinResult'   => $r->hemoglobin_result,
            'bloodTypeConfirmed' => $r->blood_type_confirmed,
            'hbsagResult'        => $r->hbsag_result,
            'syphilisResult'     => $r->syphilis_result,
            'hivResult'          => $r->hiv_result,
            'hcvResult'          => $r->hcv_result,
            'malariaResult'      => $r->malaria_result,
            'natResult'          => $r->nat_result,
            'othersResult'       => $r->others_result,
            'recordedBy'         => $r->recorded_by,
            'createdAt'          => $r->created_at?->toDateTimeString(),
        ];
    }
}
