<?php

use App\Http\Controllers\Api\AdminInventoryController;
use App\Http\Controllers\Api\AdminOperationsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchStaffController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MarketingController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth.jwt')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
        Route::patch('/profile/password', [AuthController::class, 'changePassword']);
    });
});

// Public Storefront Routes
Route::get('/settings/public', [PublicController::class, 'settings']);
Route::get('/branches/public', [PublicController::class, 'branches']);
Route::get('/categories', [PublicController::class, 'categories']);
Route::get('/products', [PublicController::class, 'products']);
Route::get('/products/{publicId}', [PublicController::class, 'showProduct']);
Route::get('/deals', [PublicController::class, 'deals']);
Route::get('/marketing/content', [MarketingController::class, 'publicMarketingContent']);
Route::post('/marketing/validate-coupon', [MarketingController::class, 'validateCoupon']);
Route::post('/reviews', [MarketingController::class, 'submitPublicReview']);
Route::post('/orders', [PublicController::class, 'createOrder'])->middleware('auth.jwt.optional');

// Customer Portal Routes
Route::prefix('customer')->middleware('auth.jwt')->group(function (): void {
    Route::get('/dashboard/stats', [CustomerController::class, 'dashboardStats']);
    Route::get('/orders', [CustomerController::class, 'orders']);
    Route::get('/orders/current', [CustomerController::class, 'currentOrder']);
    Route::get('/orders/{orderId}', [CustomerController::class, 'orderDetails']);
    Route::post('/orders/{orderId}/reorder', [CustomerController::class, 'reorder']);
    Route::get('/addresses', [CustomerController::class, 'addresses']);
    Route::post('/addresses', [CustomerController::class, 'createAddress']);
    Route::put('/addresses/{addressId}', [CustomerController::class, 'updateAddress']);
    Route::delete('/addresses/{addressId}', [CustomerController::class, 'deleteAddress']);
});

