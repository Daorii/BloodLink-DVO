<?php

namespace App\Http\Controllers;

use App\Models\BloodInventory;
use App\Models\WalkinIssuance;
use App\Models\WalkinIssuanceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WalkinIssuanceController extends Controller
{
    // ── GET /api/walkin-issuances ─────────────────────────────────────────
    public function index()
    {
        $records = WalkinIssuance::with([
            'issuedByUser:user_id,first_name,last_name',
            'items.bloodUnit:unit_id,unit_id,blood_type,component,volume_cc,expiration_date',
        ])
        ->orderByDesc('issuance_date')
        ->get()
        ->map(function ($rec) {
            return [
                'walkinIssuanceId'   => $rec->walkin_issuance_id,
                'patientName'        => $rec->patient_name,
                'patientAge'         => $rec->patient_age,
                'patientGender'      => $rec->patient_gender,
                'diagnosis'          => $rec->diagnosis,
                'attendingPhysician' => $rec->attending_physician,
                'purpose'            => $rec->purpose,
                'issuedBy'           => $rec->issuedByUser
                                           ? trim($rec->issuedByUser->first_name . ' ' . $rec->issuedByUser->last_name)
                                           : 'Unknown',
                'issuanceDate'       => $rec->issuance_date?->format('Y-m-d H:i'),
                'status'             => $rec->status,
                'remarks'            => $rec->remarks,
                'units'              => $rec->items->map(fn($item) => [
                    'unitId'         => $item->bloodUnit?->unit_id,
                    'bloodType'      => $item->bloodUnit?->blood_type,
                    'component'      => $item->bloodUnit?->component,
                    'volumeCC'       => $item->bloodUnit?->volume_cc,
                    'expirationDate' => $item->bloodUnit?->expiration_date,
                ]),
            ];
        });

        return response()->json(['data' => $records]);
    }

    // ── POST /api/walkin-issuances ────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patientName'        => 'required|string|max:150',
            'patientAge'         => 'nullable|integer|min:0|max:130',
            'patientGender'      => 'nullable|string|in:Male,Female,Other',
            'diagnosis'          => 'nullable|string|max:255',
            'attendingPhysician' => 'nullable|string|max:150',
            'purpose'            => 'required|string|in:Surgery,Emergency,Elective,Other',
            'remarks'            => 'nullable|string',
            'unitIds'            => 'required|array|min:1',
            'unitIds.*'          => 'required|integer|exists:blood_inventory,unit_id',
        ]);

        // Ensure all selected units are still Available
        $units = BloodInventory::whereIn('unit_id', $validated['unitIds'])
            ->lockForUpdate()
            ->get();

        $unavailable = $units->filter(fn($u) => $u->inventory_status !== 'Available');
        if ($unavailable->count() > 0) {
            $ids = $unavailable->pluck('unit_id')->join(', ');
            return response()->json([
                'message' => "Unit(s) {$ids} are no longer available. Please refresh and select again.",
            ], 422);
        }

        DB::transaction(function () use ($validated, $units) {
            // Create the walk-in issuance header
            $issuance = WalkinIssuance::create([
                'patient_name'        => $validated['patientName'],
                'patient_age'         => $validated['patientAge'] ?? null,
                'patient_gender'      => $validated['patientGender'] ?? null,
                'diagnosis'           => $validated['diagnosis'] ?? null,
                'attending_physician' => $validated['attendingPhysician'] ?? null,
                'purpose'             => $validated['purpose'],
                'issued_by'           => Auth::id(),
                'status'              => 'Completed',
                'remarks'             => $validated['remarks'] ?? null,
            ]);

            // Create line items + mark each unit as Issued
            foreach ($units as $unit) {
                WalkinIssuanceItem::create([
                    'walkin_issuance_id' => $issuance->walkin_issuance_id,
                    'unit_id'            => $unit->unit_id,
                ]);

                $unit->update(['inventory_status' => 'Issued']);
            }
        });

        return response()->json(['message' => 'Walk-in issuance recorded successfully.'], 201);
    }
}
