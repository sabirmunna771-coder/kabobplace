<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'profile_picture_url',
        'password_hash',
        'role',
        'snow_points',
        'total_spent',
        'default_address_id',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'snow_points' => 'integer',
            'total_spent' => 'decimal:2',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function handledOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'handled_by_id');
    }

    public function statusChanges(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'changed_by_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class, 'user_id');
    }

    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffMember::class, 'user_id');
    }
}
