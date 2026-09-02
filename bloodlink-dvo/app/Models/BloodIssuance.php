<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BloodIssuance extends Model
{
    protected $primaryKey = 'issuance_id';

    protected $fillable = [
        'request_id',
        'processed_by',
        'issuance_date',
        'release_approved_by',
        'release_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'issuance_date' => 'datetime',
        'release_date'  => 'datetime',
    ];

    public function bloodRequest(): BelongsTo
    {
        return $this->belongsTo(BloodRequest::class, 'request_id', 'request_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
    }

    public function releaseApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'release_approved_by', 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BloodIssuanceItem::class, 'issuance_id', 'issuance_id');
    }
}
