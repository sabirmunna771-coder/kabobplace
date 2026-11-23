<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchIngredientStock;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Rider;
use App\Models\StaffActivityLog;
use App\Models\StaffMember;
use App\Models\User;
use App\Services\StaffAccessService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchStaffController extends Controller
{
    public function __construct(
        private readonly StaffAccessService $staffAccess,
        private readonly ApiSerializer $serializer,
    ) {}

    public function listRolePermissions(): JsonResponse
    {
        $permissions = array_map(
            fn (string $key): array => [
                'key' => $key,
                'label' => StaffAccessService::PERMISSION_LABELS[$key],
            ],
            StaffAccessService::PERMISSION_KEYS,
        );

        return response()->json([
            'permissions' => $permissions,
            'rolePermissions' => $this->staffAccess->getRolePermissionMap(),
            'defaults' => StaffAccessService::DEFAULT_ROLE_PERMISSIONS,
        ]);
    }

    public function updateRolePermissions(Request $request, string $role): JsonResponse
    {
        if (! in_array($role, StaffAccessService::STAFF_ROLES, true)) {
            throw new ApiException(400, 'Invalid staff role.');
        }

        $data = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'in:'.implode(',', StaffAccessService::PERMISSION_KEYS)],
        ]);

        $permissions = $this->staffAccess->upsertRolePermissions($role, $data['permissions']);

        StaffMember::where('role', $role)->update(['permissions' => $permissions]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'action' => 'ROLE_PERMISSIONS_UPDATED',
            'entityType' => 'RolePermissionConfig',
            'entityId' => $role,
            'metadata' => ['role' => $role, 'permissions' => $permissions],
        ]);

        return response()->json([
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function listBranches(): JsonResponse
    {
        $branches = Branch::with('manager')
            ->withCount(['riders', 'staffMembers', 'stocks'])
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get();

        return response()->json([
            'branches' => $branches->map(fn (Branch $b) => $this->serializer->branch($b))->values()->all(),
        ]);
    }

    public function createBranch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'min:2', 'max:50', 'regex:/^[A-Z0-9_-]+$/'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'address' => ['nullable', 'string', 'max:250'],
            'phone' => ['nullable', 'string', 'max:32'],
            'managerStaffId' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:ACTIVE,TEMPORARILY_CLOSED'],
            'isPrimary' => ['nullable', 'boolean'],
        ]);

        if (! empty($data['managerStaffId']) && ! StaffMember::where('id', $data['managerStaffId'])->exists()) {
            throw new ApiException(404, 'Assigned manager not found.');
        }

        if (Branch::where('code', trim($data['code']))->exists()) {
            throw new ApiException(409, 'Branch code already exists.');
        }

        $branch = Branch::create([
            'code' => trim($data['code']),
            'name' => trim($data['name']),
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'manager_staff_id' => $data['managerStaffId'] ?? null,
            'status' => $data['status'] ?? 'ACTIVE',
            'is_primary' => (bool) ($data['isPrimary'] ?? false),
        ]);

        if ($branch->is_primary) {
            Branch::where('id', '!=', $branch->id)->update(['is_primary' => false]);
        }

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $branch->id,
            'action' => 'BRANCH_CREATED',
            'entityType' => 'Branch',
            'entityId' => (string) $branch->id,
            'metadata' => ['code' => $branch->code, 'name' => $branch->name],
        ]);

        return response()->json([
            'branch' => $this->serializer->branch($branch->load('manager')),
        ], 201);
    }

    public function updateBranch(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'min:2', 'max:50', 'regex:/^[A-Z0-9_-]+$/'],
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'address' => ['nullable', 'string', 'max:250'],
            'phone' => ['nullable', 'string', 'max:32'],
            'managerStaffId' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:ACTIVE,TEMPORARILY_CLOSED'],
            'isPrimary' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['managerStaffId']) && ! StaffMember::where('id', $data['managerStaffId'])->exists()) {
            throw new ApiException(404, 'Assigned manager not found.');
        }

        $update = [];
        if (array_key_exists('code', $data)) {
            $update['code'] = trim($data['code']);
        }
        if (array_key_exists('name', $data)) {
            $update['name'] = trim($data['name']);
        }
        if (array_key_exists('address', $data)) {
            $update['address'] = $data['address'];
        }
        if (array_key_exists('phone', $data)) {
            $update['phone'] = $data['phone'];
        }
        if (array_key_exists('managerStaffId', $data)) {
            $update['manager_staff_id'] = $data['managerStaffId'];
        }
        if (array_key_exists('status', $data)) {
            $update['status'] = $data['status'];
        }
        if (array_key_exists('isPrimary', $data)) {
            $update['is_primary'] = (bool) $data['isPrimary'];
        }

        $branch->update($update);

        if ($branch->is_primary) {
            Branch::where('id', '!=', $branch->id)->update(['is_primary' => false]);
        }

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $branch->id,
            'action' => 'BRANCH_UPDATED',
            'entityType' => 'Branch',
            'entityId' => (string) $branch->id,
            'metadata' => $data,
        ]);

        return response()->json([
            'branch' => $this->serializer->branch($branch->fresh('manager')),
        ]);
    }

    public function updateBranchStatus(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $data = $request->validate([
            'status' => ['required', 'in:ACTIVE,TEMPORARILY_CLOSED'],
        ]);

        $fromStatus = $branch->status;
        $branch->update(['status' => $data['status']]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $branch->id,
            'action' => 'BRANCH_STATUS_UPDATED',
            'entityType' => 'Branch',
            'entityId' => (string) $branch->id,
            'metadata' => ['from' => $fromStatus, 'to' => $data['status']],
        ]);

        return response()->json([
            'branch' => $this->serializer->branch($branch->fresh('manager')),
        ]);
    }

    public function deleteBranch(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $meta = ['code' => $branch->code, 'name' => $branch->name];
        $branch->delete();

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => null,
            'action' => 'BRANCH_DELETED',
            'entityType' => 'Branch',
            'entityId' => (string) $id,
            'metadata' => $meta,
        ]);

        return response()->json([
            'message' => 'Branch deleted successfully.',
        ]);
    }

    public function listStaffMembers(Request $request): JsonResponse
    {
        $query = StaffMember::with(['branch', 'user']);

        if ($request->filled('branchId')) {
            $query->where('branch_id', (int) $request->query('branchId'));
        }
        if ($request->filled('role')) {
            $query->where('role', (string) $request->query('role'));
        }
        if ($request->has('isActive')) {
            $val = $request->query('isActive');
            if ($val === 'true' || $val === '1') {
                $query->where('is_active', true);
            } elseif ($val === 'false' || $val === '0') {
                $query->where('is_active', false);
            }
        }
        if ($request->filled('search')) {
            $search = strtolower(trim((string) $request->query('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(COALESCE(email, \'\')) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(COALESCE(phone, \'\')) LIKE ?', ["%{$search}%"]);
            });
        }

        $staffMembers = $query->orderBy('role')->orderBy('full_name')->get();

        return response()->json([
            'staffMembers' => $staffMembers->map(fn (StaffMember $s) => $this->serializer->staffMember($s))->values()->all(),
        ]);
    }

    public function createStaffMember(Request $request): JsonResponse
    {
        $data = $request->validate([
            'userId' => ['nullable', 'integer', 'min:1'],
            'branchId' => ['nullable', 'integer', 'min:1'],
            'fullName' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['nullable', 'string', 'email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'profileImageUrl' => ['nullable', 'string', 'max:2000000'],
            'role' => ['required', 'in:'.implode(',', StaffAccessService::STAFF_ROLES)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'in:'.implode(',', StaffAccessService::PERMISSION_KEYS)],
            'isActive' => ['nullable', 'boolean'],
        ]);

        if (! empty($data['branchId']) && ! Branch::where('id', $data['branchId'])->exists()) {
            throw new ApiException(404, 'Branch not found.');
        }

        if (! empty($data['userId']) && ! User::where('id', $data['userId'])->exists()) {
            throw new ApiException(404, 'Linked user was not found.');
        }

        $permissions = ! empty($data['permissions'])
            ? array_values(array_unique($data['permissions']))
            : $this->staffAccess->getPermissionsForRole($data['role']);

        $staffMember = StaffMember::create([
            'user_id' => $data['userId'] ?? null,
            'branch_id' => $data['branchId'] ?? null,
            'full_name' => trim($data['fullName']),
            'email' => isset($data['email']) ? strtolower(trim($data['email'])) : null,
            'phone' => $data['phone'] ?? null,
            'profile_image_url' => $data['profileImageUrl'] ?? null,
            'role' => $data['role'],
            'permissions' => $permissions,
            'is_active' => $data['isActive'] ?? true,
        ]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $staffMember->branch_id,
            'action' => 'STAFF_MEMBER_CREATED',
            'entityType' => 'StaffMember',
            'entityId' => (string) $staffMember->id,
            'metadata' => ['role' => $staffMember->role, 'fullName' => $staffMember->full_name],
        ]);

        return response()->json([
            'staffMember' => $this->serializer->staffMember($staffMember->load(['branch', 'user'])),
        ], 201);
    }

    public function updateStaffMember(Request $request, int $id): JsonResponse
    {
        $staffMember = StaffMember::findOrFail($id);
        $data = $request->validate([
            'userId' => ['nullable', 'integer', 'min:1'],
            'branchId' => ['nullable', 'integer', 'min:1'],
            'fullName' => ['sometimes', 'string', 'min:2', 'max:120'],
            'email' => ['nullable', 'string', 'email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'profileImageUrl' => ['nullable', 'string', 'max:2000000'],
            'role' => ['sometimes', 'in:'.implode(',', StaffAccessService::STAFF_ROLES)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'in:'.implode(',', StaffAccessService::PERMISSION_KEYS)],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['branchId']) && ! Branch::where('id', $data['branchId'])->exists()) {
            throw new ApiException(404, 'Branch not found.');
        }

        if (! empty($data['userId']) && ! User::where('id', $data['userId'])->exists()) {
            throw new ApiException(404, 'Linked user was not found.');
        }

        $nextRole = $data['role'] ?? $staffMember->role;
        $nextPermissions = array_key_exists('permissions', $data)
            ? (! empty($data['permissions']) ? array_values(array_unique($data['permissions'])) : $this->staffAccess->getPermissionsForRole($nextRole))
            : $this->staffAccess->normalizePermissions($staffMember->permissions, $nextRole);

        $update = ['permissions' => $nextPermissions];
        if (array_key_exists('userId', $data)) {
            $update['user_id'] = $data['userId'];
        }
        if (array_key_exists('branchId', $data)) {
            $update['branch_id'] = $data['branchId'];
        }
        if (array_key_exists('fullName', $data)) {
            $update['full_name'] = trim($data['fullName']);
        }
        if (array_key_exists('email', $data)) {
            $update['email'] = $data['email'] ? strtolower(trim($data['email'])) : null;
        }
        if (array_key_exists('phone', $data)) {
            $update['phone'] = $data['phone'];
        }
        if (array_key_exists('profileImageUrl', $data)) {
            $update['profile_image_url'] = $data['profileImageUrl'];
        }
        if (array_key_exists('role', $data)) {
            $update['role'] = $data['role'];
        }
        if (array_key_exists('isActive', $data)) {
            $update['is_active'] = (bool) $data['isActive'];
        }

        $staffMember->update($update);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $staffMember->branch_id,
            'action' => 'STAFF_MEMBER_UPDATED',
            'entityType' => 'StaffMember',
            'entityId' => (string) $staffMember->id,
            'metadata' => $data,
        ]);

        return response()->json([
            'staffMember' => $this->serializer->staffMember($staffMember->fresh(['branch', 'user'])),
        ]);
    }

    public function updateStaffMemberActiveStatus(Request $request, int $id): JsonResponse
    {
        $staffMember = StaffMember::findOrFail($id);
        $data = $request->validate([
            'isActive' => ['required', 'boolean'],
        ]);

        $fromActive = (bool) $staffMember->is_active;
        $staffMember->update(['is_active' => (bool) $data['isActive']]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $staffMember->branch_id,
            'action' => 'STAFF_MEMBER_ACTIVE_STATUS_UPDATED',
            'entityType' => 'StaffMember',
            'entityId' => (string) $staffMember->id,
            'metadata' => ['from' => $fromActive, 'to' => (bool) $data['isActive']],
        ]);

        return response()->json([
            'staffMember' => $this->serializer->staffMember($staffMember->fresh(['branch', 'user'])),
        ]);
    }

    public function deleteStaffMember(Request $request, int $id): JsonResponse
    {
        $staffMember = StaffMember::findOrFail($id);
        Branch::where('manager_staff_id', $id)->update(['manager_staff_id' => null]);

        $meta = ['fullName' => $staffMember->full_name, 'role' => $staffMember->role];
        $branchId = $staffMember->branch_id;
        $staffMember->delete();

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $branchId,
            'action' => 'STAFF_MEMBER_DELETED',
            'entityType' => 'StaffMember',
            'entityId' => (string) $id,
            'metadata' => $meta,
        ]);

        return response()->json([
            'message' => 'Staff member deleted successfully.',
        ]);
    }

    public function listBranchInventory(Request $request): JsonResponse
    {
        if ($request->filled('branchId')) {
            $branchId = (int) $request->query('branchId');
            $branch = Branch::findOrFail($branchId);

            $ingredients = Ingredient::with(['branchStocks' => fn ($q) => $q->where('branch_id', $branchId)])
                ->orderBy('name')
                ->get();

            return response()->json([
                'branch' => $this->serializer->branch($branch),
                'inventory' => $ingredients->map(function (Ingredient $ingredient): array {
                    $stock = $ingredient->branchStocks->first();

                    return [
                        'ingredientId' => $ingredient->id,
                        'ingredientName' => $ingredient->name,
                        'ingredientSlug' => $ingredient->slug,
                        'unit' => $ingredient->unit,
                        'currentQty' => $stock ? (float) $stock->current_qty : 0.0,
                        'minQty' => $stock ? (float) $stock->min_qty : (float) $ingredient->min_qty,
                        'updatedAt' => $stock?->updated_at?->toISOString(),
                    ];
                })->values()->all(),
            ]);
        }

        $stocks = BranchIngredientStock::with(['branch', 'ingredient'])
            ->orderBy('branch_id')
            ->orderBy('ingredient_id')
            ->get();

        return response()->json([
            'inventory' => $stocks->map(fn (BranchIngredientStock $stock): array => [
                'id' => $stock->id,
                'branchId' => $stock->branch_id,
                'branchName' => $stock->branch?->name ?? '',
                'ingredientId' => $stock->ingredient_id,
                'ingredientName' => $stock->ingredient?->name ?? '',
                'ingredientSlug' => $stock->ingredient?->slug ?? '',
                'unit' => $stock->ingredient?->unit ?? 'KG',
                'currentQty' => (float) $stock->current_qty,
                'minQty' => (float) $stock->min_qty,
                'updatedAt' => $stock->updated_at?->toISOString(),
            ])->values()->all(),
        ]);
    }

    public function upsertBranchIngredientStock(Request $request, int $branchId, int $ingredientId): JsonResponse
    {
        Branch::findOrFail($branchId);
        $ingredient = Ingredient::findOrFail($ingredientId);

        $data = $request->validate([
            'currentQty' => ['required', 'numeric', 'min:0'],
            'minQty' => ['nullable', 'numeric', 'min:0'],
        ]);

        $stock = BranchIngredientStock::updateOrCreate(
            [
                'branch_id' => $branchId,
                'ingredient_id' => $ingredientId,
            ],
            [
                'current_qty' => round((float) $data['currentQty'], 3),
                'min_qty' => array_key_exists('minQty', $data) && $data['minQty'] !== null
                    ? round((float) $data['minQty'], 3)
                    : (float) $ingredient->min_qty,
            ],
        );

        $stock->load(['branch', 'ingredient']);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $branchId,
            'action' => 'BRANCH_STOCK_UPDATED',
            'entityType' => 'BranchIngredientStock',
            'entityId' => (string) $stock->id,
            'metadata' => [
                'ingredientId' => $ingredientId,
                'currentQty' => (float) $stock->current_qty,
                'minQty' => (float) $stock->min_qty,
            ],
        ]);

        return response()->json([
            'stock' => [
                'id' => $stock->id,
                'branchId' => $stock->branch_id,
                'branchName' => $stock->branch?->name ?? '',
                'ingredientId' => $stock->ingredient_id,
                'ingredientName' => $stock->ingredient?->name ?? '',
                'ingredientSlug' => $stock->ingredient?->slug ?? '',
                'unit' => $stock->ingredient?->unit ?? 'KG',
                'currentQty' => (float) $stock->current_qty,
                'minQty' => (float) $stock->min_qty,
                'updatedAt' => $stock->updated_at?->toISOString(),
            ],
        ]);
    }

    public function listStaffActivityLogs(Request $request): JsonResponse
    {
        $limit = max(1, min(200, (int) $request->query('limit', 80)));

        $query = StaffActivityLog::with(['branch', 'staffMember']);
        if ($request->filled('branchId')) {
            $query->where('branch_id', (int) $request->query('branchId'));
        }
        if ($request->filled('staffMemberId')) {
            $query->where('staff_member_id', (int) $request->query('staffMemberId'));
        }

        $logs = $query->orderByDesc('created_at')->limit($limit)->get();

        return response()->json([
            'logs' => $logs->map(fn (StaffActivityLog $log) => $this->serializer->staffActivityLog($log))->values()->all(),
        ]);
    }

    public function getRiderPerformance(Request $request): JsonResponse
    {
        $days = max(1, min(365, (int) $request->query('days', 30)));
        $branchId = $request->filled('branchId') ? (int) $request->query('branchId') : null;
        $since = now()->subDays($days);

        $riders = Rider::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('full_name')
            ->get();

        $riderIds = $riders->pluck('id')->all();

        $completedOrders = Order::with('assignedRider')
            ->where('status', 'COMPLETED')
            ->whereNotNull('assigned_rider_id')
            ->where('created_at', '>=', $since)
            ->get();

        $metrics = [];
        foreach ($completedOrders as $order) {
            if (! $order->assigned_rider_id || ! in_array($order->assigned_rider_id, $riderIds, true)) {
                continue;
            }
            if ($branchId && $order->assignedRider?->branch_id !== $branchId) {
                continue;
            }

            $duration = max(1, (int) round($order->created_at->diffInMinutes($order->updated_at)));
            $id = (int) $order->assigned_rider_id;
            $metrics[$id]['completedDeliveries'] = ($metrics[$id]['completedDeliveries'] ?? 0) + 1;
            $metrics[$id]['totalMinutes'] = ($metrics[$id]['totalMinutes'] ?? 0) + $duration;
        }

        $performance = $riders->map(function (Rider $rider) use ($metrics): array {
            $stat = $metrics[$rider->id] ?? ['completedDeliveries' => 0, 'totalMinutes' => 0];
            $deliveries = $stat['completedDeliveries'];
            $avgMinutes = $deliveries > 0 ? round($stat['totalMinutes'] / $deliveries, 1) : null;
            $onTimeRate = ($deliveries > 0 && $avgMinutes !== null && $avgMinutes > 0)
                ? round(max(0, min(100, (45 / $avgMinutes) * 100)), 1)
                : null;

            return [
                'riderId' => $rider->id,
                'fullName' => $rider->full_name,
                'phone' => $rider->phone,
                'vehicle' => $rider->vehicle,
                'availability' => $rider->availability,
                'branchId' => $rider->branch_id,
                'completedDeliveries' => $deliveries,
                'averageDeliveryMinutes' => $avgMinutes,
                'onTimeRate' => $onTimeRate,
            ];
        })->values()->all();

        return response()->json([
            'range' => ['days' => $days],
            'performance' => $performance,
        ]);
    }
}

