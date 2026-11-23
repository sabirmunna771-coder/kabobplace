<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSettings;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Deal;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use App\Support\SettingsDefaults;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function __construct(
        private readonly ApiSerializer $serializer,
        private readonly OrderService $orders,
    ) {}

    public function settings(): JsonResponse
    {
        $settings = AppSettings::first();
        if (! $settings) {
            $settings = AppSettings::create(SettingsDefaults::defaultAttributes());
        }

        return response()->json([
            'data' => $this->serializer->settings($settings, false),
        ]);
    }

    public function branches(): JsonResponse
    {
        $branches = Branch::where('status', 'ACTIVE')
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get();

        return response()->json([
            'branches' => $branches->map(fn (Branch $b) => $this->serializer->branch($b))->values()->all(),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::orderBy('id')->get();

        return response()->json([
            'categories' => $categories->map(fn (Category $c) => $this->serializer->category($c))->values()->all(),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'featured' => ['nullable', 'in:true,false'],
        ]);

        $query = Product::with(['category', 'modifiers' => fn ($q) => $q->where('is_active', true)])
            ->where('is_active', true)
            ->where('is_in_stock', true);

        if (! empty($validated['category'])) {
            $categorySlug = trim($validated['category']);
            $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
        }

        if (($validated['featured'] ?? null) === 'true') {
            $query->where('is_featured', true);
        }

        if (! empty($validated['search'])) {
            $search = strtolower(trim($validated['search']));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(COALESCE(description, \'\')) LIKE ?', ["%{$search}%"]);
            });
        }

        $products = $query->orderByDesc('is_featured')->orderBy('name')->get();

        return response()->json([
            'products' => $products->map(fn (Product $p) => $this->serializer->product($p))->values()->all(),
        ]);
    }

    public function deals(): JsonResponse
    {
        $deals = Deal::with('items.product')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->orderBy('name')
            ->get();

        return response()->json([
            'deals' => $deals->map(fn (Deal $d) => $this->serializer->deal($d))->values()->all(),
        ]);
    }

    public function showProduct(string $publicId): JsonResponse
    {
        $product = Product::with(['category', 'modifiers' => fn ($q) => $q->where('is_active', true)])
            ->where('public_id', trim($publicId))
            ->first();

        if (! $product || ! $product->is_active || ! $product->is_in_stock) {
            throw new ApiException(404, 'Product not found.');
        }

        return response()->json([
            'product' => $this->serializer->product($product),
        ]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customerName' => ['required', 'string', 'min:2', 'max:100'],
            'customerEmail' => ['nullable', 'string', 'email'],
            'customerPhone' => ['required', 'string', 'min:7', 'max:32'],
            'deliveryAddress' => ['required', 'string', 'min:5', 'max:300'],
            'notes' => ['nullable', 'string', 'max:500'],
            'couponCode' => ['nullable', 'string', 'min:3', 'max:40'],
            'orderType' => ['nullable', 'in:DELIVERY,PICKUP,DINE_IN,WALK_IN,TAKEAWAY'],
            'paymentMethod' => ['nullable', 'in:CASH,CARD,MOBILE_WALLET'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.publicId' => ['required', 'string', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        /** @var User|null $authUser */
        $authUser = $request->attributes->get('authUser');

        $order = $this->orders->createOrder([
            'customerName' => trim($data['customerName']),
            'customerEmail' => isset($data['customerEmail']) ? strtolower(trim($data['customerEmail'])) : ($authUser?->email ?? null),
            'customerPhone' => trim($data['customerPhone']),
            'deliveryAddress' => trim($data['deliveryAddress']),
            'notes' => isset($data['notes']) ? trim($data['notes']) : null,
            'couponCode' => $data['couponCode'] ?? null,
            'orderType' => $data['orderType'] ?? 'DELIVERY',
            'paymentMethod' => $data['paymentMethod'] ?? 'CASH',
            'items' => $data['items'],
            'customerId' => $authUser?->id,
            'source' => 'WEB',
        ]);

        return response()->json([
            'message' => 'Order created successfully.',
            'order' => $this->serializer->order($order),
        ], 201);
    }
}

