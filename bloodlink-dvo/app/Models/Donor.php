<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Donor extends Model
{
    protected $primaryKey = 'donor_id';

    protected $fillable = [
        'first_name', 'middle_name', 'last_name',
        'sex', 'civil_status', 'birth_date',
        'address', 'contact_number', 'email',
        'blood_type', 'donor_status',
        'registration_date', 'last_donation_date',
        'total_donations', 'remarks', 'registered_by',
    ];

    protected $appends = ['id', 'name', 'phone', 'dob', 'bloodType', 'status', 'civilStatus', 'donationDate', 'lastDonation', 'totalDonations'];

    // ─── Relationship ────────────────────────────────────────────────────
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by', 'user_id');
    }

    // ─── Accessors (maps DB columns → frontend field names) ──────────────

    // "id" → "D001" format
    public function getIdAttribute(): string
    {
        return 'D' . str_pad((string) $this->donor_id, 3, '0', STR_PAD_LEFT);
    }

    // Frontend uses single "name" field
    public function getNameAttribute(): string
    {
        $parts = array_filter([$this->first_name, $this->middle_name ? substr($this->middle_name, 0, 1) . '.' : null, $this->last_name]);
        return implode(' ', $parts);
    }

    public function getPhoneAttribute(): string       { return $this->contact_number ?? ''; }
    public function getDobAttribute(): string         { return $this->birth_date ?? ''; }
    public function getBloodTypeAttribute(): string   { return $this->attributes['blood_type'] ?? ''; }
    public function getStatusAttribute(): string      { return $this->donor_status ?? 'New'; }
    public function getCivilStatusAttribute(): string { return $this->attributes['civil_status'] ?? ''; }
    public function getDonationDateAttribute(): string { return $this->registration_date ?? ''; }
    public function getLastDonationAttribute(): string { return $this->last_donation_date ?? ''; }
    public function getTotalDonationsAttribute(): int  { return $this->attributes['total_donations'] ?? 0; }
}
