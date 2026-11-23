<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductRecipeItem;
use Illuminate\Support\Collection;

class InventoryService
{
    public function syncProductStockWithInventory(): void
    {
        $products = Product::with('recipeItems.ingredient')->get();

        foreach ($products as $product) {
            if ($product->recipeItems->isEmpty()) {
                continue;
            }

            $hasMissingCore = $product->recipeItems->contains(function (ProductRecipeItem $recipeItem): bool {
                $ingredient = $recipeItem->ingredient;
                if (! $ingredient) {
                    return false;
                }

                return $ingredient->is_core && (float) $ingredient->current_qty <= 0;
            });

            $nextInStock = ! $hasMissingCore;
            if ((bool) $product->is_in_stock !== $nextInStock) {
                $product->is_in_stock = $nextInStock;
                $product->save();
            }
        }
    }

    /**
     * @param  array<int, array{productId: int, quantity: int}>  $orderItems
     * @param  Collection<int, ProductRecipeItem>  $recipeItems
     * @return array<int, float>
     */
    public function computeIngredientUsage(array $orderItems, Collection $recipeItems): array
    {
        $usage = [];

        foreach ($orderItems as $orderItem) {
            foreach ($recipeItems as $recipeItem) {
                if ((int) $recipeItem->product_id !== (int) $orderItem['productId']) {
                    continue;
                }

                $ingredientId = (int) $recipeItem->ingredient_id;
                $required = (float) $recipeItem->quantity * (int) $orderItem['quantity'];
                $usage[$ingredientId] = ($usage[$ingredientId] ?? 0.0) + $required;
            }
        }

        return $usage;
    }
}

