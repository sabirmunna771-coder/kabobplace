<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchIngredientStock extends Model
{
    protected $fillable = [
        'branch_id',
        'ingredient_id',
        'current_qty',
        'min_qty',
    ];

    protected function casts(): array
    {
        return [
            'current_qty' => 'decimal:3',
            'min_qty' => 'decimal:3',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}

