<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'phone',
        'email',
        'notes',
    ];

    public function supplies(): HasMany
    {
        return $this->hasMany(VendorSupply::class, 'vendor_id');
    }

    public function restockLogs(): HasMany
    {
        return $this->hasMany(InventoryRestockLog::class, 'vendor_id');
    }
}

