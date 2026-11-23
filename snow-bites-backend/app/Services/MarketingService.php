<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\FlashSale;
use Carbon\CarbonInterface;

class MarketingService
{
    public function calculateDiscountAmount(string $discountType, float $discountValue, float $baseAmount): float
    {
        if ($baseAmount <= 0 || $discountValue <= 0) {
            return 0.0;
        }

        $raw = $discountType === 'PERCENTAGE'
            ? ($baseAmount * $discountValue) / 100
            : $discountValue;

        return round(max(0, min($baseAmount, $raw)), 2);
    }

    public function isCouponCurrentlyValid(Coupon $coupon, ?CarbonInterface $now = null): bool
    {
        $now ??= now();

        if (! $coupon->is_active) {
            return false;
        }

        if ($coupon->expires_at && $coupon->expires_at->lt($now)) {
            return false;
        }

        if ($coupon->usage_limit !== null && $coupon->usage_count >= $coupon->usage_limit) {
            return false;
        }

        return true;
    }

    public function isFlashSaleLive(FlashSale $flashSale, ?CarbonInterface $now = null): bool
    {
        $now ??= now();

        if (! $flashSale->is_active) {
            return false;
        }

        return $flashSale->starts_at->lte($now) && $flashSale->ends_at->gte($now);
    }

    public function getCustomerLoyaltyTag(int $completedOrders): string
    {
        if ($completedOrders >= 10) {
            return 'VIP';
        }

        if ($completedOrders >= 3) {
            return 'Regular';
        }

        return 'New';
    }
}

