<?php

namespace App\Support;

class SettingsDefaults
{
    public const DEFAULT_MAP_EMBED_URL = 'https://www.google.com/maps?q=Santa+Rosa+de+Huara+Manzana+D+Sitio+29+Iquique+Chile&output=embed';

    public static function defaultEnabledLanguages(): array
    {
        return ['es', 'en', 'arn', 'ay'];
    }

    public static function defaultThemeConfig(): array
    {
        return [
            'primaryColor' => '#F2C41C',
            'secondaryColor' => '#A0D000',
            'fontFamily' => 'dm-sans',
            'borderRadius' => 16,
            'glassmorphIntensity' => 40,
        ];
    }

    public static function defaultHomepageCms(?array $heroBanners = null): array
    {
        return [
            'heroBanners' => $heroBanners ?? [],
            'heroBadgeText' => 'Ahora entregando en Iquique',
            'heroStats' => [
                ['num' => '50+', 'label' => 'Platos y Kabobs'],
                ['num' => '2K+', 'label' => 'Clientes Felices'],
                ['num' => '30m', 'label' => 'Entrega Rápida'],
            ],
            'marqueeItems' => [
                'HALAL FOOD',
                'BROASTER',
                'SHAWARMA',
                'BURGERS',
                "GRILL'S PAKISTANI",
                'PIZZAS',
                'AGREGADOS',
                'ZOFRI · IQUIQUE',
            ],
            'enabledSections' => [
                'hero' => true,
                'marquee' => true,
                'featured' => true,
                'menu' => true,
                'shop' => true,
                'specialOffers' => true,
                'testimonials' => true,
                'contact' => true,
                'newsletter' => true,
            ],
        ];
    }

    public static function defaultUiPreferences(): array
    {
        return [
            'defaultBorderRadius' => 16,
            'glassmorphOpacity' => 0.1,
            'animationEnabled' => true,
        ];
    }

    public static function defaultBusinessHours(): array
    {
        return [
            'mon' => ['open' => '11:00', 'close' => '23:00'],
            'tue' => ['open' => '11:00', 'close' => '23:00'],
            'wed' => ['open' => '11:00', 'close' => '23:00'],
            'thu' => ['open' => '11:00', 'close' => '23:00'],
            'fri' => ['open' => '11:00', 'close' => '23:30'],
            'sat' => ['open' => '11:00', 'close' => '23:30'],
            'sun' => ['open' => '12:00', 'close' => '22:30'],
        ];
    }

    public static function defaultAttributes(): array
    {
        return [
            'store_status' => 'OPEN',
            'business_hours' => self::defaultBusinessHours(),
            'enable_auto_shutdown' => false,
            'maintenance_mode' => false,
            'tax_percentage' => 19,
            'delivery_charge_type' => 'FLAT',
            'delivery_flat_fee' => 1500,
            'delivery_per_km_charge' => 500,
            'currency_symbol' => '$',
            'decimal_rounding' => 0,
            'payment_methods' => 'CASH,CARD,MOBILE_WALLET',
            'site_name' => 'Kabob Place',
            'site_title' => 'Kabob Place — Kabobs & Comida Rápida en Iquique',
            'site_phone' => '+569 9103 0440',
            'site_email' => 'contacto@kabobplaces.cl',
            'site_address' => 'Dirección santa rosa de huara manzana D sitio 29 iquique',
            'contact_hours' => '11:00 AM - 11:00 PM',
            'map_embed_url' => self::DEFAULT_MAP_EMBED_URL,
            'footer_tagline' => 'Auténticos kabobs y comida rápida premium en el corazón de Iquique. Ingredientes frescos, sabor intenso y entrega veloz.',
            'seo_meta_title' => 'Kabob Place | Kabobs y Comida Rápida en Iquique',
            'seo_meta_description' => 'Disfruta los mejores kabobs, shawarmas, hamburguesas y pizzas en Iquique. Entrega rápida desde Santa Rosa de Huara.',
            'whatsapp_number' => '+569 9103 0440',
            'site_logo' => '/logo.webp',
            'site_favicon' => '/favicon.png',
            'default_language' => 'es',
            'enabled_languages' => self::defaultEnabledLanguages(),
            'theme_config' => self::defaultThemeConfig(),
            'logo_suite' => [
                'headerLogo' => '/logo.webp',
                'footerLogo' => '/logo.webp',
                'sidebarLogo' => '/logo.webp',
            ],
            'homepage_cms' => self::defaultHomepageCms(),
            'ui_preferences' => self::defaultUiPreferences(),
        ];
    }
}

