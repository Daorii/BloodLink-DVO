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

    public function update(Request $request, int $id): JsonResponse
    {
        $event = DonationEvent::findOrFail($id);

        $v = $request->validate([
            'province'             => 'sometimes|required|string|max:100',
            'cityMunicipality'     => 'sometimes|required|string|max:100',
            'barangayOrganization' => 'nullable|string|max:100',
            'eventDate'            => 'sometimes|required|date',
        ]);

        $updates = [];
        if (isset($v['province']))             $updates['province']              = $v['province'];
        if (isset($v['cityMunicipality']))     $updates['city_municipality']     = $v['cityMunicipality'];
        if (array_key_exists('barangayOrganization', $v)) $updates['barangay_organization'] = $v['barangayOrganization'];
        if (isset($v['eventDate']))            $updates['event_date']            = $v['eventDate'];

        $event->update($updates);

        return response()->json([
            'donationEvent' => $this->format($event),
            'message'       => 'Donation event updated successfully.',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $event = DonationEvent::find($id);
        if ($event) {
            $event->delete();
        }
        return response()->json(['message' => 'Event deleted successfully.']);
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
