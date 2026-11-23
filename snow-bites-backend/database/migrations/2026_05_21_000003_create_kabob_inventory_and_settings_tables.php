<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('unit', 32);
            $table->decimal('current_qty', 10, 3);
            $table->decimal('min_qty', 10, 3);
            $table->boolean('is_core')->default(true);
            $table->timestamps();
        });

        Schema::create('product_recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->timestamps();

            $table->unique(['product_id', 'ingredient_id']);
            $table->index('product_id');
            $table->index('ingredient_id');
        });

        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('name');
        });

        Schema::create('vendor_supplies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->string('item_name')->nullable();
            $table->timestamps();

            $table->unique(['vendor_id', 'ingredient_id']);
            $table->index('vendor_id');
            $table->index('ingredient_id');
        });

        Schema::create('inventory_restock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['ingredient_id', 'created_at']);
            $table->index('vendor_id');
        });

        Schema::create('inventory_waste_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('reason')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['ingredient_id', 'created_at']);
        });

        Schema::create('branch_ingredient_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('current_qty', 10, 3);
            $table->decimal('min_qty', 10, 3)->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'ingredient_id']);
            $table->index('branch_id');
            $table->index('ingredient_id');
        });

        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_status', 32)->default('OPEN');
            $table->json('business_hours')->nullable();
            $table->boolean('enable_auto_shutdown')->default(true);
            $table->boolean('maintenance_mode')->default(false);

            $table->decimal('tax_percentage', 5, 2)->default(19);
            $table->string('delivery_charge_type', 32)->default('FLAT');
            $table->decimal('delivery_flat_fee', 10, 2)->default(1500);
            $table->decimal('delivery_per_km_charge', 10, 2)->default(500);
            $table->string('currency_symbol', 16)->default('$');
            $table->integer('decimal_rounding')->default(0);

            $table->string('payment_methods')->default('CASH,CARD,MOBILE_WALLET');
            $table->text('map_api_key')->nullable();
            $table->text('sms_gateway_api_key')->nullable();
            $table->text('payment_gateway_api_key')->nullable();

            $table->string('site_name')->default('Kabob Places');
            $table->string('site_title')->default('Kabob Places — Kabobs & Comida Rápida en Iquique');
            $table->longText('site_logo')->nullable();
            $table->longText('site_favicon')->nullable();
            $table->string('site_phone', 32)->nullable();
            $table->string('site_email', 100)->nullable();
            $table->text('site_address')->nullable();
            $table->string('contact_hours', 160)->nullable();
            $table->text('map_embed_url')->nullable();
            $table->text('footer_tagline')->nullable();

            $table->string('seo_meta_title', 160)->nullable();
            $table->string('seo_meta_description', 160)->nullable();

            $table->string('facebook_url', 255)->nullable();
            $table->string('instagram_url', 255)->nullable();
            $table->string('whatsapp_number', 32)->nullable();

            $table->string('default_language', 10)->default('es');
            $table->json('enabled_languages')->nullable();

            $table->json('theme_config')->nullable();
            $table->json('logo_suite')->nullable();
            $table->json('homepage_cms')->nullable();
            $table->json('ui_preferences')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('branch_ingredient_stocks');
        Schema::dropIfExists('inventory_waste_logs');
        Schema::dropIfExists('inventory_restock_logs');
        Schema::dropIfExists('vendor_supplies');
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('product_recipe_items');
        Schema::dropIfExists('ingredients');
    }
};

