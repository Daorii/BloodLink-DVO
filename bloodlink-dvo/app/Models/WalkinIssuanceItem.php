<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalkinIssuanceItem extends Model
{
    protected $primaryKey = 'walkin_item_id';

    protected $fillable = [
        'walkin_issuance_id',
        'unit_id',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function issuance()
    {
        return $this->belongsTo(WalkinIssuance::class, 'walkin_issuance_id', 'walkin_issuance_id');
    }

    public function bloodUnit()
    {
        return $this->belongsTo(BloodInventory::class, 'unit_id', 'unit_id');
    }
}
