<?php

namespace App\Http\Controllers;

use App\Models\BloodInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BloodInventoryController extends Controller
{
    private const VALID_COMPONENTS    = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
    private const VALID_BLOOD_TYPES   = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    private const VALID_SAFETY        = ['Cleared', 'Hold-Quarantined', 'NCU', 'NS', 'Discarded'];
    private const VALID_INTENDED_USE  = ['Transfusable', 'Storage-Research Only', 'Restricted'];
    private const VALID_STATUS        = ['Pending Verification', 'Available', 'Reserved', 'Issued', 'Expired', 'Discarded', 'Rejected'];

    // Acceptable volume ranges per component (cc) — SNBC / DOH NVBSP reference chart
    private const VOLUME_RANGES = [
        'PRBC'                 => ['min' => 230, 'max' => 330],
        'Platelet Concentrate' => ['min' => 50,  'max' => 70 ],
        'FFP'                  => ['min' => 150, 'max' => 250],
        'Cryoprecipitate'      => ['min' => 15,  'max' => 30 ],
        'Cryosupernate'        => ['min' => 190, 'max' => 210],
    ];

    /**
     * GET /api/blood-inventory
     */
    public function index(): JsonResponse
    {
        $units = BloodInventory::with('donation.donor')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'bloodInventory' => $units->map(fn($u) => $this->format($u)),
        ]);
    }

    /**
     * POST /api/blood-inventory
     * Production staff submits a component — defaults to "Pending Verification".
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donationId'      => 'nullable|integer',
            'unitCode'        => 'nullable|string|max:50',
            'bloodType'       => 'required|string|in:' . implode(',', self::VALID_BLOOD_TYPES),
            'component'       => 'required|string|in:' . implode(',', self::VALID_COMPONENTS),
            'volumeCC'        => 'required|numeric|gt:0',
            'collectionDate'  => 'required|date|before_or_equal:today',
            'expirationDate'  => 'required|date|after:collectionDate',
            'safetyStatus'    => 'nullable|string|in:' . implode(',', self::VALID_SAFETY),
            'intendedUse'     => 'nullable|string|in:' . implode(',', self::VALID_INTENDED_USE),
            // Non-cleared status documentation
            'remarks'         => 'nullable|string|max:500',
            'statusDate'      => 'nullable|date|before_or_equal:today',
        ]);

        // Server-side volume range soft-validation:
        // If outside the acceptable range, force safety_status to NCU.
        $range = self::VOLUME_RANGES[$v['component']] ?? null;
        $safetyStatus = $v['safetyStatus'] ?? 'Cleared';
        if ($range && ($v['volumeCC'] < $range['min'] || $v['volumeCC'] > $range['max'])) {
            $safetyStatus = 'NCU';
        }

        $remarks    = in_array($safetyStatus, ['Hold-Quarantined', 'NCU']) ? ($v['remarks'] ?? null) : null;
        $statusDate = in_array($safetyStatus, ['Hold-Quarantined', 'NCU']) ? ($v['statusDate'] ?? null) : null;

        // Determine inventory status:
        // Cleared → "Pending Verification" (awaits Issuance approval)
        // Hold-Quarantined / NCU → "Reserved"
        // Discarded → "Discarded"
        if ($safetyStatus === 'Discarded') {
            $inventoryStatus = 'Discarded';
        } elseif (in_array($safetyStatus, ['Hold-Quarantined', 'NCU'])) {
            $inventoryStatus = 'Reserved';
        } else {
            $inventoryStatus = 'Pending Verification';
        }

        $unit = BloodInventory::create([
            'donation_id'      => $v['donationId']      ?? null,
            'unit_code'        => $v['unitCode']         ?? null,
            'blood_type'       => $v['bloodType'],
            'component'        => $v['component'],
            'volume_cc'        => $v['volumeCC'],
            'collection_date'  => $v['collectionDate'],
            'expiration_date'  => $v['expirationDate'],
            'safety_status'    => $safetyStatus,
            'intended_use'     => $v['intendedUse']     ?? 'Transfusable',
            'inventory_status' => $inventoryStatus,
            'remarks'          => $remarks,
            'status_date'      => $statusDate,
            'recorded_by'      => $request->user()?->user_id,
        ]);

        return response()->json([
            'unit'    => $this->format($unit->load('donation.donor')),
            'message' => 'Blood unit submitted — awaiting Issuance verification.',
        ], 201);
    }

    /**
     * PUT /api/blood-inventory/{id}/verify
     * Issuance staff accepts or declines a pending unit.
     *
     * Body: { action: 'accept'|'decline', rejection_reason?: string }
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $unit = BloodInventory::find($id);
        if (!$unit) return response()->json(['message' => 'Unit not found.'], 404);

        if ($unit->inventory_status !== 'Pending Verification') {
            return response()->json(['message' => 'Unit is not pending verification.'], 422);
        }

        $v = $request->validate([
            'action'           => 'required|string|in:accept,decline',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        if ($v['action'] === 'accept') {
            $unit->update([
                'inventory_status' => 'Available',
                'rejection_reason' => null,
                'verified_by'      => $request->user()?->user_id,
            ]);
            $message = 'Unit accepted and added to available inventory.';
        } else {
            $unit->update([
                'inventory_status' => 'Rejected',
                'rejection_reason' => $v['rejection_reason'] ?? 'No reason provided.',
                'verified_by'      => $request->user()?->user_id,
            ]);
            $message = 'Unit rejected.';
        }

        return response()->json([
            'unit'    => $this->format($unit->fresh('donation.donor')),
            'message' => $message,
        ]);
    }

    /**
     * PUT /api/blood-inventory/{id}/status
     * Update inventory_status (e.g. mark as Issued, Expired, Discarded)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $unit = BloodInventory::find($id);
        if (!$unit) return response()->json(['message' => 'Unit not found.'], 404);

        $v = $request->validate([
            'inventoryStatus' => 'required|string|in:' . implode(',', self::VALID_STATUS),
        ]);

        $unit->update(['inventory_status' => $v['inventoryStatus']]);

        return response()->json([
            'unit'    => $this->format($unit->fresh('donation.donor')),
            'message' => 'Unit status updated.',
        ]);
    }

    private function format(BloodInventory $u): array
    {
        $serialNumber = $u->donation?->serial_number;
        $donorName    = $u->donation?->donor?->name;

        return [
            'unitId'           => 'INV-' . str_pad((string) $u->unit_id, 4, '0', STR_PAD_LEFT),
            'unit_id'          => $u->unit_id,
            'donationId'       => $u->donation_id,
            'serialNumber'     => $serialNumber,
            'donorName'        => $donorName,
            'unitCode'         => $u->unit_code,
            'bloodType'        => $u->blood_type,
            'component'        => $u->component,
            'volumeCC'         => $u->volume_cc,
            'quantity'         => $u->volume_cc,
            'collectionDate'   => $u->collection_date,
            'expirationDate'   => $u->expiration_date,
            'safetyStatus'     => $u->safety_status,
            'intendedUse'      => $u->intended_use,
            'inventoryStatus'  => $u->inventory_status,
            'remarks'          => $u->remarks,
            'statusDate'       => $u->status_date,
            'rejectionReason'  => $u->rejection_reason,
            'verifiedBy'       => $u->verified_by,
            'recordedBy'       => $u->recorded_by,
            'createdAt'        => $u->created_at?->toDateTimeString(),
        ];
    }
}
