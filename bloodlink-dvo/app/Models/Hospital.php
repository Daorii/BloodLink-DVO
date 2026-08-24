<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hospital extends Model
{
    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'hospital_id';

    /**
     * The attributes that are mass assignable.
     * Field names match the frontend exactly.
     */
    protected $fillable = [
        'name',
        'type',
        'contact',
        'phone',
        'email',
        'address',
        'registration_status',
        'registered_by',
    ];

    /**
     * The accessors to append to the model's array / JSON form.
     * These computed fields match what the frontend's initialHospitals use.
     */
    protected $appends = [
        'id',             // frontend uses "id", not "hospital_id"
        'registrationStatus', // frontend uses camelCase
    ];

    // ─── Relationships ───────────────────────────────────────────────────

    /**
     * The admin user who registered this hospital.
     */
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by', 'user_id');
    }

    /**
     * Users (Hospital Users) that belong to this hospital.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'hospital_id', 'hospital_id');
    }

    // ─── Accessors ───────────────────────────────────────────────────────

    /**
     * "id" accessor — frontend uses "id" (e.g. "HOSP-001"), not "hospital_id".
     */
    public function getIdAttribute(): string
    {
        return 'HOSP-' . str_pad((string) $this->hospital_id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * "registrationStatus" accessor — frontend uses camelCase.
     */
    public function getRegistrationStatusAttribute(): string
    {
        return $this->attributes['registration_status'] ?? 'Pending';
    }
}
