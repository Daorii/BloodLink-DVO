<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'role_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'role_name',
    ];

    /**
     * Get the users that belong to this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
