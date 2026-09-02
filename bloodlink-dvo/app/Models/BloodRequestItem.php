<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodRequestItem extends Model
{
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'request_id',
        'blood_type',
        'component',
        'quantity_requested',
    ];

    public function bloodRequest(): BelongsTo
    {
        return $this->belongsTo(BloodRequest::class, 'request_id', 'request_id');
    }
}
