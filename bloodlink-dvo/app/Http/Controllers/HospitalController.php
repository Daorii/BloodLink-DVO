<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    /**
     * GET /api/hospitals
     *
     * List all hospitals.
     */
    public function index(): JsonResponse
    {
        $hospitals = Hospital::orderBy('hospital_id')->get();

        return response()->json([
            'hospitals' => $hospitals->map(fn (Hospital $h) => $this->formatHospital($h)),
        ]);
    }

    /**
     * GET /api/hospitals/{id}
     *
     * Get a single hospital by hospital_id.
     */
    public function show(int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);

        return response()->json([
            'hospital' => $this->formatHospital($hospital),
        ]);
    }

    /**
     * POST /api/hospitals
     *
     * Create a new hospital.
     *
     * Expected request body (matching the frontend's hospitalForm):
     * {
     *   name, type, contact, phone, email, address, registrationStatus
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:150',
            'type'               => 'required|string|in:Government,Private,Blood Bank',
            'contact'            => 'nullable|string|max:100',
            'phone'              => 'nullable|string|max:20',
            'email'              => 'nullable|email|max:100',
            'address'            => 'required|string',
            'registrationStatus' => 'nullable|string|in:Active,Pending,Suspended',
        ]);

        $hospital = Hospital::create([
            'name'                => $validated['name'],
            'type'                => $validated['type'],
            'contact'             => $validated['contact'] ?? null,
            'phone'               => $validated['phone'] ?? null,
            'email'               => $validated['email'] ?? null,
            'address'             => $validated['address'],
            'registration_status' => $validated['registrationStatus'] ?? 'Pending',
            'registered_by'       => $request->user()?->user_id,
        ]);

        return response()->json([
            'hospital' => $this->formatHospital($hospital),
            'message'  => 'Hospital registered successfully.',
        ], 201);
    }

    /**
     * PUT /api/hospitals/{id}
     *
     * Update an existing hospital.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);

        $validated = $request->validate([
            'name'               => 'sometimes|required|string|max:150',
            'type'               => 'sometimes|required|string|in:Government,Private,Blood Bank',
            'contact'            => 'nullable|string|max:100',
            'phone'              => 'nullable|string|max:20',
            'email'              => 'nullable|email|max:100',
            'address'            => 'sometimes|required|string',
            'registrationStatus' => 'nullable|string|in:Active,Pending,Suspended',
        ]);

        $updates = [];
        if (isset($validated['name']))               $updates['name']                = $validated['name'];
        if (isset($validated['type']))               $updates['type']                = $validated['type'];
        if (array_key_exists('contact', $validated)) $updates['contact']             = $validated['contact'];
        if (array_key_exists('phone', $validated))   $updates['phone']               = $validated['phone'];
        if (array_key_exists('email', $validated))   $updates['email']               = $validated['email'];
        if (isset($validated['address']))            $updates['address']             = $validated['address'];
        if (isset($validated['registrationStatus'])) $updates['registration_status'] = $validated['registrationStatus'];

        $hospital->update($updates);

        return response()->json([
            'hospital' => $this->formatHospital($hospital),
            'message'  => 'Hospital updated successfully.',
        ]);
    }

    /**
     * DELETE /api/hospitals/{id}
     *
     * Delete a hospital.
     */
    public function destroy(int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->delete();

        return response()->json([
            'message' => 'Hospital deleted successfully.',
        ]);
    }

    /**
     * Format a Hospital model into the exact shape the frontend expects.
     *
     * Frontend initialHospitals shape:
     * {
     *   id: "HOSP-001",
     *   name: "Southern Philippines Medical Center (SPMC)",
     *   type: "Government",
     *   contact: "Dr. Maria Santos",
     *   phone: "0917-000-0001",
     *   email: "bloodbank@spmc.gov.ph",
     *   address: "J.P. Laurel Ave., Bajada, Davao City",
     *   registrationStatus: "Active"
     * }
     */
    private function formatHospital(Hospital $hospital): array
    {
        return [
            'id'                 => $hospital->id,                  // "HOSP-001"
            'name'               => $hospital->name,
            'type'               => $hospital->type,
            'contact'            => $hospital->contact ?? '',
            'phone'              => $hospital->phone ?? '',
            'email'              => $hospital->email ?? '',
            'address'            => $hospital->address,
            'registrationStatus' => $hospital->registration_status,
            'createdAt'          => $hospital->created_at?->toDateTimeString(),
            'updatedAt'          => $hospital->updated_at?->toDateTimeString(),
        ];
    }
}
