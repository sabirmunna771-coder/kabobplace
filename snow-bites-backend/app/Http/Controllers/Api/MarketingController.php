<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnnouncementBar;
use App\Models\AppSettings;
use App\Models\Coupon;
use App\Models\FlashSale;
use App\Models\HeroBanner;
use App\Models\MarketingNotification;
use App\Models\Review;
use App\Models\User;
use App\Services\MarketingService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MarketingController extends Controller
{
    public function __construct(
        private readonly ApiSerializer $serializer,
        private readonly MarketingService $marketing,
    ) {}

    public function listCoupons(): JsonResponse
    {
        $coupons = Coupon::orderByDesc('is_active')->orderByDesc('created_at')->get();

        return response()->json([
            'coupons' => $coupons->map(fn (Coupon $c) => $this->serializer->coupon($c))->values()->all(),
        ]);
    }

    public function createCoupon(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'discountType' => ['required', 'in:PERCENTAGE,FIXED'],
            'discountValue' => ['required', 'numeric', 'gt:0'],
            'minOrderValue' => ['nullable', 'numeric', 'min:0'],
            'expiresAt' => ['nullable', 'date'],
            'usageLimit' => ['nullable', 'integer', 'min:1'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $code = strtoupper(trim($data['code']));
        if (Coupon::where('code', $code)->exists()) {
            throw new ApiException(409, 'Coupon code already exists.');
        }

        $coupon = Coupon::create([
            'code' => $code,
            'discount_type' => $data['discountType'],
            'discount_value' => $data['discountValue'],
            'min_order_value' => $data['minOrderValue'] ?? 0,
            'expires_at' => $data['expiresAt'] ?? null,
            'usage_limit' => $data['usageLimit'] ?? null,
            'is_active' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Coupon created successfully.',
            'coupon' => $this->serializer->coupon($coupon),
        ], 201);
    }

    public function updateCoupon(Request $request, int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'min:3', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'discountType' => ['sometimes', 'in:PERCENTAGE,FIXED'],
            'discountValue' => ['sometimes', 'numeric', 'gt:0'],
            'minOrderValue' => ['sometimes', 'numeric', 'min:0'],
            'expiresAt' => ['nullable', 'date'],
            'usageLimit' => ['nullable', 'integer', 'min:1'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $update = [];
        if (array_key_exists('code', $data)) {
            $update['code'] = strtoupper(trim($data['code']));
        }
        if (array_key_exists('discountType', $data)) {
            $update['discount_type'] = $data['discountType'];
        }
        if (array_key_exists('discountValue', $data)) {
            $update['discount_value'] = $data['discountValue'];
        }
        if (array_key_exists('minOrderValue', $data)) {
            $update['min_order_value'] = $data['minOrderValue'];
        }
        if (array_key_exists('expiresAt', $data)) {
            $update['expires_at'] = $data['expiresAt'];
        }
        if (array_key_exists('usageLimit', $data)) {
            $update['usage_limit'] = $data['usageLimit'];
        }
        if (array_key_exists('isActive', $data)) {
            $update['is_active'] = $data['isActive'];
        }

        if ($update === []) {
            throw new ApiException(400, 'At least one field is required.');
        }

        $coupon->update($update);

        return response()->json([
            'message' => 'Coupon updated successfully.',
            'coupon' => $this->serializer->coupon($coupon->fresh()),
        ]);
    }

    public function deleteCoupon(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon deleted successfully.',
        ]);
    }

    public function listFlashSales(): JsonResponse
    {
        $flashSales = FlashSale::orderByDesc('is_active')->orderByDesc('created_at')->get();

        return response()->json([
            'flashSales' => $flashSales->map(fn (FlashSale $fs) => $this->serializer->flashSale($fs))->values()->all(),
        ]);
    }

    public function createFlashSale(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'discountType' => ['required', 'in:PERCENTAGE,FIXED'],
            'discountValue' => ['required', 'numeric', 'gt:0'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $isActive = $data['isActive'] ?? true;

        $flashSale = DB::transaction(function () use ($data, $isActive): FlashSale {
            if ($isActive) {
                FlashSale::where('is_active', true)->update(['is_active' => false]);
            }

            return FlashSale::create([
                'name' => trim($data['name']),
                'discount_type' => $data['discountType'],
                'discount_value' => $data['discountValue'],
                'starts_at' => $data['startsAt'],
                'ends_at' => $data['endsAt'],
                'is_active' => $isActive,
            ]);
        });

        return response()->json([
            'message' => 'Flash sale created successfully.',
            'flashSale' => $this->serializer->flashSale($flashSale),
        ], 201);
    }

    public function updateFlashSale(Request $request, int $id): JsonResponse
    {
        $current = FlashSale::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'discountType' => ['sometimes', 'in:PERCENTAGE,FIXED'],
            'discountValue' => ['sometimes', 'numeric', 'gt:0'],
            'startsAt' => ['sometimes', 'date'],
            'endsAt' => ['sometimes', 'date'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $nextStartsAt = strtotime((string) ($data['startsAt'] ?? $current->starts_at));
        $nextEndsAt = strtotime((string) ($data['endsAt'] ?? $current->ends_at));
        if ($nextStartsAt >= $nextEndsAt) {
            throw new ApiException(400, 'Flash sale end time must be after start time.');
        }

        $flashSale = DB::transaction(function () use ($current, $data, $id): FlashSale {
            if (! empty($data['isActive'])) {
                FlashSale::where('is_active', true)->where('id', '!=', $id)->update(['is_active' => false]);
            }

            $update = [];
            if (array_key_exists('name', $data)) {
                $update['name'] = trim($data['name']);
            }
            if (array_key_exists('discountType', $data)) {
                $update['discount_type'] = $data['discountType'];
            }
            if (array_key_exists('discountValue', $data)) {
                $update['discount_value'] = $data['discountValue'];
            }
            if (array_key_exists('startsAt', $data)) {
                $update['starts_at'] = $data['startsAt'];
            }
            if (array_key_exists('endsAt', $data)) {
                $update['ends_at'] = $data['endsAt'];
            }
            if (array_key_exists('isActive', $data)) {
                $update['is_active'] = $data['isActive'];
            }

            $current->update($update);

            return $current->fresh();
        });

        return response()->json([
            'message' => 'Flash sale updated successfully.',
            'flashSale' => $this->serializer->flashSale($flashSale),
        ]);
    }

    public function listCustomerProfiles(): JsonResponse
    {
        $customers = User::with(['orders' => fn ($q) => $q->orderByDesc('created_at')])
            ->where('role', 'CUSTOMER')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'customers' => $customers->map(fn (User $u) => $this->serializer->customerProfile($u))->values()->all(),
        ]);
    }

    public function listNotifications(): JsonResponse
    {
        $notifications = MarketingNotification::orderByDesc('is_active')->orderByDesc('created_at')->get();

        return response()->json([
            'notifications' => $notifications->map(fn (MarketingNotification $n) => $this->serializer->marketingNotification($n))->values()->all(),
        ]);
    }

    public function createNotification(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'message' => ['required', 'string', 'min:2', 'max:500'],
            'kind' => ['nullable', 'in:GENERAL,DEAL_OF_DAY,WE_MISS_YOU,URGENT'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'expiresAt' => ['nullable', 'date'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $notification = MarketingNotification::create([
            'title' => trim($data['title']),
            'message' => trim($data['message']),
            'kind' => $data['kind'] ?? 'GENERAL',
            'cta_label' => $data['ctaLabel'] ?? null,
            'cta_href' => $data['ctaHref'] ?? null,
            'expires_at' => $data['expiresAt'] ?? null,
            'is_active' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Alert created successfully.',
            'notification' => $this->serializer->marketingNotification($notification),
        ], 201);
    }

    public function updateNotification(Request $request, int $id): JsonResponse
    {
        $notification = MarketingNotification::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:120'],
            'message' => ['sometimes', 'string', 'min:2', 'max:500'],
            'kind' => ['sometimes', 'in:GENERAL,DEAL_OF_DAY,WE_MISS_YOU,URGENT'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'expiresAt' => ['nullable', 'date'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $update = [];
        if (array_key_exists('title', $data)) {
            $update['title'] = trim($data['title']);
        }
        if (array_key_exists('message', $data)) {
            $update['message'] = trim($data['message']);
        }
        if (array_key_exists('kind', $data)) {
            $update['kind'] = $data['kind'];
        }
        if (array_key_exists('ctaLabel', $data)) {
            $update['cta_label'] = $data['ctaLabel'];
        }
        if (array_key_exists('ctaHref', $data)) {
            $update['cta_href'] = $data['ctaHref'];
        }
        if (array_key_exists('expiresAt', $data)) {
            $update['expires_at'] = $data['expiresAt'];
        }
        if (array_key_exists('isActive', $data)) {
            $update['is_active'] = $data['isActive'];
        }

        $notification->update($update);

        return response()->json([
            'message' => 'Alert updated successfully.',
            'notification' => $this->serializer->marketingNotification($notification->fresh()),
        ]);
    }

    public function deleteNotification(int $id): JsonResponse
    {
        MarketingNotification::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Alert deleted successfully.',
        ]);
    }

    public function listReviews(): JsonResponse
    {
        $reviews = Review::with('user')->orderByDesc('created_at')->get();

        return response()->json([
            'reviews' => $reviews->map(fn (Review $r) => $this->serializer->review($r))->values()->all(),
        ]);
    }

    public function moderateReview(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:PENDING,APPROVED,HIDDEN'],
        ]);

        $review = Review::with('user')->findOrFail($id);
        $review->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Review updated successfully.',
            'review' => $this->serializer->review($review->fresh('user')),
        ]);
    }

    public function listHeroBanners(): JsonResponse
    {
        $banners = HeroBanner::orderBy('sort_order')->orderByDesc('created_at')->get();

        return response()->json([
            'banners' => $banners->map(fn (HeroBanner $b) => $this->serializer->heroBanner($b))->values()->all(),
        ]);
    }

    public function createHeroBanner(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'subtitle' => ['nullable', 'string', 'max:320'],
            'imageUrl' => ['required', 'string', 'min:1'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $banner = HeroBanner::create([
            'title' => trim($data['title']),
            'subtitle' => $data['subtitle'] ?? null,
            'image_url' => trim($data['imageUrl']),
            'cta_label' => $data['ctaLabel'] ?? null,
            'cta_href' => $data['ctaHref'] ?? null,
            'sort_order' => $data['sortOrder'] ?? 0,
            'is_active' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Hero banner created successfully.',
            'banner' => $this->serializer->heroBanner($banner),
        ], 201);
    }

    public function updateHeroBanner(Request $request, int $id): JsonResponse
    {
        $banner = HeroBanner::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:120'],
            'subtitle' => ['nullable', 'string', 'max:320'],
            'imageUrl' => ['sometimes', 'string', 'min:1'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'sortOrder' => ['sometimes', 'integer', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $update = [];
        if (array_key_exists('title', $data)) {
            $update['title'] = trim($data['title']);
        }
        if (array_key_exists('subtitle', $data)) {
            $update['subtitle'] = $data['subtitle'];
        }
        if (array_key_exists('imageUrl', $data)) {
            $update['image_url'] = trim($data['imageUrl']);
        }
        if (array_key_exists('ctaLabel', $data)) {
            $update['cta_label'] = $data['ctaLabel'];
        }
        if (array_key_exists('ctaHref', $data)) {
            $update['cta_href'] = $data['ctaHref'];
        }
        if (array_key_exists('sortOrder', $data)) {
            $update['sort_order'] = $data['sortOrder'];
        }
        if (array_key_exists('isActive', $data)) {
            $update['is_active'] = $data['isActive'];
        }

        $banner->update($update);

        return response()->json([
            'message' => 'Hero banner updated successfully.',
            'banner' => $this->serializer->heroBanner($banner->fresh()),
        ]);
    }

    public function deleteHeroBanner(int $id): JsonResponse
    {
        HeroBanner::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Hero banner deleted successfully.',
        ]);
    }

    public function listAnnouncements(): JsonResponse
    {
        $announcements = AnnouncementBar::orderByDesc('is_active')->orderByDesc('created_at')->get();

        return response()->json([
            'announcements' => $announcements->map(fn (AnnouncementBar $a) => $this->serializer->announcementBar($a))->values()->all(),
        ]);
    }

    public function createAnnouncement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:2', 'max:220'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $isActive = $data['isActive'] ?? true;

        $announcement = DB::transaction(function () use ($data, $isActive): AnnouncementBar {
            if ($isActive) {
                AnnouncementBar::where('is_active', true)->update(['is_active' => false]);
            }

            return AnnouncementBar::create([
                'text' => trim($data['text']),
                'cta_label' => $data['ctaLabel'] ?? null,
                'cta_href' => $data['ctaHref'] ?? null,
                'is_active' => $isActive,
            ]);
        });

        return response()->json([
            'message' => 'Announcement saved successfully.',
            'announcement' => $this->serializer->announcementBar($announcement),
        ], 201);
    }

    public function updateAnnouncement(Request $request, int $id): JsonResponse
    {
        $announcement = AnnouncementBar::findOrFail($id);
        $data = $request->validate([
            'text' => ['sometimes', 'string', 'min:2', 'max:220'],
            'ctaLabel' => ['nullable', 'string', 'max:40'],
            'ctaHref' => ['nullable', 'string', 'max:200'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $updated = DB::transaction(function () use ($announcement, $data, $id): AnnouncementBar {
            if (! empty($data['isActive'])) {
                AnnouncementBar::where('is_active', true)->where('id', '!=', $id)->update(['is_active' => false]);
            }

            $update = [];
            if (array_key_exists('text', $data)) {
                $update['text'] = trim($data['text']);
            }
            if (array_key_exists('ctaLabel', $data)) {
                $update['cta_label'] = $data['ctaLabel'];
            }
            if (array_key_exists('ctaHref', $data)) {
                $update['cta_href'] = $data['ctaHref'];
            }
            if (array_key_exists('isActive', $data)) {
                $update['is_active'] = $data['isActive'];
            }

            $announcement->update($update);

            return $announcement->fresh();
        });

        return response()->json([
            'message' => 'Announcement updated successfully.',
            'announcement' => $this->serializer->announcementBar($updated),
        ]);
    }

    public function deleteAnnouncement(int $id): JsonResponse
    {
        AnnouncementBar::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    public function publicMarketingContent(): JsonResponse
    {
        $now = now();

        $announcement = AnnouncementBar::where('is_active', true)->orderByDesc('updated_at')->first();
        $banners = HeroBanner::where('is_active', true)->orderBy('sort_order')->orderByDesc('created_at')->get();
        $notifications = MarketingNotification::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', $now);
            })
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $reviews = Review::with('user')
            ->where('status', 'APPROVED')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        $flashSale = FlashSale::where('is_active', true)->orderByDesc('created_at')->first();

        return response()->json([
            'announcement' => $announcement ? $this->serializer->announcementBar($announcement) : null,
            'banners' => $banners->map(fn (HeroBanner $b) => $this->serializer->heroBanner($b))->values()->all(),
            'notifications' => $notifications->map(fn (MarketingNotification $n) => $this->serializer->marketingNotification($n))->values()->all(),
            'reviews' => $reviews->map(fn (Review $r) => $this->serializer->review($r))->values()->all(),
            'flashSale' => ($flashSale && $this->marketing->isFlashSaleLive($flashSale))
                ? $this->serializer->flashSale($flashSale)
                : null,
        ]);
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'min:3', 'max:40'],
            'subtotal' => ['required', 'numeric', 'gt:0'],
        ]);

        $coupon = Coupon::where('code', strtoupper(trim($data['code'])))->first();
        if (! $coupon || ! $this->marketing->isCouponCurrentlyValid($coupon)) {
            throw new ApiException(400, 'Coupon code is invalid or expired.');
        }

        $subtotal = (float) $data['subtotal'];
        if ($subtotal < (float) $coupon->min_order_value) {
            $currency = AppSettings::first()?->currency_symbol ?: '$';
            throw new ApiException(400, sprintf('Minimum order value is %s %.2f.', $currency, (float) $coupon->min_order_value));
        }

        $discountAmount = $this->marketing->calculateDiscountAmount(
            $coupon->discount_type,
            (float) $coupon->discount_value,
            $subtotal,
        );

        return response()->json([
            'message' => 'Coupon applied successfully.',
            'coupon' => $this->serializer->coupon($coupon),
            'discountAmount' => $discountAmount,
            'finalTotal' => round($subtotal - $discountAmount, 2),
        ]);
    }

    public function submitPublicReview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customerName' => ['required', 'string', 'min:2', 'max:100'],
            'customerEmail' => ['nullable', 'string', 'email'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $email = isset($data['customerEmail']) ? strtolower(trim($data['customerEmail'])) : null;
        $user = $email ? User::where('email', $email)->first() : null;

        $review = Review::create([
            'user_id' => $user?->id,
            'customer_name' => trim($data['customerName']),
            'customer_email' => $email,
            'rating' => (int) $data['rating'],
            'comment' => trim($data['comment']),
            'status' => 'PENDING',
        ]);

        return response()->json([
            'message' => 'Review submitted and awaiting moderation.',
            'review' => $this->serializer->review($review->load('user')),
        ], 201);
    }
}

