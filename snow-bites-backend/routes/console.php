<?php

use App\Support\MenuSeeder;
use App\Support\SqlDumpImporter;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('kabob:sync-brand-palette', function () {
    $settings = \App\Models\AppSettings::first();
    $theme = \App\Support\SettingsDefaults::defaultThemeConfig();
    if ($settings) {
        $settings->update([
            'site_name' => 'Kabob Place',
            'site_title' => 'Kabob Place — Kabobs & Comida Rápida en Iquique',
            'seo_meta_title' => 'Kabob Place | Kabobs y Comida Rápida en Iquique',
            'site_logo' => '/logo.webp',
            'site_favicon' => '/favicon.png',
            'theme_config' => $theme,
            'logo_suite' => [
                'headerLogo' => '/logo.webp',
                'footerLogo' => '/logo.webp',
                'sidebarLogo' => '/logo.webp',
            ],
        ]);
        $this->info("Updated AppSettings to brand palette: Primary {$theme['primaryColor']}, Secondary {$theme['secondaryColor']}, Site Name: Kabob Place");
    } else {
        \App\Models\AppSettings::create(\App\Support\SettingsDefaults::defaultAttributes());
        $this->info("Created default AppSettings with brand palette");
    }

    return 0;
})->purpose('Sync Kabob Place brand colours palette and name');

Artisan::command('kabob:sync-brand-assets', function () {
    $settings = \App\Models\AppSettings::first();
    if ($settings) {
        $settings->update([
            'site_logo' => '/logo.webp',
            'site_favicon' => '/favicon.png',
            'logo_suite' => [
                'headerLogo' => '/logo.webp',
                'footerLogo' => '/logo.webp',
                'sidebarLogo' => '/logo.webp',
            ],
        ]);
        $this->info("Updated AppSettings brand assets to /logo.webp and /favicon.png");
    } else {
        \App\Models\AppSettings::create(\App\Support\SettingsDefaults::defaultAttributes());
        $this->info("Created default AppSettings with /logo.webp and /favicon.png");
    }

    return 0;
})->purpose('Set Kabob Places logo and favicon in AppSettings');

Artisan::command('kabob:sync-noche-menu', function () {
    $counts = MenuSeeder::seedNocheMenu();
    $settings = \App\Models\AppSettings::first();
    if ($settings) {
        $cms = is_array($settings->homepage_cms) ? $settings->homepage_cms : \App\Support\SettingsDefaults::defaultHomepageCms();
        $cms['marqueeItems'] = \App\Support\SettingsDefaults::defaultHomepageCms()['marqueeItems'];
        $settings->update(['homepage_cms' => $cms]);
    }
    $this->info('Synced Menú Noche catalog:');
    foreach ($counts as $k => $v) {
        $this->line("  - {$k}: {$v}");
    }

    return 0;
})->purpose('Replace catalog categories and products with Kabob Place Menú Noche');

Artisan::command('kabob:import-sql {path?}', function (?string $path = null) {
    $sqlPath = $path ?: base_path('../sbkhaplu.sql');
    if (! is_file($sqlPath)) {
        $this->error("SQL file not found at: {$sqlPath}");

        return 1;
    }

    $importer = new SqlDumpImporter();
    $counts = $importer->importFile($sqlPath);

    $this->info('Imported records from SQL dump:');
    foreach ($counts as $table => $count) {
        $this->line("  - {$table}: {$count}");
    }

    return 0;
})->purpose('Import existing data from sbkhaplu.sql into PostgreSQL or SQLite');
