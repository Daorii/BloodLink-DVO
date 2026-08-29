<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationEvent extends Model
{
    protected $primaryKey = 'event_id';

    protected $fillable = [
        'province', 'city_municipality',
        'barangay_organization', 'event_date', 'created_by',
    ];

    protected $appends = ['eventId', 'cityMunicipality', 'barangayOrganization', 'eventDate'];

    // "EVT-001" format
    public function getEventIdAttribute(): string
    {
        return 'EVT-' . str_pad((string) $this->event_id, 3, '0', STR_PAD_LEFT);
    }

    public function getCityMunicipalityAttribute(): string   { return $this->attributes['city_municipality'] ?? ''; }
    public function getBarangayOrganizationAttribute(): string { return $this->attributes['barangay_organization'] ?? ''; }
    public function getEventDateAttribute(): string          { return $this->attributes['event_date'] ?? ''; }
}
