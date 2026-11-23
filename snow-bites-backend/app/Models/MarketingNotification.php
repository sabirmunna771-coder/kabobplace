<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingNotification extends Model
{
    protected $fillable = [
        'title',
        'message',
        'kind',
        'cta_label',
        'cta_href',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }
}

