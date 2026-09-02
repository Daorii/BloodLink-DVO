<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodIssuanceItem extends Model
{
    protected $primaryKey = 'issuance_item_id';

    protected $fillable = [
        'issuance_id',
        'blood_type',
        'component',
        'quantity_issued',
    ];

    public function issuance(): BelongsTo
    {
        return $this->belongsTo(BloodIssuance::class, 'issuance_id', 'issuance_id');
    }
}
