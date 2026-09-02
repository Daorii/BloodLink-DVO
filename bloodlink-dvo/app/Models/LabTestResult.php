<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabTestResult extends Model
{
    protected $primaryKey = 'test_id';

    protected $fillable = [
        'donation_id',
        'hemoglobin_result',
        'blood_type_confirmed',
        'hbsag_result',
        'syphilis_result',
        'hiv_result',
        'hcv_result',
        'malaria_result',
        'nat_result',
        'others_result',
        'recorded_by',
    ];

    public function donation()
    {
        return $this->belongsTo(Donation::class, 'donation_id', 'donation_id');
    }
}
