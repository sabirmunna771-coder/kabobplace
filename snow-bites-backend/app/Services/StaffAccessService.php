<?php

namespace App\Services;

use App\Models\RolePermissionConfig;
use App\Models\StaffActivityLog;
use App\Models\StaffMember;
use App\Models\User;

class StaffAccessService
{
    public const PERMISSION_KEYS = [
        'MANAGE_BRANCH_PROFILE',
        'MANAGE_STAFF',
        'VIEW_BRANCH_ANALYTICS',
        'MANAGE_BRANCH_INVENTORY',
        'UPDATE_ORDER_STATUS',
        'VIEW_RIDER_PERFORMANCE',
        'MANAGE_MENU',
        'MANAGE_PROMOTIONS',
        'VIEW_ACTIVITY_LOGS',
        'MANAGE_ROLE_PERMISSIONS',
    ];

    public const PERMISSION_LABELS = [
        'MANAGE_BRANCH_PROFILE' => 'Manage branch profile',
        'MANAGE_STAFF' => 'Manage staff',
        'VIEW_BRANCH_ANALYTICS' => 'View branch analytics',
        'MANAGE_BRANCH_INVENTORY' => 'Manage branch inventory',
        'UPDATE_ORDER_STATUS' => 'Update order status',
        'VIEW_RIDER_PERFORMANCE' => 'View rider performance',
        'MANAGE_MENU' => 'Manage menu',
        'MANAGE_PROMOTIONS' => 'Manage promotions',
        'VIEW_ACTIVITY_LOGS' => 'View activity logs',
        'MANAGE_ROLE_PERMISSIONS' => 'Manage role permissions',
    ];

    public const DEFAULT_ROLE_PERMISSIONS = [
        'SUPER_ADMIN' => self::PERMISSION_KEYS,
        'BRANCH_MANAGER' => [
            'MANAGE_BRANCH_PROFILE',
            'MANAGE_STAFF',
            'VIEW_BRANCH_ANALYTICS',
            'MANAGE_BRANCH_INVENTORY',
            'UPDATE_ORDER_STATUS',
            'VIEW_RIDER_PERFORMANCE',
            'MANAGE_MENU',
            'VIEW_ACTIVITY_LOGS',
        ],
        'KITCHEN_STAFF' => [
            'UPDATE_ORDER_STATUS',
            'VIEW_BRANCH_ANALYTICS',
            'VIEW_ACTIVITY_LOGS',
        ],
        'DELIVERY_RIDER' => [
            'UPDATE_ORDER_STATUS',
            'VIEW_RIDER_PERFORMANCE',
        ],
    ];

    public const STAFF_ROLES = [
        'SUPER_ADMIN',
        'BRANCH_MANAGER',
        'KITCHEN_STAFF',
        'DELIVERY_RIDER',
    ];

    public function normalizePermissions(mixed $rawPermissions, string $fallbackRole): array
    {
        if (! is_array($rawPermissions)) {
            return self::DEFAULT_ROLE_PERMISSIONS[$fallbackRole] ?? [];
        }

        $filtered = array_values(array_unique(array_filter(
            $rawPermissions,
            fn ($item): bool => is_string($item) && in_array($item, self::PERMISSION_KEYS, true),
        )));

        if ($filtered === []) {
            return self::DEFAULT_ROLE_PERMISSIONS[$fallbackRole] ?? [];
        }

        return $filtered;
    }

    public function getRolePermissionMap(): array
    {
        $map = self::DEFAULT_ROLE_PERMISSIONS;
        $configs = RolePermissionConfig::all();

        foreach ($configs as $config) {
            $map[$config->role] = $this->normalizePermissions($config->permissions, $config->role);
        }

        return $map;
    }

    public function getPermissionsForRole(string $role): array
    {
        $map = $this->getRolePermissionMap();

        return $map[$role] ?? (self::DEFAULT_ROLE_PERMISSIONS[$role] ?? []);
    }

    public function upsertRolePermissions(string $role, array $permissions): array
    {
        $normalized = array_values(array_unique(array_filter(
            $permissions,
            fn ($item): bool => is_string($item) && in_array($item, self::PERMISSION_KEYS, true),
        )));

        RolePermissionConfig::updateOrCreate(
            ['role' => $role],
            ['permissions' => $normalized],
        );

        return $normalized;
    }

    public function getRequestStaffAccess(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $staffMember = StaffMember::where('user_id', $user->id)->first();
        if ($staffMember) {
            return [
                'staffMemberId' => $staffMember->id,
                'branchId' => $staffMember->branch_id,
                'role' => $staffMember->role,
                'permissions' => $this->normalizePermissions($staffMember->permissions, $staffMember->role),
            ];
        }

        if ($user->role === 'ADMIN') {
            return [
                'staffMemberId' => null,
                'branchId' => null,
                'role' => 'SUPER_ADMIN',
                'permissions' => $this->getPermissionsForRole('SUPER_ADMIN'),
            ];
        }

        return null;
    }

    public function getActorBranchId(?int $userId): ?int
    {
        if (! $userId) {
            return null;
        }

        return StaffMember::where('user_id', $userId)->value('branch_id');
    }

    public function appendStaffActivityLog(array $input): void
    {
        $requestUserId = $input['requestUserId'] ?? null;
        $actorStaffMemberId = $requestUserId
            ? StaffMember::where('user_id', $requestUserId)->value('id')
            : null;

        StaffActivityLog::create([
            'branch_id' => $input['branchId'] ?? null,
            'staff_member_id' => $actorStaffMemberId,
            'action' => $input['action'],
            'entity_type' => $input['entityType'] ?? null,
            'entity_id' => isset($input['entityId']) ? (string) $input['entityId'] : null,
            'metadata' => $input['metadata'] ?? null,
            'created_at' => now(),
        ]);
    }
}

