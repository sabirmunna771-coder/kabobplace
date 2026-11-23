<?php

namespace Database\Seeders;

use App\Models\AppSettings;
use App\Models\Branch;
use App\Models\User;
use App\Support\MenuSeeder;
use App\Support\SettingsDefaults;
use App\Support\SqlDumpImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $sqlPath = base_path('../sbkhaplu.sql');
        if (is_file($sqlPath)) {
            $importer = new SqlDumpImporter();
            $importer->importFile($sqlPath);
        }

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
            Branch::where('id', '!=', $primaryBranch->id)->update(['is_primary' => false]);
        } else {
            Branch::create([
                'code' => 'IQQ-001',
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

        if (isset($importer)) {
            $importer->resetPostgresSequences();
        }

        // Apply Kabob Place Menú Noche categories and menu items
        MenuSeeder::seedNocheMenu();

        // Dynamically align orders relative to now() so metrics, charts, KDS, and riders are live and active
        $orders = \App\Models\Order::all();
        if ($orders->isNotEmpty()) {
            foreach ($orders as $idx => $order) {
                $daysAgo = ($idx >= 15) ? 0 : (($idx >= 11) ? 1 : (($idx >= 7) ? 2 : (($idx >= 4) ? 3 : 4)));
                $hoursAgo = ($idx % 6) + 1;
                $date = now()->subDays($daysAgo)->subHours($hoursAgo);
                $order->created_at = $date;
                $order->updated_at = $date;
                $order->save();
            }
        }
    }
}
