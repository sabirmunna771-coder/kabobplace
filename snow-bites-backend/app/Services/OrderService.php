<?php

namespace App\Services;

use App\Models\AppSettings;
use App\Models\Coupon;
use App\Models\FlashSale;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductRecipeItem;
use App\Models\User;
use App\Support\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly MarketingService $marketing,
    ) {}

    public function generateOrderNumber(): string
    {
        $stamp = now()->format('YmdHis');
        $suffix = Str::upper(Str::random(4));

        return "KP-{$stamp}-{$suffix}";
    }

    public function createOrder(array $input): Order
    {
        $source = $input['source'] ?? 'WEB';
        $orderType = $input['orderType'] ?? 'DELIVERY';
        $settings = AppSettings::first();

        if ($source === 'WEB' && $settings) {
            if ($settings->maintenance_mode) {
                throw new ApiException(503, 'The store is currently undergoing maintenance. Please try again later.');
            }
            if (strtoupper((string) $settings->store_status) === 'CLOSED') {
                throw new ApiException(400, 'Store is currently closed for online orders.');
            }
        }

        $requestedItems = $input['items'] ?? [];
        $uniquePublicIds = array_values(array_unique(array_map(
            fn (array $item): string => (string) $item['publicId'],
            $requestedItems,
        )));

        $products = Product::whereIn('public_id', $uniquePublicIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('public_id');

        if ($products->count() !== count($uniquePublicIds)) {
            throw new ApiException(400, 'One or more products are invalid or inactive.');
        }

        $orderItemsPayload = [];
        $subtotal = 0.0;
        $usageItems = [];

        foreach ($requestedItems as $item) {
            /** @var Product|null $product */
            $product = $products->get($item['publicId']);
            if (! $product) {
                throw new ApiException(400, "Product {$item['publicId']} was not found.");
            }

            $price = (float) $product->price;
            $qty = (int) $item['quantity'];
            $lineTotal = round($price * $qty, 2);
            $subtotal = round($subtotal + $lineTotal, 2);

            $orderItemsPayload[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_price' => $price,
                'quantity' => $qty,
                'line_total' => $lineTotal,
            ];

            $usageItems[] = [
                'productId' => $product->id,
                'quantity' => $qty,
            ];
        }

        $productIds = array_values(array_unique(array_column($orderItemsPayload, 'product_id')));
        $recipeItems = ProductRecipeItem::with('ingredient')
            ->whereIn('product_id', $productIds)
            ->get();

        $usage = $this->inventory->computeIngredientUsage($usageItems, $recipeItems);

        $normalizedCouponCode = isset($input['couponCode']) && trim((string) $input['couponCode']) !== ''
            ? strtoupper(trim((string) $input['couponCode']))
            : null;

        $coupon = $normalizedCouponCode
            ? Coupon::where('code', $normalizedCouponCode)->first()
            : null;

        if ($normalizedCouponCode !== null) {
            if (! $coupon || ! $this->marketing->isCouponCurrentlyValid($coupon)) {
                throw new ApiException(400, 'Coupon code is invalid or expired.');
            }

            if ($subtotal < (float) $coupon->min_order_value) {
                $currency = $settings?->currency_symbol ?: '$';
                throw new ApiException(
                    400,
                    sprintf('Coupon requires a minimum order of %s %.2f.', $currency, (float) $coupon->min_order_value),
                );
            }
        }

        $couponDiscount = $coupon
            ? $this->marketing->calculateDiscountAmount($coupon->discount_type, (float) $coupon->discount_value, $subtotal)
            : 0.0;

        $flashSale = FlashSale::where('is_active', true)->orderByDesc('created_at')->first();
        $liveFlashSale = ($flashSale && $this->marketing->isFlashSaleLive($flashSale)) ? $flashSale : null;
        $flashSaleDiscount = $liveFlashSale
            ? $this->marketing->calculateDiscountAmount($liveFlashSale->discount_type, (float) $liveFlashSale->discount_value, $subtotal)
            : 0.0;

        $totalDiscount = round(min($subtotal, $couponDiscount + $flashSaleDiscount), 2);

        $taxAmount = 0.0;
        $deliveryFee = 0.0;

        if ($source === 'WEB' && $settings) {
            $taxRate = max(0.0, (float) $settings->tax_percentage);
            $taxAmount = round(($subtotal * $taxRate) / 100, 2);

            if (strtoupper($orderType) === 'DELIVERY') {
                $deliveryFee = round(max(0.0, (float) $settings->delivery_flat_fee), 2);
            }
        }

        $total = round(max(0.0, $subtotal + $taxAmount + $deliveryFee - $totalDiscount), 2);

        $discountParts = array_filter([
            $liveFlashSale ? $liveFlashSale->name : null,
            $coupon ? "Coupon {$coupon->code}" : null,
        ]);
        $discountLabel = $discountParts !== [] ? implode(' + ', $discountParts) : null;

        return DB::transaction(function () use (
            $usage,
            $input,
            $subtotal,
            $totalDiscount,
            $taxAmount,
            $deliveryFee,
            $total,
            $coupon,
            $discountLabel,
            $source,
            $orderType,
            $orderItemsPayload
        ): Order {
            foreach ($usage as $ingredientId => $requiredQty) {
                $ingredient = Ingredient::find($ingredientId);
                if (! $ingredient) {
                    throw new ApiException(400, 'Order cannot be processed due to missing ingredient setup.');
                }

                $currentQty = (float) $ingredient->current_qty;
                if ($currentQty < $requiredQty) {
                    throw new ApiException(400, "Insufficient inventory for {$ingredient->name}.");
                }

                $ingredient->current_qty = round($currentQty - $requiredQty, 3);
                $ingredient->save();
            }

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'status' => 'PENDING',
                'customer_name' => $input['customerName'],
                'customer_email' => $input['customerEmail'] ?? null,
                'customer_phone' => $input['customerPhone'],
                'delivery_address' => $input['deliveryAddress'],
                'notes' => $input['notes'] ?? null,
                'subtotal' => $subtotal,
                'discount_amount' => $totalDiscount,
                'tax_amount' => $taxAmount,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'discount_label' => $discountLabel,
                'source' => $source,
                'order_type' => $orderType,
                'table_number' => $input['tableNumber'] ?? null,
                'payment_method' => $input['paymentMethod'] ?? 'CASH',
                'customer_id' => $input['customerId'] ?? null,
                'handled_by_id' => $input['handledById'] ?? null,
            ]);

            foreach ($orderItemsPayload as $itemPayload) {
                OrderItem::create([
                    'order_id' => $order->id,
                    ...$itemPayload,
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => 'PENDING',
                'changed_by_id' => $input['handledById'] ?? null,
                'note' => 'Order created',
                'changed_at' => now(),
            ]);

            if ($coupon) {
                $coupon->increment('usage_count');
            }

            if (! empty($input['customerId'])) {
                $customer = User::find((int) $input['customerId']);
                if ($customer) {
                    $earnedPoints = max(10, (int) floor($total / 100));
                    $customer->increment('snow_points', $earnedPoints);
                }
            }

            $this->inventory->syncProductStockWithInventory();

            return $order->load(['items', 'assignedRider', 'statusHistory.changedBy']);
        });
    }
}

