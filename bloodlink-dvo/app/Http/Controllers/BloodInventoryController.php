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
    private const VALID_STATUS        = ['Available', 'Reserved', 'Issued', 'Expired', 'Discarded'];

    // Volume ranges per component (cc) — based on DOH reference chart
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
     */
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'donationId'      => 'nullable|integer',
            'unitCode'        => 'nullable|string|max:50',
            'bloodType'       => 'required|string|in:' . implode(',', self::VALID_BLOOD_TYPES),
            'component'       => 'required|string|in:' . implode(',', self::VALID_COMPONENTS),
            'volumeCC'        => 'required|numeric|min:0',
            'collectionDate'  => 'required|date',
            'expirationDate'  => 'required|date|after:collectionDate',
            'safetyStatus'    => 'nullable|string|in:' . implode(',', self::VALID_SAFETY),
            'intendedUse'     => 'nullable|string|in:' . implode(',', self::VALID_INTENDED_USE),
            'inventoryStatus' => 'nullable|string|in:' . implode(',', self::VALID_STATUS),
        ]);

        // Server-side volume range validation
        $range = self::VOLUME_RANGES[$v['component']] ?? null;
        if ($range && ($v['volumeCC'] < $range['min'] || $v['volumeCC'] > $range['max'])) {
            return response()->json([
                'message' => "Volume for {$v['component']} must be between {$range['min']} and {$range['max']} cc.",
                'errors'  => ['volumeCC' => ["Volume must be {$range['min']}–{$range['max']} cc for {$v['component']}."]],
            ], 422);
        }

        $unit = BloodInventory::create([
            'donation_id'      => $v['donationId']      ?? null,
            'unit_code'        => $v['unitCode']         ?? null,
            'blood_type'       => $v['bloodType'],
            'component'        => $v['component'],
            'volume_cc'        => $v['volumeCC'],
            'collection_date'  => $v['collectionDate'],
            'expiration_date'  => $v['expirationDate'],
            'safety_status'    => $v['safetyStatus']    ?? 'Cleared',
            'intended_use'     => $v['intendedUse']     ?? 'Transfusable',
            'inventory_status' => $v['inventoryStatus'] ?? 'Available',
            'recorded_by'      => $request->user()?->user_id,
        ]);

        return response()->json([
            'unit'    => $this->format($unit->load('donation.donor')),
            'message' => 'Blood unit recorded in inventory.',
        ], 201);
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
            'unitId'          => 'INV-' . str_pad((string) $u->unit_id, 4, '0', STR_PAD_LEFT),
            'unit_id'         => $u->unit_id,
            'donationId'      => $u->donation_id,
            'serialNumber'    => $serialNumber,
            'donorName'       => $donorName,
            'unitCode'        => $u->unit_code,
            'bloodType'       => $u->blood_type,
            'component'       => $u->component,
            'volumeCC'        => $u->volume_cc,
            'quantity'        => $u->volume_cc, // alias for frontend compatibility
            'collectionDate'  => $u->collection_date,
            'expirationDate'  => $u->expiration_date,
            'safetyStatus'    => $u->safety_status,
            'intendedUse'     => $u->intended_use,
            'inventoryStatus' => $u->inventory_status,
            'recordedBy'      => $u->recorded_by,
            'createdAt'       => $u->created_at?->toDateTimeString(),
        ];
    }
}
