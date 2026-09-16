<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\DonorRecall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DonorRecallController extends Controller
{
    /**
     * Send an SMS via Infobip.
     * PH format: strip leading 0, prepend 63 → e.g. 09665624874 → 639665624874
     */
    private function sendSMS(string $phone, string $message): bool
    {
        $apiKey  = env('INFOBIP_API_KEY');
        $baseUrl = env('INFOBIP_BASE_URL');

        if (!$apiKey || !$baseUrl) {
            Log::warning('Infobip credentials not set — SMS skipped.');
            return false;
        }

        // Normalise to international format (63XXXXXXXXX)
        $phone = preg_replace('/[\s\-\+]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '63' . substr($phone, 1);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'App ' . $apiKey,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ])->post("https://{$baseUrl}/sms/2/text/single", [
                'from' => 'BloodLink',
                'to'   => $phone,
                'text' => $message,
            ]);

            if ($response->successful()) {
                Log::info("Infobip SMS sent to {$phone}");
                return true;
            }

            Log::error("Infobip error ({$response->status()}): " . $response->body());
            return false;

        } catch (\Throwable $e) {
            Log::error("Infobip exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Build the personalised recall SMS for a donor.
     */
    private function buildMessage(Donor $donor): string
    {
        $firstName = $donor->first_name ?? 'Donor';
        return "Hi {$firstName}! BloodLink from SNBC-DVO is reaching out. "
             . "You are now eligible to donate blood again — it has been over 90 days since your last donation. "
             . "Your blood can save lives! Please visit the Southern Philippines Medical Center Blood Bank "
             . "(SNBC-DVO) at your earliest convenience. Thank you for your generosity!";
    }

    // ── Endpoints ─────────────────────────────────────────────────────────

    /**
     * GET /api/recalls
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
     * Single donor recall.
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donor_id'      => 'required|integer|exists:donors,donor_id',
            'recall_reason' => 'nullable|string|max:100',
        ]);

        $donor   = Donor::findOrFail($v['donor_id']);
        $message = $this->buildMessage($donor);
        $sent    = $this->sendSMS($donor->contact_number ?? '', $message);

        $recall = DonorRecall::create([
            'donor_id'       => $v['donor_id'],
            'recall_date'    => now()->toDateString(),
            'sms_status'     => $sent ? 'Sent' : 'Failed',
            'donor_response' => null,
            'recall_reason'  => $v['recall_reason'] ?? 'Critical Shortage Match',
            'processed_by'   => $request->user()?->user_id,
        ]);

        return response()->json([
            'recall'  => $this->format($recall->load('donor')),
            'message' => $sent
                ? 'Recall SMS sent successfully.'
                : 'Recall logged but SMS delivery failed — check logs.',
            'smsSent' => $sent,
        ], 201);
    }

    /**
     * POST /api/recalls/bulk
     * Bulk recall for multiple donors.
     */
    public function bulk(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donor_ids'     => 'required|array|min:1',
            'donor_ids.*'   => 'integer|exists:donors,donor_id',
            'recall_reason' => 'nullable|string|max:100',
        ]);

        $today     = now()->toDateString();
        $userId    = $request->user()?->user_id;
        $reason    = $v['recall_reason'] ?? 'Critical Shortage Match';
        $created   = [];
        $sentCount = 0;

        foreach ($v['donor_ids'] as $donorId) {
            $donor   = Donor::findOrFail($donorId);
            $message = $this->buildMessage($donor);
            $sent    = $this->sendSMS($donor->contact_number ?? '', $message);

            $recall = DonorRecall::create([
                'donor_id'       => $donorId,
                'recall_date'    => $today,
                'sms_status'     => $sent ? 'Sent' : 'Failed',
                'donor_response' => null,
                'recall_reason'  => $reason,
                'processed_by'   => $userId,
            ]);

            $created[] = $this->format($recall->load('donor'));
            if ($sent) $sentCount++;
        }

        return response()->json([
            'recalls' => $created,
            'count'   => count($created),
            'sent'    => $sentCount,
            'failed'  => count($created) - $sentCount,
            'message' => "{$sentCount} of " . count($created) . " recall SMS messages sent successfully.",
        ], 201);
    }

    /**
     * PUT /api/recalls/{id}/response
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
