<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(private readonly ApiSerializer $serializer) {}

    public function dashboardStats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $totalOrders = Order::where('customer_id', $user->id)->count();
        $totalSpent = Order::where('customer_id', $user->id)
            ->where('status', 'COMPLETED')
            ->sum('total');

        return response()->json([
            'data' => [
                'fullName' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'snowPoints' => (int) ($user->snow_points ?? 0),
                'totalOrders' => $totalOrders,
                'totalSpent' => (float) $totalSpent,
            ],
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $orders = Order::with(['items.product'])
            ->where('customer_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $orders->map(fn (Order $order) => $this->serializer->order($order))->values()->all(),
        ]);
    }

    public function currentOrder(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $order = Order::with(['items.product', 'statusHistory' => fn ($q) => $q->orderByDesc('changed_at')])
            ->where('customer_id', $user->id)
            ->whereIn('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'])
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'data' => $order ? $this->serializer->order($order) : null,
        ]);
    }

    public function orderDetails(Request $request, int $orderId): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $order = Order::with(['items.product', 'statusHistory' => fn ($q) => $q->orderByDesc('changed_at')])
            ->find($orderId);

        if (! $order) {
            throw new ApiException(404, 'Order not found');
        }

        if ((int) $order->customer_id !== $user->id) {
            throw new ApiException(403, "You don't have access to this order");
        }

        return response()->json([
            'data' => $this->serializer->order($order),
        ]);
    }

    public function reorder(Request $request, int $orderId): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $order = Order::with('items.product')->find($orderId);
        if (! $order || (int) $order->customer_id !== $user->id) {
            throw new ApiException(403, "You don't have access to this order");
        }

        return response()->json([
            'data' => [
                'orderNumber' => $order->order_number,
                'items' => $order->items->map(fn (OrderItem $item) => [
                    'productId' => $item->product_id,
                    'publicId' => $item->product?->public_id,
                    'name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->product_price,
                ])->values()->all(),
            ],
        ]);
    }

    public function addresses(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $addresses = Address::where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $addresses->map(fn (Address $a) => $this->serializer->address($a))->values()->all(),
        ]);
    }

    public function createAddress(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $data = $request->validate([
            'label' => ['required', 'string', 'min:1', 'max:50'],
            'street' => ['required', 'string', 'min:3', 'max:200'],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'state' => ['required', 'string', 'min:2', 'max:100'],
            'postalCode' => ['required', 'string', 'min:3', 'max:20'],
            'country' => ['nullable', 'string', 'min:2', 'max:100'],
            'isDefault' => ['nullable', 'boolean'],
        ]);

        $isDefault = (bool) ($data['isDefault'] ?? false);
        if ($isDefault) {
            Address::where('user_id', $user->id)->where('is_default', true)->update(['is_default' => false]);
        }

        $address = Address::create([
            'user_id' => $user->id,
            'label' => trim($data['label']),
            'street' => trim($data['street']),
            'city' => trim($data['city']),
            'state' => trim($data['state']),
            'postal_code' => trim($data['postalCode']),
            'country' => trim($data['country'] ?? 'Chile'),
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'message' => 'Address created successfully',
            'data' => $this->serializer->address($address),
        ], 201);
    }

    public function updateAddress(Request $request, int $addressId): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $address = Address::find($addressId);
        if (! $address || (int) $address->user_id !== $user->id) {
            throw new ApiException(403, "You don't have access to this address");
        }

        $data = $request->validate([
            'label' => ['required', 'string', 'min:1', 'max:50'],
            'street' => ['required', 'string', 'min:3', 'max:200'],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'state' => ['required', 'string', 'min:2', 'max:100'],
            'postalCode' => ['required', 'string', 'min:3', 'max:20'],
            'country' => ['nullable', 'string', 'min:2', 'max:100'],
            'isDefault' => ['nullable', 'boolean'],
        ]);

        $isDefault = (bool) ($data['isDefault'] ?? false);
        if ($isDefault) {
            Address::where('user_id', $user->id)
                ->where('is_default', true)
                ->where('id', '!=', $addressId)
                ->update(['is_default' => false]);
        }

        $address->update([
            'label' => trim($data['label']),
            'street' => trim($data['street']),
            'city' => trim($data['city']),
            'state' => trim($data['state']),
            'postal_code' => trim($data['postalCode']),
            'country' => trim($data['country'] ?? 'Chile'),
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'message' => 'Address updated successfully',
            'data' => $this->serializer->address($address->fresh()),
        ]);
    }

    public function deleteAddress(Request $request, int $addressId): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $address = Address::find($addressId);
        if (! $address || (int) $address->user_id !== $user->id) {
            throw new ApiException(403, "You don't have access to this address");
        }

        $address->delete();

        return response()->json([
            'message' => 'Address deleted successfully',
        ]);
    }
}

