<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalkinIssuance extends Model
{
    protected $primaryKey = 'walkin_issuance_id';

    protected $fillable = [
        'patient_name',
        'patient_age',
        'patient_gender',
        'diagnosis',
        'attending_physician',
        'purpose',
        'issued_by',
        'issuance_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'issuance_date' => 'datetime',
        'patient_age'   => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function issuedByUser()
    {
        return $this->belongsTo(User::class, 'issued_by', 'user_id');
    }

    public function items()
    {
        return $this->hasMany(WalkinIssuanceItem::class, 'walkin_issuance_id', 'walkin_issuance_id');
    }
}
