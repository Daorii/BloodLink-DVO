<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloodInventory extends Model
{
    protected $table      = 'blood_inventory';
    protected $primaryKey = 'unit_id';

    protected $fillable = [
        'donation_id', 'unit_code', 'blood_type', 'component',
        'volume_cc', 'collection_date', 'expiration_date',
        'safety_status', 'intended_use', 'inventory_status', 'recorded_by',
    ];

    public function donation() { return $this->belongsTo(Donation::class, 'donation_id', 'donation_id'); }
    public function recorder() { return $this->belongsTo(User::class,     'recorded_by', 'user_id'); }
}
