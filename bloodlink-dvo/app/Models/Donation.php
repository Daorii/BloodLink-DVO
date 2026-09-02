<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    protected $primaryKey = 'donation_id';

    protected $fillable = [
        'donor_id', 'event_id', 'donation_date',
        'screening_outcome', 'deferral_reason', 'deferral_end_date', 'recorded_by',
    ];

    public function donor()    { return $this->belongsTo(Donor::class, 'donor_id', 'donor_id'); }
    public function event()    { return $this->belongsTo(DonationEvent::class, 'event_id', 'event_id'); }
    public function labResult(){ return $this->hasOne(LabTestResult::class, 'donation_id', 'donation_id'); }
}
