<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            // Donation statistics come from actual accepted donation records,
            // not the denormalized donor columns which may pre-date this fix.
            'donors' => Donor::with(['donations' => fn($query) => $query
                ->where('screening_outcome', 'Accepted')
                ->select(['donation_id', 'donor_id', 'donation_date'])
            ])->orderBy('donor_id')->get()->map(fn($d) => $this->format($d))
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'firstName'        => ['required', 'string', 'max:50', 'regex:/^[\pL][\pL .\'-]*$/u'],
            'middleName'       => 'nullable|string|max:50',
            'lastName'         => ['required', 'string', 'max:50', 'regex:/^[\pL][\pL .\'-]*$/u'],
            'sex'              => 'required|string|in:Male,Female',
            'civilStatus'      => 'required|string',
            'dob'              => 'required|date|before:today',
            'address'          => 'required|string',
            'contactNumber'    => ['required', 'string', 'regex:/^(?:\+63|63|0)9\d{9}$/'],
            'email'            => 'nullable|email|max:100',
            'bloodType'        => 'nullable|string|max:50',
            'status'           => 'nullable|string',
            'donationDate'     => 'nullable|date|before_or_equal:today',
            'lastDonation'     => 'nullable|date|before_or_equal:today',
            'totalDonations'   => 'nullable|integer|min:0',
            'remarks'          => 'nullable|string|max:255',
        ]);

        $donor = Donor::create([
            'first_name'         => $v['firstName'],
            'middle_name'        => $v['middleName'] ?? null,
            'last_name'          => $v['lastName'],
            'sex'                => $v['sex'],
            'civil_status'       => $v['civilStatus'],
            'birth_date'         => $v['dob'],
            'address'            => $v['address'],
            'contact_number'     => $v['contactNumber'],
            'email'              => $v['email'] ?? null,
            'blood_type'         => $v['bloodType'] ?? null,
            'donor_status'       => $v['status'] ?? 'New',
            'registration_date'  => $v['donationDate'] ?? now()->toDateString(),
            'last_donation_date' => $v['lastDonation'] ?? null,
            'total_donations'    => $v['totalDonations'] ?? 0,
            'remarks'            => $v['remarks'] ?? null,
            'registered_by'      => $request->user()?->user_id,
        ]);

        return response()->json(['donor' => $this->format($donor), 'message' => 'Donor registered successfully.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $donor = Donor::findOrFail($id);

        $v = $request->validate([
            'firstName'      => ['sometimes', 'required', 'string', 'max:50', 'regex:/^[\pL][\pL .\'-]*$/u'],
            'middleName'     => 'nullable|string|max:50',
            'lastName'       => ['sometimes', 'required', 'string', 'max:50', 'regex:/^[\pL][\pL .\'-]*$/u'],
            'sex'            => 'sometimes|string',
            'civilStatus'    => 'sometimes|string',
            'dob'            => 'sometimes|date|before:today',
            'address'        => 'sometimes|string',
            'contactNumber'  => ['sometimes', 'required', 'string', 'regex:/^(?:\+63|63|0)9\d{9}$/'],
            'email'          => 'nullable|email|max:100',
            'bloodType'      => 'nullable|string|max:5',
            'status'         => 'nullable|string',
            'lastDonation'   => 'nullable|date|before_or_equal:today',
            'totalDonations' => 'nullable|integer|min:0',
            'remarks'        => 'nullable|string|max:255',
        ]);

        $map = [
            'firstName' => 'first_name', 'middleName' => 'middle_name',
            'lastName'  => 'last_name',  'civilStatus' => 'civil_status',
            'dob'       => 'birth_date', 'contactNumber' => 'contact_number',
            'bloodType' => 'blood_type', 'status' => 'donor_status',
            'lastDonation' => 'last_donation_date', 'totalDonations' => 'total_donations',
        ];

        $updates = [];
        foreach ($v as $key => $val) {
            $col = $map[$key] ?? $key;
            $updates[$col] = $val;
        }

        $donor->update($updates);

        return response()->json(['donor' => $this->format($donor), 'message' => 'Donor updated successfully.']);
    }

    public function destroy(int $id): JsonResponse
    {
        Donor::findOrFail($id)->delete();
        return response()->json(['message' => 'Donor deleted.']);
    }

    private function format(Donor $d): array
    {
        $acceptedDonations = $d->relationLoaded('donations') ? $d->donations : collect();
        $lastAcceptedDonation = $acceptedDonations
            ->sortByDesc('donation_date')
            ->first();

        return [
            'id'             => $d->id,
            'name'           => $d->name,
            // Kept separately so a Registry edit does not lose a donor's middle name.
            'firstName'      => $d->first_name,
            'middleName'     => $d->middle_name ?? '',
            'lastName'       => $d->last_name,
            'sex'            => $d->sex,
            'civilStatus'    => $d->civil_status,
            'dob'            => $d->birth_date,
            'bloodType'      => $d->blood_type ?? '',
            'address'        => $d->address,
            'phone'          => $d->contact_number,
            'email'          => $d->email ?? '',
            'status'         => $d->donor_status,
            'donationDate'   => $d->registration_date,
            'lastDonation'   => $lastAcceptedDonation?->donation_date ?? $d->last_donation_date ?? '',
            'totalDonations' => $d->relationLoaded('donations') ? $acceptedDonations->count() : $d->total_donations,
            'remarks'        => $d->remarks ?? '',
        ];
    }
}
