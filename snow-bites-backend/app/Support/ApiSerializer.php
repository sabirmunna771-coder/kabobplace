<?php

namespace App\Support;

use App\Models\AnnouncementBar;
use App\Models\AppSettings;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Deal;
use App\Models\DealItem;
use App\Models\FlashSale;
use App\Models\HeroBanner;
use App\Models\Ingredient;
use App\Models\InventoryRestockLog;
use App\Models\InventoryWasteLog;
use App\Models\MarketingNotification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductModifier;
use App\Models\ProductRecipeItem;
use App\Models\Review;
use App\Models\Rider;
use App\Models\StaffActivityLog;
use App\Models\StaffMember;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorSupply;
use App\Services\MarketingService;
use App\Services\StaffAccessService;

class ApiSerializer
{
    public function __construct(
        private readonly MarketingService $marketing,
        private readonly StaffAccessService $staffAccess,
    ) {}

    public function user(User $user): array
    {
        return [
            'id' => $user->id,
            'fullName' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'profilePictureUrl' => $user->profile_picture_url,
            'snowPoints' => (int) ($user->snow_points ?? 0),
        ];
    }

    public function category(Category $category): array
    {
        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'name' => $category->name,
            'icon' => $category->icon,
            'createdAt' => $category->created_at?->toISOString(),
            'updatedAt' => $category->updated_at?->toISOString(),
        ];
    }

    public function product(Product $product): array
    {
        $badges = is_array($product->badges)
            ? array_values(array_filter($product->badges, fn ($b) => is_string($b) && $b !== ''))
            : ($product->badge ? [$product->badge] : []);

        $modifiers = $product->relationLoaded('modifiers')
            ? $product->modifiers->map(fn (ProductModifier $m) => $this->modifier($m))->values()->all()
            : [];

        return [
            'id' => $product->id,
            'publicId' => $product->public_id,
            'slug' => $product->slug,
            'name' => $product->name,
            'description' => $product->description,
            'price' => (float) $product->price,
            'imageUrl' => $product->image_url,
            'badge' => $product->badge,
            'badges' => $badges,
            'isFeatured' => (bool) $product->is_featured,
            'isActive' => (bool) $product->is_active,
            'isInStock' => (bool) $product->is_in_stock,
            'isSpicy' => (bool) $product->is_spicy,
            'isVegetarian' => (bool) $product->is_vegetarian,
            'bestSeller' => (bool) $product->best_seller,
            'modifiers' => $modifiers,
            'category' => $product->category ? $this->category($product->category) : null,
            'createdAt' => $product->created_at?->toISOString(),
            'updatedAt' => $product->updated_at?->toISOString(),
        ];
    }

    public function modifier(ProductModifier $modifier): array
    {
        return [
            'id' => $modifier->id,
            'productId' => $modifier->product_id,
            'name' => $modifier->name,
            'price' => (float) $modifier->price,
            'isActive' => (bool) $modifier->is_active,
            'createdAt' => $modifier->created_at?->toISOString(),
            'updatedAt' => $modifier->updated_at?->toISOString(),
        ];
    }

    public function deal(Deal $deal): array
    {
        $items = $deal->relationLoaded('items')
            ? $deal->items->map(fn (DealItem $item) => [
                'id' => $item->id,
                'dealId' => $item->deal_id,
                'productId' => $item->product_id,
                'quantity' => (int) $item->quantity,
                'productName' => $item->product?->name ?? '',
                'productPublicId' => $item->product?->public_id ?? '',
            ])->values()->all()
            : [];

        return [
            'id' => $deal->id,
            'publicId' => $deal->public_id,
            'slug' => $deal->slug,
            'name' => $deal->name,
            'description' => $deal->description,
            'imageUrl' => $deal->image_url,
            'price' => (float) $deal->price,
            'isActive' => (bool) $deal->is_active,
            'expiresAt' => $deal->expires_at?->toISOString(),
            'isExpired' => (bool) ($deal->expires_at && $deal->expires_at->isPast()),
            'createdAt' => $deal->created_at?->toISOString(),
            'updatedAt' => $deal->updated_at?->toISOString(),
            'items' => $items,
        ];
    }

    public function rider(Rider $rider): array
    {
        return [
            'id' => $rider->id,
            'fullName' => $rider->full_name,
            'phone' => $rider->phone,
            'vehicle' => $rider->vehicle,
            'profileImageUrl' => $rider->profile_image_url,
            'availability' => $rider->availability,
            'branchId' => $rider->branch_id,
            'createdAt' => $rider->created_at?->toISOString(),
            'updatedAt' => $rider->updated_at?->toISOString(),
        ];
    }

    public function orderItem(OrderItem $item): array
    {
        return [
            'id' => $item->id,
            'productId' => $item->product_id,
            'productName' => $item->product_name,
            'productPrice' => (float) $item->product_price,
            'quantity' => (int) $item->quantity,
            'lineTotal' => (float) $item->line_total,
        ];
    }

    public function orderStatusHistory(OrderStatusHistory $history): array
    {
        return [
            'id' => $history->id,
            'fromStatus' => $history->from_status,
            'toStatus' => $history->to_status,
            'note' => $history->note,
            'changedById' => $history->changed_by_id,
            'changedAt' => $history->changed_at?->toISOString(),
            'changedBy' => $history->relationLoaded('changedBy') && $history->changedBy
                ? [
                    'id' => $history->changedBy->id,
                    'fullName' => $history->changedBy->full_name,
                    'email' => $history->changedBy->email,
                ]
                : null,
        ];
    }

    public function order(Order $order): array
    {
        return [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'status' => $order->status,
            'customerName' => $order->customer_name,
            'customerEmail' => $order->customer_email,
            'customerPhone' => $order->customer_phone,
            'deliveryAddress' => $order->delivery_address,
            'notes' => $order->notes,
            'subtotal' => (float) $order->subtotal,
            'discountAmount' => (float) $order->discount_amount,
            'taxAmount' => (float) ($order->tax_amount ?? 0),
            'deliveryFee' => (float) ($order->delivery_fee ?? 0),
            'total' => (float) $order->total,
            'couponId' => $order->coupon_id,
            'couponCode' => $order->coupon_code,
            'discountLabel' => $order->discount_label,
            'source' => $order->source,
            'orderType' => $order->order_type,
            'tableNumber' => $order->table_number,
            'paymentMethod' => $order->payment_method,
            'customerId' => $order->customer_id,
            'handledById' => $order->handled_by_id,
            'assignedRiderId' => $order->assigned_rider_id,
            'createdAt' => $order->created_at?->toISOString(),
            'updatedAt' => $order->updated_at?->toISOString(),
            'items' => $order->relationLoaded('items')
                ? $order->items->map(fn (OrderItem $item) => $this->orderItem($item))->values()->all()
                : [],
            'assignedRider' => $order->relationLoaded('assignedRider') && $order->assignedRider
                ? $this->rider($order->assignedRider)
                : null,
            'statusHistory' => $order->relationLoaded('statusHistory')
                ? $order->statusHistory->map(fn (OrderStatusHistory $h) => $this->orderStatusHistory($h))->values()->all()
                : [],
        ];
    }

    public function coupon(Coupon $coupon): array
    {
        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'discountType' => $coupon->discount_type,
            'discountValue' => (float) $coupon->discount_value,
            'minOrderValue' => (float) $coupon->min_order_value,
            'expiresAt' => $coupon->expires_at?->toISOString(),
            'usageLimit' => $coupon->usage_limit !== null ? (int) $coupon->usage_limit : null,
            'usageCount' => (int) $coupon->usage_count,
            'isActive' => (bool) $coupon->is_active,
            'isValidNow' => $this->marketing->isCouponCurrentlyValid($coupon),
            'createdAt' => $coupon->created_at?->toISOString(),
            'updatedAt' => $coupon->updated_at?->toISOString(),
        ];
    }

    public function flashSale(FlashSale $flashSale): array
    {
        return [
            'id' => $flashSale->id,
            'name' => $flashSale->name,
            'discountType' => $flashSale->discount_type,
            'discountValue' => (float) $flashSale->discount_value,
            'startsAt' => $flashSale->starts_at?->toISOString(),
            'endsAt' => $flashSale->ends_at?->toISOString(),
            'isActive' => (bool) $flashSale->is_active,
            'isLive' => $this->marketing->isFlashSaleLive($flashSale),
            'createdAt' => $flashSale->created_at?->toISOString(),
            'updatedAt' => $flashSale->updated_at?->toISOString(),
        ];
    }

    public function marketingNotification(MarketingNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'kind' => $notification->kind,
            'ctaLabel' => $notification->cta_label,
            'ctaHref' => $notification->cta_href,
            'isActive' => (bool) $notification->is_active,
            'expiresAt' => $notification->expires_at?->toISOString(),
            'createdAt' => $notification->created_at?->toISOString(),
            'updatedAt' => $notification->updated_at?->toISOString(),
        ];
    }

    public function review(Review $review): array
    {
        return [
            'id' => $review->id,
            'userId' => $review->user_id,
            'customerName' => $review->customer_name,
            'customerEmail' => $review->customer_email,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'status' => $review->status,
            'createdAt' => $review->created_at?->toISOString(),
            'updatedAt' => $review->updated_at?->toISOString(),
            'user' => $review->relationLoaded('user') && $review->user
                ? [
                    'id' => $review->user->id,
                    'fullName' => $review->user->full_name,
                    'email' => $review->user->email,
                ]
                : null,
        ];
    }

    public function heroBanner(HeroBanner $banner): array
    {
        return [
            'id' => $banner->id,
            'title' => $banner->title,
            'subtitle' => $banner->subtitle,
            'imageUrl' => $banner->image_url,
            'ctaLabel' => $banner->cta_label,
            'ctaHref' => $banner->cta_href,
            'isActive' => (bool) $banner->is_active,
            'sortOrder' => (int) $banner->sort_order,
            'createdAt' => $banner->created_at?->toISOString(),
            'updatedAt' => $banner->updated_at?->toISOString(),
        ];
    }

    public function announcementBar(AnnouncementBar $announcement): array
    {
        return [
            'id' => $announcement->id,
            'text' => $announcement->text,
            'ctaLabel' => $announcement->cta_label,
            'ctaHref' => $announcement->cta_href,
            'isActive' => (bool) $announcement->is_active,
            'createdAt' => $announcement->created_at?->toISOString(),
            'updatedAt' => $announcement->updated_at?->toISOString(),
        ];
    }

    public function customerProfile(User $user): array
    {
        $orders = $user->relationLoaded('orders') ? $user->orders : collect();
        $completedOrders = $orders->where('status', 'COMPLETED');
        $totalSpent = $completedOrders->sum(fn (Order $o) => (float) $o->total);
        $lastOrder = $orders->sortByDesc('created_at')->first();

        $daysInactive = $lastOrder?->created_at
            ? (int) floor($lastOrder->created_at->diffInDays(now()))
            : null;

        return [
            'id' => $user->id,
            'fullName' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'totalOrders' => $orders->count(),
            'completedOrders' => $completedOrders->count(),
            'totalSpent' => round((float) $totalSpent, 2),
            'loyaltyTag' => $this->marketing->getCustomerLoyaltyTag($completedOrders->count()),
            'lastOrderAt' => $lastOrder?->created_at?->toISOString(),
            'daysInactive' => $daysInactive,
            'createdAt' => $user->created_at?->toISOString(),
            'updatedAt' => $user->updated_at?->toISOString(),
        ];
    }

    public function ingredient(Ingredient $ingredient): array
    {
        $currentQty = (float) $ingredient->current_qty;
        $minQty = (float) $ingredient->min_qty;

        return [
            'id' => $ingredient->id,
            'name' => $ingredient->name,
            'slug' => $ingredient->slug,
            'unit' => $ingredient->unit,
            'currentQty' => $currentQty,
            'minQty' => $minQty,
            'isCore' => (bool) $ingredient->is_core,
            'isLowStock' => $currentQty <= $minQty,
            'createdAt' => $ingredient->created_at?->toISOString(),
            'updatedAt' => $ingredient->updated_at?->toISOString(),
        ];
    }

    public function recipeItem(ProductRecipeItem $recipeItem): array
    {
        return [
            'id' => $recipeItem->id,
            'productId' => $recipeItem->product_id,
            'productName' => $recipeItem->product?->name ?? '',
            'productPublicId' => $recipeItem->product?->public_id ?? '',
            'ingredientId' => $recipeItem->ingredient_id,
            'ingredientName' => $recipeItem->ingredient?->name ?? '',
            'ingredientUnit' => $recipeItem->ingredient?->unit ?? 'KG',
            'quantity' => (float) $recipeItem->quantity,
            'createdAt' => $recipeItem->created_at?->toISOString(),
            'updatedAt' => $recipeItem->updated_at?->toISOString(),
        ];
    }

    public function vendor(Vendor $vendor): array
    {
        $supplies = $vendor->relationLoaded('supplies')
            ? $vendor->supplies->map(fn (VendorSupply $s) => [
                'id' => $s->id,
                'ingredientId' => $s->ingredient_id,
                'ingredientName' => $s->ingredient?->name ?? '',
                'itemName' => $s->item_name,
                'createdAt' => $s->created_at?->toISOString(),
                'updatedAt' => $s->updated_at?->toISOString(),
            ])->values()->all()
            : [];

        return [
            'id' => $vendor->id,
            'name' => $vendor->name,
            'contactName' => $vendor->contact_name,
            'phone' => $vendor->phone,
            'email' => $vendor->email,
            'notes' => $vendor->notes,
            'createdAt' => $vendor->created_at?->toISOString(),
            'updatedAt' => $vendor->updated_at?->toISOString(),
            'supplies' => $supplies,
        ];
    }

    public function restockLog(InventoryRestockLog $log): array
    {
        return [
            'id' => $log->id,
            'ingredientId' => $log->ingredient_id,
            'ingredientName' => $log->ingredient?->name ?? '',
            'unit' => $log->ingredient?->unit ?? 'KG',
            'vendorId' => $log->vendor_id,
            'vendorName' => $log->vendor?->name,
            'quantity' => (float) $log->quantity,
            'unitCost' => (float) $log->unit_cost,
            'totalCost' => (float) $log->total_cost,
            'note' => $log->note,
            'createdAt' => $log->created_at?->toISOString(),
        ];
    }

    public function wasteLog(InventoryWasteLog $log): array
    {
        return [
            'id' => $log->id,
            'ingredientId' => $log->ingredient_id,
            'ingredientName' => $log->ingredient?->name ?? '',
            'unit' => $log->ingredient?->unit ?? 'KG',
            'quantity' => (float) $log->quantity,
            'reason' => $log->reason,
            'note' => $log->note,
            'createdAt' => $log->created_at?->toISOString(),
        ];
    }

    public function branch(Branch $branch): array
    {
        $payload = [
            'id' => $branch->id,
            'code' => $branch->code,
            'name' => $branch->name,
            'address' => $branch->address,
            'phone' => $branch->phone,
            'status' => $branch->status,
            'isPrimary' => (bool) $branch->is_primary,
            'managerStaffId' => $branch->manager_staff_id,
            'manager' => $branch->relationLoaded('manager') && $branch->manager
                ? [
                    'id' => $branch->manager->id,
                    'fullName' => $branch->manager->full_name,
                    'role' => $branch->manager->role,
                    'email' => $branch->manager->email,
                    'profileImageUrl' => $branch->manager->profile_image_url,
                ]
                : null,
            'createdAt' => $branch->created_at?->toISOString(),
            'updatedAt' => $branch->updated_at?->toISOString(),
        ];

        if (isset($branch->riders_count) || isset($branch->staff_members_count) || isset($branch->stocks_count)) {
            $payload['counts'] = [
                'riders' => (int) ($branch->riders_count ?? 0),
                'staffMembers' => (int) ($branch->staff_members_count ?? 0),
                'stocks' => (int) ($branch->stocks_count ?? 0),
            ];
        }

        return $payload;
    }

    public function staffMember(StaffMember $staff): array
    {
        return [
            'id' => $staff->id,
            'userId' => $staff->user_id,
            'branchId' => $staff->branch_id,
            'fullName' => $staff->full_name,
            'email' => $staff->email,
            'phone' => $staff->phone,
            'profileImageUrl' => $staff->profile_image_url,
            'role' => $staff->role,
            'permissions' => $this->staffAccess->normalizePermissions($staff->permissions, $staff->role),
            'isActive' => (bool) $staff->is_active,
            'createdAt' => $staff->created_at?->toISOString(),
            'updatedAt' => $staff->updated_at?->toISOString(),
            'branch' => $staff->relationLoaded('branch') && $staff->branch ? $this->branch($staff->branch) : null,
            'user' => $staff->relationLoaded('user') && $staff->user ? [
                'id' => $staff->user->id,
                'email' => $staff->user->email,
                'fullName' => $staff->user->full_name,
            ] : null,
        ];
    }

    public function staffActivityLog(StaffActivityLog $log): array
    {
        return [
            'id' => $log->id,
            'branchId' => $log->branch_id,
            'staffMemberId' => $log->staff_member_id,
            'action' => $log->action,
            'entityType' => $log->entity_type,
            'entityId' => $log->entity_id,
            'metadata' => $log->metadata,
            'createdAt' => $log->created_at?->toISOString(),
            'branch' => $log->relationLoaded('branch') && $log->branch ? [
                'id' => $log->branch->id,
                'name' => $log->branch->name,
            ] : null,
            'staffMember' => $log->relationLoaded('staffMember') && $log->staffMember ? [
                'id' => $log->staffMember->id,
                'fullName' => $log->staffMember->full_name,
                'role' => $log->staffMember->role,
            ] : null,
        ];
    }

    public function address($address): array
    {
        return [
            'id' => $address->id,
            'userId' => $address->user_id,
            'label' => $address->label,
            'street' => $address->street,
            'city' => $address->city,
            'state' => $address->state,
            'postalCode' => $address->postal_code,
            'country' => $address->country,
            'isDefault' => (bool) $address->is_default,
            'createdAt' => $address->created_at?->toISOString(),
            'updatedAt' => $address->updated_at?->toISOString(),
        ];
    }

    public function settings(AppSettings $settings, bool $includeSecretsMeta = true): array
    {
        $paymentMethods = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) ($settings->payment_methods ?: 'CASH,CARD,MOBILE_WALLET')),
        )));

        $homepageCms = array_replace_recursive(
            SettingsDefaults::defaultHomepageCms(),
            is_array($settings->homepage_cms) ? $settings->homepage_cms : [],
        );

        $themeConfig = array_replace(
            SettingsDefaults::defaultThemeConfig(),
            is_array($settings->theme_config) ? $settings->theme_config : [],
        );

        $logoSuite = array_replace([
            'headerLogo' => $settings->site_logo ?: '',
            'footerLogo' => $settings->site_logo ?: '',
            'sidebarLogo' => $settings->site_logo ?: '',
        ], is_array($settings->logo_suite) ? $settings->logo_suite : []);

        $uiPreferences = array_replace(
            SettingsDefaults::defaultUiPreferences(),
            is_array($settings->ui_preferences) ? $settings->ui_preferences : [],
        );

        $data = [
            'id' => $settings->id,
            'storeStatus' => $settings->store_status ?: 'OPEN',
            'businessHours' => $settings->business_hours ?: SettingsDefaults::defaultBusinessHours(),
            'enableAutoShutdown' => (bool) $settings->enable_auto_shutdown,
            'maintenanceMode' => (bool) $settings->maintenance_mode,
            'taxPercentage' => (float) $settings->tax_percentage,
            'deliveryChargeType' => $settings->delivery_charge_type ?: 'FLAT',
            'deliveryFlatFee' => (float) $settings->delivery_flat_fee,
            'deliveryPerKmCharge' => (float) $settings->delivery_per_km_charge,
            'currencySymbol' => $settings->currency_symbol ?: '$',
            'decimalRounding' => (int) $settings->decimal_rounding,
            'paymentMethods' => $paymentMethods,
            'siteName' => $settings->site_name ?: 'Kabob Places',
            'siteTitle' => $settings->site_title ?: 'Kabob Places — Kabobs & Comida Rápida en Iquique',
            'siteLogo' => $settings->site_logo,
            'siteFavicon' => $settings->site_favicon,
            'sitePhone' => $settings->site_phone ?: '+569 9103 0440',
            'siteEmail' => $settings->site_email ?: 'contacto@kabobplaces.cl',
            'siteAddress' => $settings->site_address ?: 'Dirección santa rosa de huara manzana D sitio 29 iquique',
            'contactHours' => $settings->contact_hours ?: '11:00 AM - 11:00 PM',
            'mapEmbedUrl' => $settings->map_embed_url ?: SettingsDefaults::DEFAULT_MAP_EMBED_URL,
            'footerTagline' => $settings->footer_tagline,
            'seoMetaTitle' => $settings->seo_meta_title,
            'seoMetaDescription' => $settings->seo_meta_description,
            'facebookUrl' => $settings->facebook_url,
            'instagramUrl' => $settings->instagram_url,
            'whatsappNumber' => $settings->whatsapp_number ?: '+569 9103 0440',
            'defaultLanguage' => $settings->default_language ?: 'es',
            'enabledLanguages' => $settings->enabled_languages ?: SettingsDefaults::defaultEnabledLanguages(),
            'themeConfig' => $themeConfig,
            'logoSuite' => $logoSuite,
            'homepageCms' => $homepageCms,
            'uiPreferences' => $uiPreferences,
            'createdAt' => $settings->created_at?->toISOString(),
            'updatedAt' => $settings->updated_at?->toISOString(),
        ];

        if ($includeSecretsMeta) {
            $data['mapApiKey'] = $settings->map_api_key ? '***' : '';
            $data['smsGatewayApiKey'] = $settings->sms_gateway_api_key ? '***' : '';
            $data['paymentGatewayApiKey'] = $settings->payment_gateway_api_key ? '***' : '';
        }

        return $data;
    }
}

