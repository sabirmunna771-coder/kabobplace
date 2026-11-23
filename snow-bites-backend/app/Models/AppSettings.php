<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSettings extends Model
{
    protected $table = 'app_settings';

    protected $fillable = [
        'store_status',
        'business_hours',
        'enable_auto_shutdown',
        'maintenance_mode',
        'tax_percentage',
        'delivery_charge_type',
        'delivery_flat_fee',
        'delivery_per_km_charge',
        'currency_symbol',
        'decimal_rounding',
        'payment_methods',
        'map_api_key',
        'sms_gateway_api_key',
        'payment_gateway_api_key',
        'site_name',
        'site_title',
        'site_logo',
        'site_favicon',
        'site_phone',
        'site_email',
        'site_address',
        'contact_hours',
        'map_embed_url',
        'footer_tagline',
        'seo_meta_title',
        'seo_meta_description',
        'facebook_url',
        'instagram_url',
        'whatsapp_number',
        'default_language',
        'enabled_languages',
        'theme_config',
        'logo_suite',
        'homepage_cms',
        'ui_preferences',
    ];

    protected function casts(): array
    {
        return [
            'business_hours' => 'array',
            'enable_auto_shutdown' => 'boolean',
            'maintenance_mode' => 'boolean',
            'tax_percentage' => 'decimal:2',
            'delivery_flat_fee' => 'decimal:2',
            'delivery_per_km_charge' => 'decimal:2',
            'decimal_rounding' => 'integer',
            'enabled_languages' => 'array',
            'theme_config' => 'array',
            'logo_suite' => 'array',
            'homepage_cms' => 'array',
            'ui_preferences' => 'array',
        ];
    }
}

