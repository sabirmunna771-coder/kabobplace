<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'public_id',
        'slug',
        'name',
        'description',
        'price',
        'image_url',
        'badge',
        'badges',
        'is_featured',
        'is_active',
        'is_in_stock',
        'is_spicy',
        'is_vegetarian',
        'best_seller',
        'category_id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'badges' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'is_in_stock' => 'boolean',
            'is_spicy' => 'boolean',
            'is_vegetarian' => 'boolean',
            'best_seller' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(ProductModifier::class, 'product_id');
    }

    public function dealItems(): HasMany
    {
        return $this->hasMany(DealItem::class, 'product_id');
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(ProductRecipeItem::class, 'product_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'product_id');
    }
}

