<?php

namespace Tests\Feature;

use App\Models\AppSettings;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\ProductRecipeItem;
use App\Models\User;
use App\Support\SettingsDefaults;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class KabobApiTest extends TestCase
{
    use RefreshDatabase;

    private function createAdminAndToken(): string
    {
        User::create([
            'full_name' => 'Admin Kabob Places',
            'email' => 'admin@kabobplaces.cl',
            'phone' => '+569 9103 0440',
            'password_hash' => Hash::make('Admin@12345'),
            'role' => 'ADMIN',
        ]);

        $res = $this->postJson('/api/auth/login', [
            'email' => 'admin@kabobplaces.cl',
            'password' => 'Admin@12345',
        ])->assertOk();

        return $res->json('token');
    }

    public function test_health_and_public_settings_expose_kabob_places_defaults_without_secret_keys(): void
    {
        AppSettings::create(array_merge(SettingsDefaults::defaultAttributes(), [
            'map_api_key' => 'super-secret-map-key',
            'sms_gateway_api_key' => 'super-secret-sms-key',
        ]));

        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('database', 'connected');

        $publicRes = $this->getJson('/api/settings/public')
            ->assertOk()
            ->assertJsonPath('data.siteName', 'Kabob Places')
            ->assertJsonPath('data.sitePhone', '+569 9103 0440')
            ->assertJsonPath('data.siteAddress', 'Dirección santa rosa de huara manzana D sitio 29 iquique')
            ->assertJsonPath('data.defaultLanguage', 'es')
            ->assertJsonPath('data.enabledLanguages.0', 'es');

        $this->assertArrayNotHasKey('mapApiKey', $publicRes->json('data'));
        $this->assertArrayNotHasKey('smsGatewayApiKey', $publicRes->json('data'));
    }

    public function test_customer_registration_login_orders_and_addresses(): void
    {
        AppSettings::create(SettingsDefaults::defaultAttributes());

        $cat = Category::create(['slug' => 'kabobs', 'name' => 'Kabobs']);
        $product = Product::create([
            'public_id' => 'k1',
            'slug' => 'lamb-kabob',
            'name' => 'Lamb Kabob',
            'price' => 5000,
            'is_active' => true,
            'is_in_stock' => true,
            'category_id' => $cat->id,
        ]);

        $reg = $this->postJson('/api/auth/register', [
            'fullName' => 'Camila Rojas',
            'email' => 'camila@example.cl',
            'phone' => '+56911223344',
            'password' => 'secret123',
        ])->assertCreated();

        $token = $reg->json('token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'camila@example.cl');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/customer/addresses', [
                'label' => 'Casa',
                'street' => 'Dirección santa rosa de huara manzana D sitio 29',
                'city' => 'Iquique',
                'state' => 'Tarapacá',
                'postalCode' => '1100000',
                'country' => 'Chile',
                'isDefault' => true,
            ])->assertCreated();

        $orderRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'customerName' => 'Camila Rojas',
                'customerPhone' => '+56911223344',
                'deliveryAddress' => 'Dirección santa rosa de huara manzana D sitio 29 iquique',
                'orderType' => 'DELIVERY',
                'paymentMethod' => 'CASH',
                'items' => [['publicId' => $product->public_id, 'quantity' => 2]],
            ])->assertCreated();

        // Subtotal 10000 + 19% tax (1900) + 1500 flat delivery = 13400
        $this->assertEquals(13400.0, $orderRes->json('order.total'));

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/customer/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/customer/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.totalOrders', 1);
    }

    public function test_admin_can_manage_settings_catalog_inventory_kds_pos_and_branches(): void
    {
        AppSettings::create(SettingsDefaults::defaultAttributes());
        $token = $this->createAdminAndToken();
        $headers = ['Authorization' => "Bearer {$token}"];

        // Update settings from admin dashboard
        $this->withHeaders($headers)
            ->putJson('/api/admin/settings', [
                'siteName' => 'Kabob Places Iquique',
                'taxPercentage' => 10,
                'deliveryFlatFee' => 1000,
                'themeConfig' => [
                    'primaryColor' => '#ef4444',
                    'secondaryColor' => '#f97316',
                    'fontFamily' => 'outfit',
                    'borderRadius' => 20,
                    'glassmorphIntensity' => 60,
                ],
                'homepageCms' => [
                    'enabledSections' => [
                        'testimonials' => false,
                        'featured' => true,
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.siteName', 'Kabob Places Iquique')
            ->assertJsonPath('data.themeConfig.primaryColor', '#ef4444');

        // Confirm public endpoint reflects updated admin settings
        $this->getJson('/api/settings/public')
            ->assertOk()
            ->assertJsonPath('data.siteName', 'Kabob Places Iquique')
            ->assertJsonPath('data.taxPercentage', 10)
            ->assertJsonPath('data.homepageCms.enabledSections.testimonials', false);

        // Catalog + Inventory recipe deduction
        $catRes = $this->withHeaders($headers)->postJson('/api/admin/categories', [
            'name' => 'Kabobs Especiales',
            'slug' => 'kabobs-especiales',
            'icon' => '🥙',
        ])->assertCreated();
        $catId = $catRes->json('category.id');

        $prodRes = $this->withHeaders($headers)->postJson('/api/admin/products', [
            'publicId' => 'kp-01',
            'slug' => 'beef-doner-kabob',
            'name' => 'Beef Doner Kabob',
            'price' => 6500,
            'categoryId' => $catId,
            'isFeatured' => true,
        ])->assertCreated();
        $prodId = $prodRes->json('product.id');

        $ingRes = $this->withHeaders($headers)->postJson('/api/admin/inventory/ingredients', [
            'name' => 'Carne de Res',
            'slug' => 'carne-de-res',
            'unit' => 'KG',
            'currentQty' => 10,
            'minQty' => 2,
            'isCore' => true,
        ])->assertCreated();
        $ingId = $ingRes->json('ingredient.id');

        $this->withHeaders($headers)->postJson('/api/admin/inventory/recipes', [
            'productId' => $prodId,
            'ingredientId' => $ingId,
            'quantity' => 0.5,
        ])->assertOk();

        // POS Order deducts recipe inventory
        $posRes = $this->withHeaders($headers)->postJson('/api/admin/pos/orders', [
            'customerName' => 'Cliente Local',
            'customerPhone' => '+56991030440',
            'orderType' => 'DINE_IN',
            'tableNumber' => 'Mesa 4',
            'paymentMethod' => 'CARD',
            'items' => [['publicId' => 'kp-01', 'quantity' => 2]],
        ])->assertCreated();
        $orderId = $posRes->json('order.id');

        $this->assertEquals(9.0, (float) Ingredient::find($ingId)->current_qty);

        // Advance order through KDS / Status + Analytics check
        $this->withHeaders($headers)->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'CONFIRMED',
        ])->assertOk();

        $this->withHeaders($headers)->patchJson('/api/admin/kds/bulk-advance', [
            'orderIds' => [$orderId],
        ])->assertOk()->assertJsonPath('updatedCount', 1);

        $this->withHeaders($headers)->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'COMPLETED',
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.totalOrders', 1);

        $this->withHeaders($headers)->getJson('/api/admin/analytics/sales')
            ->assertOk()
            ->assertJsonPath('summary.completedOrders', 1);

        // Branch & Staff
        $this->withHeaders($headers)->postJson('/api/admin/branch-staff/branches', [
            'code' => 'IQQ-02',
            'name' => 'Iquique Playa Brava',
            'address' => 'Av. Arturo Prat, Iquique',
            'phone' => '+56991030440',
        ])->assertCreated();

        // Coupon & Marketing
        $this->withHeaders($headers)->postJson('/api/admin/marketing/coupons', [
            'code' => 'IQUIQUE10',
            'discountType' => 'PERCENTAGE',
            'discountValue' => 10,
            'minOrderValue' => 1000,
        ])->assertCreated();

        $this->postJson('/api/marketing/validate-coupon', [
            'code' => 'IQUIQUE10',
            'subtotal' => 5000,
        ])->assertOk()->assertJsonPath('discountAmount', 500);
    }
}

