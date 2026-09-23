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
    private ?string $lastSmsError = null;

    /**
     * Send an SMS through PhilSMS.
     * PhilSMS expects Philippine mobile numbers in international form, e.g.
     * 09665624874 -> 639665624874.
     */
    private function sendSMS(string $phone, string $message): bool
    {
        $apiToken = env('PHILSMS_API_TOKEN');
        $senderId = env('PHILSMS_SENDER_ID', 'PhilSMS');
        $apiUrl   = env('PHILSMS_API_URL', 'https://dashboard.philsms.com/api/v3/sms/send');

        if (!$apiToken) {
            Log::warning('PhilSMS API token not set — SMS skipped.');
            $this->lastSmsError = 'PhilSMS API token is not configured.';
            return false;
        }

        // Normalize to the format PhilSMS requires: 639XXXXXXXXX.
        $phone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '63' . substr($phone, 1);
        }

        if (!preg_match('/^639\d{9}$/', $phone)) {
            Log::warning('PhilSMS skipped an invalid Philippine mobile number.');
            $this->lastSmsError = 'The donor does not have a valid Philippine mobile number.';
            return false;
        }

        try {
            $response = Http::withToken($apiToken)
                ->acceptJson()
                ->post($apiUrl, [
                    'recipient' => $phone,
                    'sender_id' => $senderId,
                    'type'      => 'plain',
                    'message'   => $message,
                ]);

            if ($response->successful() && data_get($response->json(), 'status') === 'success') {
                Log::info('PhilSMS recall message accepted.', ['recipient' => $phone]);
                return true;
            }

            Log::error('PhilSMS request failed.', [
                'status' => $response->status(),
                'body'   => $response->json() ?? $response->body(),
            ]);
            $this->lastSmsError = data_get($response->json(), 'message')
                ?? 'PhilSMS could not accept this message.';
            return false;

        } catch (\Throwable $e) {
            Log::error('PhilSMS exception: ' . $e->getMessage());
            $this->lastSmsError = 'The SMS provider could not be reached.';
            return false;
        }
    }

    /**
     * Build the personalised recall SMS for a donor.
     */
    private function buildMessage(Donor $donor): string
    {
        $firstName = $donor->first_name ?? 'Donor';
        return "Hi {$firstName}, BloodLink SNBC-DVO: you are eligible to donate again. "
             . "Please visit the SPMC Blood Bank when convenient. Thank you!";
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
            'recall_reason' => 'nullable|string|max:200',
            'sms_message'   => 'nullable|string|max:160',
        ]);

        $donor   = Donor::findOrFail($v['donor_id']);
        $message = $v['sms_message'] ?? $this->buildMessage($donor);
        // Replace [Donor] placeholder with actual first name
        $message = str_replace('[Donor]', $donor->first_name ?? 'Donor', $message);
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
                : 'Recall logged, but SMS was not sent: ' . ($this->lastSmsError ?? 'Unknown PhilSMS error.'),
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
            'recall_reason' => 'nullable|string|max:200',
            'sms_message'   => 'nullable|string|max:160',
        ]);

        $today      = now()->toDateString();
        $userId     = $request->user()?->user_id;
        $reason     = $v['recall_reason'] ?? 'Critical Shortage Match';
        $created    = [];
        $sentCount  = 0;

        foreach ($v['donor_ids'] as $donorId) {
            $donor   = Donor::findOrFail($donorId);
            $message = $v['sms_message'] ?? $this->buildMessage($donor);
            // Replace [Donor] placeholder with actual first name for personalization
            $message = str_replace('[Donor]', $donor->first_name ?? 'Donor', $message);
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