// Admin Dashboard Routes
Route::prefix('admin')->middleware(['auth.jwt', 'admin.only'])->group(function (): void {
    Route::get('/dashboard', [AdminOperationsController::class, 'dashboard']);
    Route::get('/analytics/sales', [AdminOperationsController::class, 'salesAnalytics']);

    // Marketing
    Route::get('/marketing/customers', [MarketingController::class, 'listCustomerProfiles']);
    Route::get('/marketing/coupons', [MarketingController::class, 'listCoupons']);
    Route::post('/marketing/coupons', [MarketingController::class, 'createCoupon']);
    Route::put('/marketing/coupons/{id}', [MarketingController::class, 'updateCoupon']);
    Route::delete('/marketing/coupons/{id}', [MarketingController::class, 'deleteCoupon']);
    Route::get('/marketing/flash-sales', [MarketingController::class, 'listFlashSales']);
    Route::post('/marketing/flash-sales', [MarketingController::class, 'createFlashSale']);
    Route::put('/marketing/flash-sales/{id}', [MarketingController::class, 'updateFlashSale']);
    Route::get('/marketing/notifications', [MarketingController::class, 'listNotifications']);
    Route::post('/marketing/notifications', [MarketingController::class, 'createNotification']);
    Route::put('/marketing/notifications/{id}', [MarketingController::class, 'updateNotification']);
    Route::delete('/marketing/notifications/{id}', [MarketingController::class, 'deleteNotification']);
    Route::get('/marketing/reviews', [MarketingController::class, 'listReviews']);
    Route::patch('/marketing/reviews/{id}/status', [MarketingController::class, 'moderateReview']);
    Route::get('/marketing/banners', [MarketingController::class, 'listHeroBanners']);
    Route::post('/marketing/banners', [MarketingController::class, 'createHeroBanner']);
    Route::put('/marketing/banners/{id}', [MarketingController::class, 'updateHeroBanner']);
    Route::delete('/marketing/banners/{id}', [MarketingController::class, 'deleteHeroBanner']);
    Route::get('/marketing/announcements', [MarketingController::class, 'listAnnouncements']);
    Route::post('/marketing/announcements', [MarketingController::class, 'createAnnouncement']);
    Route::put('/marketing/announcements/{id}', [MarketingController::class, 'updateAnnouncement']);
    Route::delete('/marketing/announcements/{id}', [MarketingController::class, 'deleteAnnouncement']);

    // Orders, KDS & POS
    Route::get('/orders', [AdminOperationsController::class, 'listOrders']);
    Route::get('/orders/summary', [AdminOperationsController::class, 'ordersSummary']);
    Route::get('/orders/export.csv', [AdminOperationsController::class, 'exportOrdersCsv']);
    Route::get('/kds/overview', [AdminOperationsController::class, 'kdsOverview']);
    Route::post('/orders', [AdminOperationsController::class, 'createManualOrder']);
    Route::post('/pos/orders', [AdminOperationsController::class, 'createPosOrder']);
    Route::get('/pos/orders', [AdminOperationsController::class, 'listPosOrders']);
    Route::patch('/orders/bulk-status', [AdminOperationsController::class, 'bulkUpdateOrderStatus'])->middleware('staff.permission:UPDATE_ORDER_STATUS');
    Route::patch('/kds/bulk-advance', [AdminOperationsController::class, 'bulkAdvanceKdsOrders'])->middleware('staff.permission:UPDATE_ORDER_STATUS');
    Route::patch('/orders/{id}/status', [AdminOperationsController::class, 'updateOrderStatus'])->middleware('staff.permission:UPDATE_ORDER_STATUS');
    Route::get('/orders/{id}/details', [AdminOperationsController::class, 'getOrderDetails']);
    Route::patch('/orders/{id}/assign-rider', [AdminOperationsController::class, 'assignRider']);

    // Riders
    Route::get('/riders', [AdminOperationsController::class, 'listRiders']);
    Route::get('/riders/summary', [AdminOperationsController::class, 'ridersSummary']);
    Route::post('/riders', [AdminOperationsController::class, 'createRider']);
    Route::put('/riders/{id}', [AdminOperationsController::class, 'updateRider']);
    Route::delete('/riders/{id}', [AdminOperationsController::class, 'deleteRider']);
    Route::patch('/riders/{id}/availability', [AdminOperationsController::class, 'updateRiderAvailability']);

    // Products, Modifiers, Deals & Categories
    Route::get('/products', [AdminOperationsController::class, 'listProducts']);
    Route::post('/products', [AdminOperationsController::class, 'createProduct'])->middleware('staff.permission:MANAGE_MENU');
    Route::patch('/products/bulk-price', [AdminOperationsController::class, 'bulkUpdatePricing'])->middleware('staff.permission:MANAGE_MENU');
    Route::post('/products/modifiers', [AdminOperationsController::class, 'createModifier'])->middleware('staff.permission:MANAGE_MENU');
    Route::put('/products/modifiers/{id}', [AdminOperationsController::class, 'updateModifier'])->middleware('staff.permission:MANAGE_MENU');
    Route::delete('/products/modifiers/{id}', [AdminOperationsController::class, 'deleteModifier'])->middleware('staff.permission:MANAGE_MENU');
    Route::put('/products/{id}', [AdminOperationsController::class, 'updateProduct'])->middleware('staff.permission:MANAGE_MENU');
    Route::delete('/products/{id}', [AdminOperationsController::class, 'deleteProduct'])->middleware('staff.permission:MANAGE_MENU');

    Route::get('/deals', [AdminOperationsController::class, 'listDeals']);
    Route::post('/deals', [AdminOperationsController::class, 'createDeal'])->middleware('staff.permission:MANAGE_MENU');
    Route::put('/deals/{id}', [AdminOperationsController::class, 'updateDeal'])->middleware('staff.permission:MANAGE_MENU');
    Route::delete('/deals/{id}', [AdminOperationsController::class, 'deleteDeal'])->middleware('staff.permission:MANAGE_MENU');

    Route::get('/categories', [AdminOperationsController::class, 'listCategories']);
    Route::post('/categories', [AdminOperationsController::class, 'createCategory'])->middleware('staff.permission:MANAGE_MENU');
    Route::put('/categories/{id}', [AdminOperationsController::class, 'updateCategory'])->middleware('staff.permission:MANAGE_MENU');
    Route::delete('/categories/{id}', [AdminOperationsController::class, 'deleteCategory'])->middleware('staff.permission:MANAGE_MENU');

    // Inventory & Supply Chain
    Route::get('/inventory/ingredients', [AdminInventoryController::class, 'listIngredients']);
    Route::post('/inventory/ingredients', [AdminInventoryController::class, 'createIngredient']);
    Route::put('/inventory/ingredients/{id}', [AdminInventoryController::class, 'updateIngredient']);
    Route::post('/inventory/ingredients/{id}/quick-add', [AdminInventoryController::class, 'quickAddStock']);
    Route::post('/inventory/ingredients/{id}/waste', [AdminInventoryController::class, 'createWasteLog']);

    Route::get('/inventory/recipes', [AdminInventoryController::class, 'listRecipeLinks']);
    Route::post('/inventory/recipes', [AdminInventoryController::class, 'upsertRecipeLink']);
    Route::delete('/inventory/recipes/{id}', [AdminInventoryController::class, 'deleteRecipeLink']);

    Route::get('/inventory/vendors', [AdminInventoryController::class, 'listVendors']);
    Route::post('/inventory/vendors', [AdminInventoryController::class, 'createVendor']);
    Route::put('/inventory/vendors/{id}', [AdminInventoryController::class, 'updateVendor']);
    Route::post('/inventory/vendors/{id}/supplies', [AdminInventoryController::class, 'addVendorSupply']);
    Route::delete('/inventory/vendor-supplies/{id}', [AdminInventoryController::class, 'deleteVendorSupply']);

    Route::get('/inventory/restock-logs', [AdminInventoryController::class, 'listRestockLogs']);
    Route::get('/inventory/waste-logs', [AdminInventoryController::class, 'listWasteLogs']);

    // Branch & Staff Management
    Route::get('/branch-staff/permissions', [BranchStaffController::class, 'listRolePermissions'])->middleware('staff.permission:MANAGE_ROLE_PERMISSIONS');
    Route::put('/branch-staff/permissions/{role}', [BranchStaffController::class, 'updateRolePermissions'])->middleware('staff.permission:MANAGE_ROLE_PERMISSIONS');

    Route::get('/branch-staff/branches', [BranchStaffController::class, 'listBranches']);
    Route::post('/branch-staff/branches', [BranchStaffController::class, 'createBranch'])->middleware('staff.permission:MANAGE_BRANCH_PROFILE');
    Route::put('/branch-staff/branches/{id}', [BranchStaffController::class, 'updateBranch'])->middleware('staff.permission:MANAGE_BRANCH_PROFILE');
    Route::delete('/branch-staff/branches/{id}', [BranchStaffController::class, 'deleteBranch'])->middleware('staff.role:SUPER_ADMIN');
    Route::patch('/branch-staff/branches/{id}/status', [BranchStaffController::class, 'updateBranchStatus'])->middleware('staff.permission:MANAGE_BRANCH_PROFILE');

    Route::get('/branch-staff/staff', [BranchStaffController::class, 'listStaffMembers']);
    Route::post('/branch-staff/staff', [BranchStaffController::class, 'createStaffMember'])->middleware('staff.permission:MANAGE_STAFF');
    Route::put('/branch-staff/staff/{id}', [BranchStaffController::class, 'updateStaffMember'])->middleware('staff.permission:MANAGE_STAFF');
    Route::delete('/branch-staff/staff/{id}', [BranchStaffController::class, 'deleteStaffMember'])->middleware('staff.permission:MANAGE_STAFF');
    Route::patch('/branch-staff/staff/{id}/active', [BranchStaffController::class, 'updateStaffMemberActiveStatus'])->middleware('staff.permission:MANAGE_STAFF');

    Route::get('/branch-staff/inventory', [BranchStaffController::class, 'listBranchInventory'])->middleware('staff.permission:MANAGE_BRANCH_INVENTORY');
    Route::put('/branch-staff/branches/{branchId}/inventory/{ingredientId}', [BranchStaffController::class, 'upsertBranchIngredientStock'])->middleware('staff.permission:MANAGE_BRANCH_INVENTORY');

    Route::get('/branch-staff/activity-logs', [BranchStaffController::class, 'listStaffActivityLogs'])->middleware('staff.permission:VIEW_ACTIVITY_LOGS');
    Route::get('/branch-staff/rider-performance', [BranchStaffController::class, 'getRiderPerformance'])->middleware('staff.permission:VIEW_RIDER_PERFORMANCE');

    // Global Settings & CMS
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
});

