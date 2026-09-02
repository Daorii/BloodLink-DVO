<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BloodRequest extends Model
{
    protected $primaryKey = 'request_id';

    protected $fillable = [
        'hospital_id',
        'requested_by_user_id',
        'urgency_level',
        'date_needed',
        'date_submitted',
        'requesting_personnel',
        'hospital_ref_no',
        'ward',
        'diagnosis',
        'request_status',
        'processed_by',
        'remarks',
        'filed_by_issuance',
    ];

    protected $casts = [
        'date_needed'      => 'date',
        'date_submitted'   => 'datetime',
        'filed_by_issuance' => 'boolean',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class, 'hospital_id', 'hospital_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id', 'user_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BloodRequestItem::class, 'request_id', 'request_id');
    }
}
