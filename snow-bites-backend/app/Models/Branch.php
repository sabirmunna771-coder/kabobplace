<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'code',
        'name',
        'address',
        'phone',
        'status',
        'is_primary',
        'manager_staff_id',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'manager_staff_id');
    }

    public function staffMembers(): HasMany
    {
        return $this->hasMany(StaffMember::class, 'branch_id');
    }

    public function riders(): HasMany
    {
        return $this->hasMany(Rider::class, 'branch_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(BranchIngredientStock::class, 'branch_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(StaffActivityLog::class, 'branch_id');
    }
}

