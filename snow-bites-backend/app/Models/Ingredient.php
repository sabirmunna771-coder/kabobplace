<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'unit',
        'current_qty',
        'min_qty',
        'is_core',
    ];

    protected function casts(): array
    {
        return [
            'current_qty' => 'decimal:3',
            'min_qty' => 'decimal:3',
            'is_core' => 'boolean',
        ];
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(ProductRecipeItem::class, 'ingredient_id');
    }

    public function vendorItems(): HasMany
    {
        return $this->hasMany(VendorSupply::class, 'ingredient_id');
    }

    public function restockLogs(): HasMany
    {
        return $this->hasMany(InventoryRestockLog::class, 'ingredient_id');
    }

    public function wasteLogs(): HasMany
    {
        return $this->hasMany(InventoryWasteLog::class, 'ingredient_id');
    }

    public function branchStocks(): HasMany
    {
        return $this->hasMany(BranchIngredientStock::class, 'ingredient_id');
    }
}

