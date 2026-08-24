<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'user_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'hospital_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'contact_number',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array / JSON form.
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
        'role',
        'role_id_label',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // ─── Relationships ──────────────────────────────────────────────────

    /**
     * Get the role that this user belongs to.
     */
    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    // ─── Accessors ──────────────────────────────────────────────────────

    /**
     * Computed "name" field matching the frontend format: "FirstName LastName"
     */
    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Computed "role" field — returns the human-readable role name.
     * e.g. "Registry Staff", "Administrator", etc.
     */
    public function getRoleAttribute(): ?string
    {
        return $this->roleRelation?->role_name;
    }

    /**
     * Computed "role_id_label" — returns the frontend-style label like "ROLE-003".
     */
    public function getRoleIdLabelAttribute(): string
    {
        return 'ROLE-' . str_pad((string) $this->role_id, 3, '0', STR_PAD_LEFT);
    }
}
