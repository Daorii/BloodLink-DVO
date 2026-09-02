<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DonorRecall extends Model
{
    protected $primaryKey = 'recall_id';

    protected $fillable = [
        'donor_id',
        'recall_date',
        'sms_status',
        'donor_response',
        'recall_reason',
        'processed_by',
    ];

    protected $casts = [
        'recall_date' => 'date',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class, 'donor_id', 'donor_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
    }
}
