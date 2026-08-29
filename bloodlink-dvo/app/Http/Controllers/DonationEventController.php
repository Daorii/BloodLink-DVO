<?php

namespace App\Http\Controllers;

use App\Models\DonationEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationEventController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'donationEvents' => DonationEvent::orderBy('event_date', 'desc')->get()->map(fn($e) => $this->format($e))
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'province'             => 'required|string|max:100',
            'cityMunicipality'     => 'required|string|max:100',
            'barangayOrganization' => 'required|string|max:100',
            'eventDate'            => 'required|date',
        ]);

        $event = DonationEvent::create([
            'province'             => $v['province'],
            'city_municipality'    => $v['cityMunicipality'],
            'barangay_organization'=> $v['barangayOrganization'],
            'event_date'           => $v['eventDate'],
            'created_by'           => $request->user()?->user_id,
        ]);

        return response()->json([
            'donationEvent' => $this->format($event),
            'message'       => 'Donation event created successfully.',
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        DonationEvent::findOrFail($id)->delete();
        return response()->json(['message' => 'Event deleted.']);
    }

    private function format(DonationEvent $e): array
    {
        return [
            'eventId'              => $e->eventId,           // "EVT-001"
            'event_id'             => $e->eventId,           // some parts use snake_case
            'province'             => $e->province,
            'cityMunicipality'     => $e->city_municipality,
            'city_municipality'    => $e->city_municipality,
            'barangayOrganization' => $e->barangay_organization,
            'barangay_organization'=> $e->barangay_organization,
            'eventDate'            => $e->event_date,
            'event_date'           => $e->event_date,
            'createdAt'            => $e->created_at?->toDateTimeString(),
        ];
    }
}
