<?php

namespace Database\Seeders;

use App\Models\AppSettings;
use App\Models\Branch;
use App\Models\User;
use App\Support\MenuSeeder;
use App\Support\SettingsDefaults;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure primary Kabob Places admin login & compatibility login both exist
        $adminHash = Hash::make('Admin@12345');

        User::updateOrCreate(
            ['email' => 'admin@kabobplaces.cl'],
            [
                'full_name' => 'Admin Kabob Places',
                'phone' => '+569 9103 0440',
                'password_hash' => $adminHash,
                'role' => 'ADMIN',
            ],
        );

        User::updateOrCreate(
            ['email' => 'admin@snowbites.local'],
            [
                'full_name' => 'Admin Kabob Places',
                'phone' => '+569 9103 0440',
                'password_hash' => $adminHash,
                'role' => 'ADMIN',
            ],
        );

        // Ensure an active primary branch in Iquique, Chile
        $primaryBranch = Branch::where('code', '001')->first() ?? Branch::first();
        if ($primaryBranch) {
            $primaryBranch->update([
                'name' => 'Kabob Places — Iquique Principal',
                'address' => 'Dirección santa rosa de huara manzana D sitio 29 iquique',
                'phone' => '+569 9103 0440',
                'status' => 'ACTIVE',
                'is_primary' => true,
            ]);
            Branch::where('id', '!=', $primaryBranch->id)->delete();
        } else {
            Branch::create([
                'code' => '001',
                'name' => 'Kabob Places — Iquique Principal',
                'address' => 'Dirección santa rosa de huara manzana D sitio 29 iquique',
                'phone' => '+569 9103 0440',
                'status' => 'ACTIVE',
                'is_primary' => true,
            ]);
        }

        // Initialize or update global Kabob Places Chile settings
        $settings = AppSettings::first();
        if (! $settings) {
            AppSettings::create(SettingsDefaults::defaultAttributes());
        } else {
            $settings->update(SettingsDefaults::defaultAttributes());
        }

        // Apply Kabob Place Menú Noche categories (clean, zero dummy products)
        MenuSeeder::seedNocheMenu();

        // Clear all dummy/test data so the store is 100% clean and dynamic
        DB::table('order_items')->delete();
        DB::table('order_status_histories')->delete();
        DB::table('orders')->delete();
        DB::table('staff_activity_logs')->delete();
        DB::table('inventory_waste_logs')->delete();
        DB::table('inventory_restock_logs')->delete();
        DB::table('branch_ingredient_stocks')->delete();
        DB::table('ingredients')->delete();
        DB::table('vendor_supplies')->delete();
        DB::table('vendors')->delete();
        DB::table('riders')->delete();
        DB::table('staff_members')->delete();
        DB::table('reviews')->delete();
        DB::table('coupons')->delete();
        DB::table('flash_sales')->delete();
        DB::table('marketing_notifications')->delete();
        DB::table('hero_banners')->delete();
        DB::table('announcement_bars')->delete();
        User::where('role', '!=', 'ADMIN')->delete();
    }
}
