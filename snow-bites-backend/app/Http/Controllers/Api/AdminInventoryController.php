<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\InventoryRestockLog;
use App\Models\InventoryWasteLog;
use App\Models\Product;
use App\Models\ProductRecipeItem;
use App\Models\Vendor;
use App\Models\VendorSupply;
use App\Services\InventoryService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminInventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly ApiSerializer $serializer,
    ) {}

    public function listIngredients(): JsonResponse
    {
        $ingredients = Ingredient::orderBy('name')->get();

        return response()->json([
            'ingredients' => $ingredients->map(fn (Ingredient $i) => $this->serializer->ingredient($i))->values()->all(),
        ]);
    }

    public function createIngredient(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'slug' => ['required', 'string', 'min:2', 'max:120', 'regex:/^[a-z0-9-]+$/'],
            'unit' => ['required', 'in:KG,LITER,PIECE,CRATE,PACK'],
            'currentQty' => ['required', 'numeric', 'min:0'],
            'minQty' => ['required', 'numeric', 'min:0'],
            'isCore' => ['nullable', 'boolean'],
        ]);

        if (Ingredient::where('slug', $data['slug'])->exists()) {
            throw new ApiException(409, 'Ingredient slug already exists.');
        }

        $ingredient = Ingredient::create([
            'name' => trim($data['name']),
            'slug' => trim($data['slug']),
            'unit' => $data['unit'],
            'current_qty' => round((float) $data['currentQty'], 3),
            'min_qty' => round((float) $data['minQty'], 3),
            'is_core' => $data['isCore'] ?? true,
        ]);

        $this->inventory->syncProductStockWithInventory();

        return response()->json([
            'message' => 'Ingredient created successfully.',
            'ingredient' => $this->serializer->ingredient($ingredient),
        ], 201);
    }

    public function updateIngredient(Request $request, int $id): JsonResponse
    {
        $ingredient = Ingredient::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'slug' => ['sometimes', 'string', 'min:2', 'max:120', 'regex:/^[a-z0-9-]+$/'],
            'unit' => ['sometimes', 'in:KG,LITER,PIECE,CRATE,PACK'],
            'currentQty' => ['sometimes', 'numeric', 'min:0'],
            'minQty' => ['sometimes', 'numeric', 'min:0'],
            'isCore' => ['sometimes', 'boolean'],
        ]);

        $update = [];
        if (array_key_exists('name', $data)) {
            $update['name'] = trim($data['name']);
        }
        if (array_key_exists('slug', $data)) {
            $update['slug'] = trim($data['slug']);
        }
        if (array_key_exists('unit', $data)) {
            $update['unit'] = $data['unit'];
        }
        if (array_key_exists('currentQty', $data)) {
            $update['current_qty'] = round((float) $data['currentQty'], 3);
        }
        if (array_key_exists('minQty', $data)) {
            $update['min_qty'] = round((float) $data['minQty'], 3);
        }
        if (array_key_exists('isCore', $data)) {
            $update['is_core'] = (bool) $data['isCore'];
        }

        if ($update === []) {
            throw new ApiException(400, 'At least one field is required.');
        }

        $ingredient->update($update);
        $this->inventory->syncProductStockWithInventory();

        return response()->json([
            'message' => 'Ingredient updated successfully.',
            'ingredient' => $this->serializer->ingredient($ingredient->fresh()),
        ]);
    }

    public function quickAddStock(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unitCost' => ['required', 'numeric', 'min:0'],
            'vendorId' => ['nullable', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        $ingredient = DB::transaction(function () use ($id, $data): Ingredient {
            $existing = Ingredient::findOrFail($id);
            if (! empty($data['vendorId'])) {
                Vendor::findOrFail((int) $data['vendorId']);
            }

            $qty = round((float) $data['quantity'], 3);
            $unitCost = round((float) $data['unitCost'], 2);
            $totalCost = round($qty * $unitCost, 2);

            $existing->update([
                'current_qty' => round((float) $existing->current_qty + $qty, 3),
            ]);

            InventoryRestockLog::create([
                'ingredient_id' => $id,
                'vendor_id' => $data['vendorId'] ?? null,
                'quantity' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ]);

            $this->inventory->syncProductStockWithInventory();

            return $existing->fresh();
        });

        return response()->json([
            'message' => 'Stock added successfully.',
            'ingredient' => $this->serializer->ingredient($ingredient),
        ]);
    }

    public function createWasteLog(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        $ingredient = DB::transaction(function () use ($id, $data): Ingredient {
            $existing = Ingredient::findOrFail($id);
            $qty = round((float) $data['quantity'], 3);
            $nextQty = round((float) $existing->current_qty - $qty, 3);

            if ($nextQty < 0) {
                throw new ApiException(400, 'Waste quantity exceeds current stock.');
            }

            $existing->update(['current_qty' => $nextQty]);

            InventoryWasteLog::create([
                'ingredient_id' => $id,
                'quantity' => $qty,
                'reason' => $data['reason'] ?? null,
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ]);

            $this->inventory->syncProductStockWithInventory();

            return $existing->fresh();
        });

        return response()->json([
            'message' => 'Waste recorded successfully.',
            'ingredient' => $this->serializer->ingredient($ingredient),
        ]);
    }

    public function listRecipeLinks(): JsonResponse
    {
        $links = ProductRecipeItem::with(['product', 'ingredient'])->get()
            ->sortBy(fn (ProductRecipeItem $item) => ($item->product?->name ?? '').'|'.($item->ingredient?->name ?? ''));

        return response()->json([
            'recipeLinks' => $links->map(fn (ProductRecipeItem $r) => $this->serializer->recipeItem($r))->values()->all(),
        ]);
    }

    public function upsertRecipeLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'productId' => ['required', 'integer', 'min:1'],
            'ingredientId' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        Product::findOrFail((int) $data['productId']);
        Ingredient::findOrFail((int) $data['ingredientId']);

        $link = ProductRecipeItem::updateOrCreate(
            [
                'product_id' => (int) $data['productId'],
                'ingredient_id' => (int) $data['ingredientId'],
            ],
            [
                'quantity' => round((float) $data['quantity'], 3),
            ],
        );

        $this->inventory->syncProductStockWithInventory();

        return response()->json([
            'message' => 'Recipe link saved successfully.',
            'recipeLink' => $this->serializer->recipeItem($link->load(['product', 'ingredient'])),
        ]);
    }

    public function deleteRecipeLink(int $id): JsonResponse
    {
        ProductRecipeItem::findOrFail($id)->delete();
        $this->inventory->syncProductStockWithInventory();

        return response()->json([
            'message' => 'Recipe link removed successfully.',
        ]);
    }

    public function listVendors(): JsonResponse
    {
        $vendors = Vendor::with('supplies.ingredient')->orderBy('name')->get();

        return response()->json([
            'vendors' => $vendors->map(fn (Vendor $v) => $this->serializer->vendor($v))->values()->all(),
        ]);
    }

    public function createVendor(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'contactName' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'string', 'email'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $vendor = Vendor::create([
            'name' => trim($data['name']),
            'contact_name' => $data['contactName'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Vendor created successfully.',
            'vendor' => $this->serializer->vendor($vendor->load('supplies.ingredient')),
        ], 201);
    }

    public function updateVendor(Request $request, int $id): JsonResponse
    {
        $vendor = Vendor::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'contactName' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'string', 'email'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $update = [];
        if (array_key_exists('name', $data)) {
            $update['name'] = trim($data['name']);
        }
        if (array_key_exists('contactName', $data)) {
            $update['contact_name'] = $data['contactName'];
        }
        if (array_key_exists('phone', $data)) {
            $update['phone'] = $data['phone'];
        }
        if (array_key_exists('email', $data)) {
            $update['email'] = $data['email'];
        }
        if (array_key_exists('notes', $data)) {
            $update['notes'] = $data['notes'];
        }

        if ($update === []) {
            throw new ApiException(400, 'At least one field is required.');
        }

        $vendor->update($update);

        return response()->json([
            'message' => 'Vendor updated successfully.',
            'vendor' => $this->serializer->vendor($vendor->fresh('supplies.ingredient')),
        ]);
    }

    public function addVendorSupply(Request $request, int $id): JsonResponse
    {
        Vendor::findOrFail($id);
        $data = $request->validate([
            'ingredientId' => ['required', 'integer', 'min:1'],
            'itemName' => ['nullable', 'string', 'max:120'],
        ]);

        Ingredient::findOrFail((int) $data['ingredientId']);

        $supply = VendorSupply::updateOrCreate(
            [
                'vendor_id' => $id,
                'ingredient_id' => (int) $data['ingredientId'],
            ],
            [
                'item_name' => $data['itemName'] ?? null,
            ],
        )->load('ingredient');

        return response()->json([
            'message' => 'Vendor supply item saved successfully.',
            'supply' => [
                'id' => $supply->id,
                'ingredientId' => $supply->ingredient_id,
                'ingredientName' => $supply->ingredient?->name ?? '',
                'itemName' => $supply->item_name,
                'createdAt' => $supply->created_at?->toISOString(),
                'updatedAt' => $supply->updated_at?->toISOString(),
            ],
        ]);
    }

    public function deleteVendorSupply(int $id): JsonResponse
    {
        VendorSupply::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Vendor supply removed successfully.',
        ]);
    }

    public function listRestockLogs(): JsonResponse
    {
        $logs = InventoryRestockLog::with(['ingredient', 'vendor'])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json([
            'restockLogs' => $logs->map(fn (InventoryRestockLog $l) => $this->serializer->restockLog($l))->values()->all(),
        ]);
    }

    public function listWasteLogs(): JsonResponse
    {
        $logs = InventoryWasteLog::with('ingredient')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json([
            'wasteLogs' => $logs->map(fn (InventoryWasteLog $l) => $this->serializer->wasteLog($l))->values()->all(),
        ]);
    }
}

