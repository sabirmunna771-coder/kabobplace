<?php

namespace App\Support;

use App\Models\Category;
use App\Models\Deal;
use App\Models\DealItem;
use App\Models\Product;
use App\Models\ProductModifier;
use App\Models\ProductRecipeItem;
use Illuminate\Support\Facades\DB;

class MenuSeeder
{
    /**
     * Ensure the 6 Kabob Place categories exist and clear any dummy menu items.
     * All products and deals are added dynamically by the administrator via the Admin Panel.
     */
    public static function seedNocheMenu(): array
    {
        return DB::transaction(function () {
            DealItem::query()->delete();
            Deal::query()->delete();
            ProductRecipeItem::query()->delete();
            ProductModifier::query()->delete();
            Product::query()->delete();

            $categoriesSpec = [
                ['slug' => 'broaster', 'name' => 'Broaster', 'icon' => '🍗'],
                ['slug' => 'shawarma', 'name' => 'Shawarma', 'icon' => '🌯'],
                ['slug' => 'burgers', 'name' => 'Burgers', 'icon' => '🍔'],
                ['slug' => 'grills-pakistani', 'name' => "Grill's Pakistani", 'icon' => '🔥'],
                ['slug' => 'pizzas', 'name' => 'Pizzas', 'icon' => '🍕'],
                ['slug' => 'agregados', 'name' => 'Agregados', 'icon' => '🍟'],
            ];

            foreach ($categoriesSpec as $spec) {
                Category::firstOrCreate(['slug' => $spec['slug']], $spec);
            }

            return [
                'categories' => Category::count(),
                'products' => Product::count(),
                'deals' => Deal::count(),
            ];
        });
    }
}
