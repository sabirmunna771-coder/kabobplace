<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class SqlDumpImporter
{
    private const TABLE_MAP = [
        'user' => [
            'target' => 'users',
            'columns' => [
                'id' => 'id',
                'fullName' => 'full_name',
                'email' => 'email',
                'phone' => 'phone',
                'passwordHash' => 'password_hash',
                'role' => 'role',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'profile_picture_url' => 'profile_picture_url',
                'defaultAddressId' => 'default_address_id',
                'snowPoints' => 'snow_points',
                'totalSpent' => 'total_spent',
            ],
        ],
        'address' => [
            'target' => 'addresses',
            'columns' => [
                'id' => 'id',
                'userId' => 'user_id',
                'label' => 'label',
                'street' => 'street',
                'city' => 'city',
                'state' => 'state',
                'postalCode' => 'postal_code',
                'country' => 'country',
                'isDefault' => 'is_default',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_default'],
        ],
        'branch' => [
            'target' => 'branches',
            'columns' => [
                'id' => 'id',
                'code' => 'code',
                'name' => 'name',
                'address' => 'address',
                'phone' => 'phone',
                'status' => 'status',
                'isPrimary' => 'is_primary',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'managerStaffId' => 'manager_staff_id',
            ],
            'booleans' => ['is_primary'],
        ],
        'staffmember' => [
            'target' => 'staff_members',
            'columns' => [
                'id' => 'id',
                'userId' => 'user_id',
                'branchId' => 'branch_id',
                'fullName' => 'full_name',
                'email' => 'email',
                'phone' => 'phone',
                'role' => 'role',
                'permissions' => 'permissions',
                'isActive' => 'is_active',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'profileImageUrl' => 'profile_image_url',
            ],
            'booleans' => ['is_active'],
        ],
        'rolepermissionconfig' => [
            'target' => 'role_permission_configs',
            'columns' => [
                'id' => 'id',
                'role' => 'role',
                'permissions' => 'permissions',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'staffactivitylog' => [
            'target' => 'staff_activity_logs',
            'columns' => [
                'id' => 'id',
                'branchId' => 'branch_id',
                'staffMemberId' => 'staff_member_id',
                'action' => 'action',
                'entityType' => 'entity_type',
                'entityId' => 'entity_id',
                'metadata' => 'metadata',
                'createdAt' => 'created_at',
            ],
        ],
        'rider' => [
            'target' => 'riders',
            'columns' => [
                'id' => 'id',
                'fullName' => 'full_name',
                'phone' => 'phone',
                'vehicle' => 'vehicle',
                'availability' => 'availability',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'branchId' => 'branch_id',
                'profileImageUrl' => 'profile_image_url',
            ],
        ],
        'category' => [
            'target' => 'categories',
            'columns' => [
                'id' => 'id',
                'slug' => 'slug',
                'name' => 'name',
                'icon' => 'icon',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'product' => [
            'target' => 'products',
            'columns' => [
                'id' => 'id',
                'publicId' => 'public_id',
                'slug' => 'slug',
                'name' => 'name',
                'description' => 'description',
                'price' => 'price',
                'imageUrl' => 'image_url',
                'badge' => 'badge',
                'isFeatured' => 'is_featured',
                'isActive' => 'is_active',
                'categoryId' => 'category_id',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'badges' => 'badges',
                'isInStock' => 'is_in_stock',
                'bestSeller' => 'best_seller',
                'isSpicy' => 'is_spicy',
                'isVegetarian' => 'is_vegetarian',
            ],
            'booleans' => ['is_featured', 'is_active', 'is_in_stock', 'best_seller', 'is_spicy', 'is_vegetarian'],
        ],
        'productmodifier' => [
            'target' => 'product_modifiers',
            'columns' => [
                'id' => 'id',
                'productId' => 'product_id',
                'name' => 'name',
                'price' => 'price',
                'isActive' => 'is_active',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'deal' => [
            'target' => 'deals',
            'columns' => [
                'id' => 'id',
                'publicId' => 'public_id',
                'slug' => 'slug',
                'name' => 'name',
                'description' => 'description',
                'imageUrl' => 'image_url',
                'price' => 'price',
                'isActive' => 'is_active',
                'expiresAt' => 'expires_at',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'dealitem' => [
            'target' => 'deal_items',
            'columns' => [
                'id' => 'id',
                'dealId' => 'deal_id',
                'productId' => 'product_id',
                'quantity' => 'quantity',
            ],
        ],
        'coupon' => [
            'target' => 'coupons',
            'columns' => [
                'id' => 'id',
                'code' => 'code',
                'discountType' => 'discount_type',
                'discountValue' => 'discount_value',
                'minOrderValue' => 'min_order_value',
                'expiresAt' => 'expires_at',
                'usageLimit' => 'usage_limit',
                'usageCount' => 'usage_count',
                'isActive' => 'is_active',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'flashsale' => [
            'target' => 'flash_sales',
            'columns' => [
                'id' => 'id',
                'name' => 'name',
                'discountType' => 'discount_type',
                'discountValue' => 'discount_value',
                'startsAt' => 'starts_at',
                'endsAt' => 'ends_at',
                'isActive' => 'is_active',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'marketingnotification' => [
            'target' => 'marketing_notifications',
            'columns' => [
                'id' => 'id',
                'title' => 'title',
                'message' => 'message',
                'kind' => 'kind',
                'ctaLabel' => 'cta_label',
                'ctaHref' => 'cta_href',
                'isActive' => 'is_active',
                'expiresAt' => 'expires_at',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'review' => [
            'target' => 'reviews',
            'columns' => [
                'id' => 'id',
                'userId' => 'user_id',
                'customerName' => 'customer_name',
                'customerEmail' => 'customer_email',
                'rating' => 'rating',
                'comment' => 'comment',
                'status' => 'status',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'herobanner' => [
            'target' => 'hero_banners',
            'columns' => [
                'id' => 'id',
                'title' => 'title',
                'subtitle' => 'subtitle',
                'imageUrl' => 'image_url',
                'ctaLabel' => 'cta_label',
                'ctaHref' => 'cta_href',
                'isActive' => 'is_active',
                'sortOrder' => 'sort_order',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'announcementbar' => [
            'target' => 'announcement_bars',
            'columns' => [
                'id' => 'id',
                'text' => 'text',
                'ctaLabel' => 'cta_label',
                'ctaHref' => 'cta_href',
                'isActive' => 'is_active',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_active'],
        ],
        'order' => [
            'target' => 'orders',
            'columns' => [
                'id' => 'id',
                'orderNumber' => 'order_number',
                'status' => 'status',
                'customerName' => 'customer_name',
                'customerEmail' => 'customer_email',
                'customerPhone' => 'customer_phone',
                'deliveryAddress' => 'delivery_address',
                'notes' => 'notes',
                'subtotal' => 'subtotal',
                'total' => 'total',
                'source' => 'source',
                'customerId' => 'customer_id',
                'handledById' => 'handled_by_id',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
                'assignedRiderId' => 'assigned_rider_id',
                'couponCode' => 'coupon_code',
                'couponId' => 'coupon_id',
                'discountAmount' => 'discount_amount',
                'discountLabel' => 'discount_label',
                'orderType' => 'order_type',
                'paymentMethod' => 'payment_method',
                'tableNumber' => 'table_number',
            ],
        ],
        'orderitem' => [
            'target' => 'order_items',
            'columns' => [
                'id' => 'id',
                'orderId' => 'order_id',
                'productId' => 'product_id',
                'productName' => 'product_name',
                'productPrice' => 'product_price',
                'quantity' => 'quantity',
                'lineTotal' => 'line_total',
            ],
        ],
        'orderstatushistory' => [
            'target' => 'order_status_histories',
            'columns' => [
                'id' => 'id',
                'orderId' => 'order_id',
                'fromStatus' => 'from_status',
                'toStatus' => 'to_status',
                'note' => 'note',
                'changedById' => 'changed_by_id',
                'changedAt' => 'changed_at',
            ],
        ],
        'ingredient' => [
            'target' => 'ingredients',
            'columns' => [
                'id' => 'id',
                'name' => 'name',
                'slug' => 'slug',
                'unit' => 'unit',
                'currentQty' => 'current_qty',
                'minQty' => 'min_qty',
                'isCore' => 'is_core',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
            'booleans' => ['is_core'],
        ],
        'productrecipeitem' => [
            'target' => 'product_recipe_items',
            'columns' => [
                'id' => 'id',
                'productId' => 'product_id',
                'ingredientId' => 'ingredient_id',
                'quantity' => 'quantity',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'vendor' => [
            'target' => 'vendors',
            'columns' => [
                'id' => 'id',
                'name' => 'name',
                'contactName' => 'contact_name',
                'phone' => 'phone',
                'email' => 'email',
                'notes' => 'notes',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'vendorsupply' => [
            'target' => 'vendor_supplies',
            'columns' => [
                'id' => 'id',
                'vendorId' => 'vendor_id',
                'ingredientId' => 'ingredient_id',
                'itemName' => 'item_name',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
        'inventoryrestocklog' => [
            'target' => 'inventory_restock_logs',
            'columns' => [
                'id' => 'id',
                'ingredientId' => 'ingredient_id',
                'vendorId' => 'vendor_id',
                'quantity' => 'quantity',
                'unitCost' => 'unit_cost',
                'totalCost' => 'total_cost',
                'note' => 'note',
                'createdAt' => 'created_at',
            ],
        ],
        'inventorywastelog' => [
            'target' => 'inventory_waste_logs',
            'columns' => [
                'id' => 'id',
                'ingredientId' => 'ingredient_id',
                'quantity' => 'quantity',
                'reason' => 'reason',
                'note' => 'note',
                'createdAt' => 'created_at',
            ],
        ],
        'branchingredientstock' => [
            'target' => 'branch_ingredient_stocks',
            'columns' => [
                'id' => 'id',
                'branchId' => 'branch_id',
                'ingredientId' => 'ingredient_id',
                'currentQty' => 'current_qty',
                'minQty' => 'min_qty',
                'createdAt' => 'created_at',
                'updatedAt' => 'updated_at',
            ],
        ],
    ];

    /**
     * Insertion order respecting foreign-key dependencies.
     */
    private const INSERT_ORDER = [
        'user',
        'address',
        'branch',
        'staffmember',
        'rolepermissionconfig',
        'staffactivitylog',
        'rider',
        'category',
        'product',
        'productmodifier',
        'deal',
        'dealitem',
        'coupon',
        'flashsale',
        'marketingnotification',
        'review',
        'herobanner',
        'announcementbar',
        'order',
        'orderitem',
        'orderstatushistory',
        'ingredient',
        'productrecipeitem',
        'vendor',
        'vendorsupply',
        'inventoryrestocklog',
        'inventorywastelog',
        'branchingredientstock',
    ];

    /**
     * @return array<string, int> Counts inserted per target table.
     */
    public function importFile(string $sqlPath): array
    {
        if (! is_file($sqlPath)) {
            return [];
        }

        $sql = file_get_contents($sqlPath);
        if ($sql === false || $sql === '') {
            return [];
        }

        $parsedByTable = $this->parseInsertStatements($sql);
        $counts = [];

        DB::transaction(function () use ($parsedByTable, &$counts): void {
            foreach (self::INSERT_ORDER as $sourceTable) {
                $spec = self::TABLE_MAP[$sourceTable] ?? null;
                $rows = $parsedByTable[$sourceTable] ?? [];
                if (! $spec || $rows === []) {
                    continue;
                }

                $target = $spec['target'];
                $colMap = $spec['columns'];
                $booleans = $spec['booleans'] ?? [];

                $mappedRows = [];
                foreach ($rows as $row) {
                    $record = [];
                    foreach ($row as $srcCol => $val) {
                        if (! isset($colMap[$srcCol])) {
                            continue;
                        }
                        $destCol = $colMap[$srcCol];
                        if (in_array($destCol, $booleans, true) && $val !== null) {
                            $val = (bool) ((int) $val);
                        }
                        $record[$destCol] = $val;
                    }
                    if ($record !== []) {
                        $mappedRows[] = $record;
                    }
                }

                if ($mappedRows !== []) {
                    DB::table($target)->upsert($mappedRows, ['id']);
                    $counts[$target] = count($mappedRows);
                }
            }
        });

        $this->resetPostgresSequences();

        return $counts;
    }

    public function resetPostgresSequences(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::TABLE_MAP as $spec) {
            $table = $spec['target'];
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1), (SELECT COUNT(*) > 0 FROM {$table}))",
            );
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('app_settings', 'id'), COALESCE((SELECT MAX(id) FROM app_settings), 1), (SELECT COUNT(*) > 0 FROM app_settings))",
        );
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function parseInsertStatements(string $sql): array
    {
        $results = [];
        $offset = 0;
        $len = strlen($sql);

        while (preg_match('/INSERT\s+INTO\s+`([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*/i', $sql, $match, PREG_OFFSET_CAPTURE, $offset)) {
            $table = strtolower($match[1][0]);
            $columnsRaw = $match[2][0];
            $columns = array_map(fn ($c) => trim($c, " `\t\r\n"), explode(',', $columnsRaw));

            $pos = $match[0][1] + strlen($match[0][0]);
            [$rows, $nextPos] = $this->parseValuesTuples($sql, $pos, $len);

            foreach ($rows as $tuple) {
                if (count($tuple) !== count($columns)) {
                    continue;
                }
                $assoc = [];
                foreach ($columns as $i => $colName) {
                    $assoc[$colName] = $tuple[$i];
                }
                $results[$table][] = $assoc;
            }

            $offset = $nextPos;
        }

        return $results;
    }

    /**
     * @return array{0: list<list<mixed>>, 1: int}
     */
    private function parseValuesTuples(string $sql, int $pos, int $len): array
    {
        $rows = [];

        while ($pos < $len) {
            while ($pos < $len && ctype_space($sql[$pos])) {
                $pos++;
            }
            if ($pos >= $len || $sql[$pos] === ';') {
                $pos++;
                break;
            }
            if ($sql[$pos] === ',') {
                $pos++;
                continue;
            }
            if ($sql[$pos] !== '(') {
                break;
            }

            $pos++; // skip '('
            $values = [];

            while ($pos < $len) {
                while ($pos < $len && ctype_space($sql[$pos])) {
                    $pos++;
                }
                if ($pos >= $len) {
                    break;
                }

                if ($sql[$pos] === '\'') {
                    $pos++;
                    $str = '';
                    while ($pos < $len) {
                        $ch = $sql[$pos];
                        if ($ch === '\\' && $pos + 1 < $len) {
                            $next = $sql[$pos + 1];
                            $str .= match ($next) {
                                'n' => "\n",
                                'r' => "\r",
                                't' => "\t",
                                '0' => "\0",
                                default => $next,
                            };
                            $pos += 2;
                            continue;
                        }
                        if ($ch === '\'') {
                            if ($pos + 1 < $len && $sql[$pos + 1] === '\'') {
                                $str .= '\'';
                                $pos += 2;
                                continue;
                            }
                            $pos++;
                            break;
                        }
                        $str .= $ch;
                        $pos++;
                    }
                    $values[] = $str;
                } else {
                    $start = $pos;
                    while ($pos < $len && $sql[$pos] !== ',' && $sql[$pos] !== ')') {
                        $pos++;
                    }
                    $token = trim(substr($sql, $start, $pos - $start));
                    if (strcasecmp($token, 'NULL') === 0) {
                        $values[] = null;
                    } elseif (is_numeric($token) && ! str_contains($token, '.')) {
                        $values[] = (int) $token;
                    } else {
                        $values[] = $token;
                    }
                }

                while ($pos < $len && ctype_space($sql[$pos])) {
                    $pos++;
                }
                if ($pos < $len && $sql[$pos] === ',') {
                    $pos++;
                    continue;
                }
                if ($pos < $len && $sql[$pos] === ')') {
                    $pos++;
                    break;
                }
            }

            $rows[] = $values;
        }

        return [$rows, $pos];
    }
}

