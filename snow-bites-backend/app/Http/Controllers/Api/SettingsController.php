<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSettings;
use App\Support\ApiSerializer;
use App\Support\SettingsDefaults;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(private readonly ApiSerializer $serializer) {}

    public function show(): JsonResponse
    {
        $settings = AppSettings::first();
        if (! $settings) {
            $settings = AppSettings::create(SettingsDefaults::defaultAttributes());
        }

        return response()->json([
            'data' => $this->serializer->settings($settings, true),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'storeStatus' => ['sometimes', 'in:OPEN,CLOSED'],
            'businessHours' => ['sometimes', 'nullable', 'array'],
            'enableAutoShutdown' => ['sometimes', 'boolean'],
            'maintenanceMode' => ['sometimes', 'boolean'],
            'taxPercentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'deliveryChargeType' => ['sometimes', 'in:FLAT,DISTANCE_BASED'],
            'deliveryFlatFee' => ['sometimes', 'numeric', 'min:0'],
            'deliveryPerKmCharge' => ['sometimes', 'numeric', 'min:0'],
            'currencySymbol' => ['sometimes', 'string', 'max:16'],
            'decimalRounding' => ['sometimes', 'integer', 'min:0', 'max:5'],
            'paymentMethods' => ['sometimes'],
            'mapApiKey' => ['sometimes', 'nullable', 'string'],
            'smsGatewayApiKey' => ['sometimes', 'nullable', 'string'],
            'paymentGatewayApiKey' => ['sometimes', 'nullable', 'string'],
            'siteName' => ['sometimes', 'string', 'min:1', 'max:100'],
            'siteTitle' => ['sometimes', 'string', 'max:160'],
            'siteLogo' => ['sometimes', 'nullable', 'string'],
            'siteFavicon' => ['sometimes', 'nullable', 'string'],
            'sitePhone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'siteEmail' => ['sometimes', 'nullable', 'email', 'max:100'],
            'siteAddress' => ['sometimes', 'nullable', 'string'],
            'contactHours' => ['sometimes', 'nullable', 'string', 'max:160'],
            'mapEmbedUrl' => ['sometimes', 'nullable', 'string'],
            'footerTagline' => ['sometimes', 'nullable', 'string'],
            'seoMetaTitle' => ['sometimes', 'nullable', 'string', 'max:160'],
            'seoMetaDescription' => ['sometimes', 'nullable', 'string', 'max:160'],
            'facebookUrl' => ['sometimes', 'nullable', 'string', 'max:255'],
            'instagramUrl' => ['sometimes', 'nullable', 'string', 'max:255'],
            'whatsappNumber' => ['sometimes', 'nullable', 'string', 'max:32'],
            'defaultLanguage' => ['sometimes', 'in:es,en,arn,ay'],
            'enabledLanguages' => ['sometimes', 'array', 'min:1'],
            'enabledLanguages.*' => ['string', 'in:es,en,arn,ay'],
            'themeConfig' => ['sometimes', 'nullable', 'array'],
            'themeConfig.primaryColor' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'themeConfig.secondaryColor' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'themeConfig.fontFamily' => ['sometimes', 'in:inter,outfit,dm-sans,playfair,syne'],
            'themeConfig.borderRadius' => ['sometimes', 'numeric', 'min:0', 'max:32'],
            'themeConfig.glassmorphIntensity' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'logoSuite' => ['sometimes', 'nullable', 'array'],
            'homepageCms' => ['sometimes', 'nullable', 'array'],
            'uiPreferences' => ['sometimes', 'nullable', 'array'],
        ]);

        $map = [
            'storeStatus' => 'store_status',
            'businessHours' => 'business_hours',
            'enableAutoShutdown' => 'enable_auto_shutdown',
            'maintenanceMode' => 'maintenance_mode',
            'taxPercentage' => 'tax_percentage',
            'deliveryChargeType' => 'delivery_charge_type',
            'deliveryFlatFee' => 'delivery_flat_fee',
            'deliveryPerKmCharge' => 'delivery_per_km_charge',
            'currencySymbol' => 'currency_symbol',
            'decimalRounding' => 'decimal_rounding',
            'mapApiKey' => 'map_api_key',
            'smsGatewayApiKey' => 'sms_gateway_api_key',
            'paymentGatewayApiKey' => 'payment_gateway_api_key',
            'siteName' => 'site_name',
            'siteTitle' => 'site_title',
            'siteLogo' => 'site_logo',
            'siteFavicon' => 'site_favicon',
            'sitePhone' => 'site_phone',
            'siteEmail' => 'site_email',
            'siteAddress' => 'site_address',
            'contactHours' => 'contact_hours',
            'mapEmbedUrl' => 'map_embed_url',
            'footerTagline' => 'footer_tagline',
            'seoMetaTitle' => 'seo_meta_title',
            'seoMetaDescription' => 'seo_meta_description',
            'facebookUrl' => 'facebook_url',
            'instagramUrl' => 'instagram_url',
            'whatsappNumber' => 'whatsapp_number',
            'defaultLanguage' => 'default_language',
            'enabledLanguages' => 'enabled_languages',
            'themeConfig' => 'theme_config',
            'logoSuite' => 'logo_suite',
            'homepageCms' => 'homepage_cms',
            'uiPreferences' => 'ui_preferences',
        ];

        $payload = [];
        foreach ($map as $camel => $snake) {
            if (! array_key_exists($camel, $data)) {
                continue;
            }
            $value = $data[$camel];
            // Do not overwrite real secret API keys with masked "***" sent back from frontend
            if (in_array($camel, ['mapApiKey', 'smsGatewayApiKey', 'paymentGatewayApiKey'], true) && $value === '***') {
                continue;
            }
            $payload[$snake] = $value === '' ? null : $value;
        }

        if (array_key_exists('paymentMethods', $data)) {
            $methods = $data['paymentMethods'];
            if (is_array($methods)) {
                $payload['payment_methods'] = implode(',', array_map('trim', $methods));
            } elseif (is_string($methods)) {
                $payload['payment_methods'] = trim($methods);
            }
        }

        $settings = AppSettings::first();
        if (! $settings) {
            $settings = AppSettings::create(array_merge(SettingsDefaults::defaultAttributes(), $payload));
        } else {
            $settings->update($payload);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => $this->serializer->settings($settings->fresh(), true),
        ]);
    }
}

