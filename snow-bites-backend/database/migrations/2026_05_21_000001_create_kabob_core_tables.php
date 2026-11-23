<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label');
            $table->string('street');
            $table->string('city');
            $table->string('state');
            $table->string('postal_code');
            $table->string('country')->default('Chile');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('status', 32)->default('ACTIVE');
            $table->boolean('is_primary')->default(false);
            $table->unsignedBigInteger('manager_staff_id')->nullable()->index();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('staff_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('full_name');
            $table->string('email')->nullable()->unique();
            $table->string('phone', 32)->nullable();
            $table->longText('profile_image_url')->nullable();
            $table->string('role', 32);
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('branch_id');
            $table->index('role');
            $table->index('is_active');
        });

        Schema::create('role_permission_configs', function (Blueprint $table) {
            $table->id();
            $table->string('role', 32)->unique();
            $table->json('permissions');
            $table->timestamps();
        });

        Schema::create('staff_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['branch_id', 'created_at']);
            $table->index(['staff_member_id', 'created_at']);
        });

        Schema::create('riders', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone', 32)->unique();
            $table->string('vehicle')->nullable();
            $table->longText('profile_image_url')->nullable();
            $table->string('availability', 32)->default('AVAILABLE');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            $table->index('availability');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riders');
        Schema::dropIfExists('staff_activity_logs');
        Schema::dropIfExists('role_permission_configs');
        Schema::dropIfExists('staff_members');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('addresses');
    }
};

