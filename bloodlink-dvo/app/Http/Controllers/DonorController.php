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
            'donors' => Donor::orderBy('donor_id')->get()->map(fn($d) => $this->format($d))
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'firstName'        => 'required|string|max:50',
            'middleName'       => 'nullable|string|max:50',
            'lastName'         => 'required|string|max:50',
            'sex'              => 'required|string|in:Male,Female',
            'civilStatus'      => 'required|string',
            'dob'              => 'required|date',
            'address'          => 'required|string',
            'contactNumber'    => 'required|string|max:20',
            'email'            => 'nullable|email|max:100',
            'bloodType'        => 'nullable|string|max:50',
            'status'           => 'nullable|string',
            'donationDate'     => 'nullable|date',
            'lastDonation'     => 'nullable|date',
            'totalDonations'   => 'nullable|integer',
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
            'firstName'      => 'sometimes|required|string|max:50',
            'middleName'     => 'nullable|string|max:50',
            'lastName'       => 'sometimes|required|string|max:50',
            'sex'            => 'sometimes|string',
            'civilStatus'    => 'sometimes|string',
            'dob'            => 'sometimes|date',
            'address'        => 'sometimes|string',
            'contactNumber'  => 'sometimes|string|max:20',
            'email'          => 'nullable|email|max:100',
            'bloodType'      => 'nullable|string|max:5',
            'status'         => 'nullable|string',
            'lastDonation'   => 'nullable|date',
            'totalDonations' => 'nullable|integer',
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
        return [
            'id'             => $d->id,
            'name'           => $d->name,
            'sex'            => $d->sex,
            'civilStatus'    => $d->civil_status,
            'dob'            => $d->birth_date,
            'bloodType'      => $d->blood_type ?? '',
            'address'        => $d->address,
            'phone'          => $d->contact_number,
            'email'          => $d->email ?? '',
            'status'         => $d->donor_status,
            'donationDate'   => $d->registration_date,
            'lastDonation'   => $d->last_donation_date ?? '',
            'totalDonations' => $d->total_donations,
            'remarks'        => $d->remarks ?? '',
        ];
    }
}
