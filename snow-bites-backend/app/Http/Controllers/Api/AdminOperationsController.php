<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Deal;
use App\Models\DealItem;
use App\Models\InventoryRestockLog;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductModifier;
use App\Models\ProductRecipeItem;
use App\Models\Rider;
use App\Models\User;
use App\Services\OrderService;
use App\Services\StaffAccessService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AdminOperationsController extends Controller
{
    private const ORDER_STATUSES = [
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'OUT_FOR_DELIVERY',
        'COMPLETED',
        'CANCELLED',
    ];

    public function __construct(
        private readonly ApiSerializer $serializer,
        private readonly OrderService $orderService,
        private readonly StaffAccessService $staffAccess,
    ) {}

    public function dashboard(): JsonResponse
    {
        $productCount = Product::count();
        $categoryCount = Category::count();
        $totalOrders = Order::count();
        $openOrders = Order::whereIn('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'])->count();
        $totalRevenue = (float) Order::where('status', 'COMPLETED')->sum('total');
        $recentOrders = Order::with(['items', 'assignedRider', 'statusHistory.changedBy'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'productCount' => $productCount,
                'categoryCount' => $categoryCount,
                'totalOrders' => $totalOrders,
                'openOrders' => $openOrders,
                'totalRevenue' => round($totalRevenue, 2),
            ],
            'recentOrders' => $recentOrders->map(fn (Order $o) => $this->serializer->order($o))->values()->all(),
        ]);
    }

    public function salesAnalytics(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'in:LAST_7_DAYS,LAST_30_DAYS,THIS_MONTH,CUSTOM'],
            'granularity' => ['nullable', 'in:DAILY,WEEKLY,MONTHLY'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $range = $data['range'] ?? 'LAST_7_DAYS';
        $granularity = $data['granularity'] ?? 'DAILY';

        [$start, $end] = $this->resolveAnalyticsDateRange($range, $data['from'] ?? null, $data['to'] ?? null);

        $orders = Order::with('items')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get();

        $completedTransitions = OrderStatusHistory::where('to_status', 'COMPLETED')
            ->whereBetween('changed_at', [$start, $end])
            ->orderBy('changed_at')
            ->get();

        $completedOrders = $orders->where('status', 'COMPLETED');
        $cancelledOrders = $orders->where('status', 'CANCELLED');

        $totalRevenue = (float) $completedOrders->sum(fn (Order $o) => (float) $o->total);
        $averageOrderValue = $completedOrders->count() > 0 ? $totalRevenue / $completedOrders->count() : 0.0;
        $cancellationRate = $orders->count() > 0 ? ($cancelledOrders->count() / $orders->count()) * 100 : 0.0;

        $buckets = [];
        $cursor = $this->bucketStart($start, $granularity);
        while ($cursor->lte($end)) {
            $key = $cursor->toISOString();
            $buckets[$key] = [
                'label' => $this->formatBucketLabel($cursor, $granularity),
                'revenue' => 0.0,
                'orderCount' => 0,
                'receivedCount' => 0,
                'completedCount' => 0,
            ];
            $cursor = $this->bucketStep($cursor, $granularity);
        }

        foreach ($orders as $order) {
            $key = $this->bucketStart($order->created_at, $granularity)->toISOString();
            if (! isset($buckets[$key])) {
                continue;
            }
            $buckets[$key]['receivedCount']++;
            if ($order->status === 'COMPLETED') {
                $buckets[$key]['revenue'] += (float) $order->total;
                $buckets[$key]['orderCount']++;
            }
        }

        foreach ($completedTransitions as $transition) {
            $key = $this->bucketStart($transition->changed_at, $granularity)->toISOString();
            if (isset($buckets[$key])) {
                $buckets[$key]['completedCount']++;
            }
        }

        $completedItems = $completedOrders->flatMap(fn (Order $o) => $o->items);
        $topProductMap = [];
        foreach ($completedItems as $item) {
            $name = $item->product_name;
            if (! isset($topProductMap[$name])) {
                $topProductMap[$name] = ['productName' => $name, 'revenue' => 0.0, 'quantity' => 0];
            }
            $topProductMap[$name]['revenue'] += (float) $item->line_total;
            $topProductMap[$name]['quantity'] += (int) $item->quantity;
        }
        usort($topProductMap, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
        $topProducts = array_slice($topProductMap, 0, 5);

        $hourlyOrders = array_map(fn (int $h) => ['hour' => $h, 'count' => 0], range(0, 23));
        foreach ($orders as $order) {
            $hour = (int) $order->created_at->format('G');
            $hourlyOrders[$hour]['count']++;
        }

        $productIds = $completedItems->pluck('product_id')->filter()->unique()->values()->all();
        $recipeLinks = $productIds !== []
            ? ProductRecipeItem::whereIn('product_id', $productIds)->get()
            : collect();

        $restockRows = InventoryRestockLog::where('created_at', '<=', $end)
            ->selectRaw('ingredient_id, SUM(quantity) as total_qty, SUM(total_cost) as total_cost')
            ->groupBy('ingredient_id')
            ->get();

        $unitCostByIngredient = [];
        foreach ($restockRows as $row) {
            $qty = (float) $row->total_qty;
            $unitCostByIngredient[(int) $row->ingredient_id] = $qty > 0 ? ((float) $row->total_cost / $qty) : 0.0;
        }

        $recipeByProduct = [];
        foreach ($recipeLinks as $link) {
            $recipeByProduct[(int) $link->product_id][] = [
                'ingredientId' => (int) $link->ingredient_id,
                'quantity' => (float) $link->quantity,
            ];
        }

        $estimatedIngredientCost = 0.0;
        foreach ($completedItems as $item) {
            if (! $item->product_id) {
                continue;
            }
            foreach ($recipeByProduct[(int) $item->product_id] ?? [] as $recipeItem) {
                $unitCost = $unitCostByIngredient[$recipeItem['ingredientId']] ?? 0.0;
                $estimatedIngredientCost += $recipeItem['quantity'] * $unitCost * (int) $item->quantity;
            }
        }

        $netProfit = $totalRevenue - $estimatedIngredientCost;
        $bucketValues = array_values($buckets);

        return response()->json([
            'filters' => [
                'range' => $range,
                'granularity' => $granularity,
                'from' => $start->toISOString(),
                'to' => $end->toISOString(),
            ],
            'summary' => [
                'totalOrders' => $orders->count(),
                'completedOrders' => $completedOrders->count(),
                'cancelledOrders' => $cancelledOrders->count(),
                'totalRevenue' => round($totalRevenue, 2),
                'estimatedIngredientCost' => round($estimatedIngredientCost, 2),
                'netProfit' => round($netProfit, 2),
                'averageOrderValue' => round($averageOrderValue, 2),
                'cancellationRate' => round($cancellationRate, 2),
            ],
            'revenueSeries' => array_map(fn ($b) => [
                'label' => $b['label'],
                'revenue' => round($b['revenue'], 2),
                'completedOrders' => $b['orderCount'],
            ], $bucketValues),
            'orderVolumeSeries' => array_map(fn ($b) => [
                'label' => $b['label'],
                'receivedOrders' => $b['receivedCount'],
                'completedOrders' => $b['completedCount'],
            ], $bucketValues),
            'topProducts' => array_map(fn ($p) => [
                'productName' => $p['productName'],
                'revenue' => round($p['revenue'], 2),
                'quantity' => $p['quantity'],
            ], $topProducts),
            'peakHours' => $hourlyOrders,
        ]);
    }

    public function listOrders(Request $request): JsonResponse
    {
        $orders = $this->filteredOrdersQuery($request)
            ->with(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'orders' => $orders->map(fn (Order $o) => $this->serializer->order($o))->values()->all(),
        ]);
    }

    public function ordersSummary(Request $request): JsonResponse
    {
        $orders = $this->filteredOrdersQuery($request)->get(['id', 'status', 'total', 'assigned_rider_id', 'created_at']);
        $now = now();
        $todayStart = now()->startOfDay();

        $totalOrders = $orders->count();
        $openOrders = $orders->filter(fn (Order $o) => ! in_array($o->status, ['COMPLETED', 'CANCELLED'], true))->count();
        $completedOrders = $orders->where('status', 'COMPLETED')->count();
        $cancelledOrders = $orders->where('status', 'CANCELLED')->count();
        $unassignedOrders = $orders->filter(fn (Order $o) => ! $o->assigned_rider_id && ! in_array($o->status, ['COMPLETED', 'CANCELLED'], true))->count();
        $urgentOrders = $orders->filter(fn (Order $o) => ! in_array($o->status, ['COMPLETED', 'CANCELLED'], true) && $o->created_at->diffInMinutes($now) >= 45)->count();
        $todayOrders = $orders->filter(fn (Order $o) => $o->created_at->gte($todayStart))->count();
        $revenueTotal = (float) $orders->sum(fn (Order $o) => (float) $o->total);
        $averageOrderValue = $totalOrders > 0 ? $revenueTotal / $totalOrders : 0.0;

        return response()->json([
            'summary' => [
                'totalOrders' => $totalOrders,
                'openOrders' => $openOrders,
                'completedOrders' => $completedOrders,
                'cancelledOrders' => $cancelledOrders,
                'unassignedOrders' => $unassignedOrders,
                'urgentOrders' => $urgentOrders,
                'todayOrders' => $todayOrders,
                'revenueTotal' => round($revenueTotal, 2),
                'averageOrderValue' => round($averageOrderValue, 2),
            ],
        ]);
    }

    public function bulkUpdateOrderStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'orderIds' => ['required', 'array', 'min:1', 'max:100'],
            'orderIds.*' => ['integer', 'min:1'],
            'status' => ['required', 'in:'.implode(',', self::ORDER_STATUSES)],
        ]);

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $existingOrders = Order::whereIn('id', $data['orderIds'])->get(['id', 'status', 'assigned_rider_id']);
        if ($existingOrders->isEmpty()) {
            throw new ApiException(404, 'No orders found for bulk update.');
        }

        $targetIds = $existingOrders->pluck('id')->all();

        DB::transaction(function () use ($existingOrders, $targetIds, $data, $actor): void {
            Order::whereIn('id', $targetIds)->update([
                'status' => $data['status'],
                'handled_by_id' => $actor->id,
            ]);

            foreach ($existingOrders as $order) {
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'from_status' => $order->status,
                    'to_status' => $data['status'],
                    'changed_by_id' => $actor->id,
                    'changed_at' => now(),
                ]);
            }

            $riderIds = $existingOrders->pluck('assigned_rider_id')->filter()->unique()->values()->all();
            if ($riderIds !== []) {
                if ($data['status'] === 'OUT_FOR_DELIVERY') {
                    Rider::whereIn('id', $riderIds)->update(['availability' => 'BUSY']);
                }
                if (in_array($data['status'], ['COMPLETED', 'CANCELLED'], true)) {
                    Rider::whereIn('id', $riderIds)->update(['availability' => 'AVAILABLE']);
                }
            }
        });

        $updatedOrders = Order::with(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')])
            ->whereIn('id', $targetIds)
            ->orderByDesc('created_at')
            ->get();

        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor->id),
            'action' => 'ORDER_STATUS_BULK_UPDATED',
            'entityType' => 'Order',
            'entityId' => implode(',', $targetIds),
            'metadata' => ['orderIds' => $targetIds, 'status' => $data['status']],
        ]);

        return response()->json([
            'message' => 'Updated '.$updatedOrders->count().' orders to '.$data['status'].'.',
            'orders' => $updatedOrders->map(fn (Order $o) => $this->serializer->order($o))->values()->all(),
        ]);
    }

    public function exportOrdersCsv(Request $request): Response
    {
        $orders = $this->filteredOrdersQuery($request)
            ->with(['items', 'assignedRider'])
            ->orderByDesc('created_at')
            ->get();

        $header = ['Order Number', 'Status', 'Customer', 'Phone', 'Total', 'Items', 'Assigned Rider', 'Created At', 'Updated At'];
        $rows = [$header];

        foreach ($orders as $order) {
            $rows[] = [
                $order->order_number,
                $order->status,
                $order->customer_name,
                $order->customer_phone,
                number_format((float) $order->total, 2, '.', ''),
                (string) $order->items->count(),
                $order->assignedRider?->full_name ?? 'Unassigned',
                $order->created_at?->toISOString() ?? '',
                $order->updated_at?->toISOString() ?? '',
            ];
        }

        $csv = implode("\r\n", array_map(
            fn (array $row): string => implode(',', array_map(fn ($cell) => $this->escapeCsv($cell), $row)),
            $rows,
        ));

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="orders-'.now()->timestamp.'.csv"',
        ]);
    }

    public function kdsOverview(Request $request): JsonResponse
    {
        $query = Order::with('items')->whereIn('status', ['CONFIRMED', 'PREPARING']);
        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse((string) $request->query('from')));
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse((string) $request->query('to')));
        }

        $orders = $query->orderBy('created_at')->get();
        $now = now();

        $elapsedMinutes = $orders->map(fn (Order $o) => max(0, (int) $o->created_at->diffInMinutes($now)));
        $maxWait = $elapsedMinutes->isNotEmpty() ? $elapsedMinutes->max() : 0;
        $avgPrep = $elapsedMinutes->isNotEmpty() ? (int) round($elapsedMinutes->avg()) : 0;

        $preparing = $orders->where('status', 'PREPARING')->count();
        $readyToDispatch = $orders->filter(fn (Order $o) => $o->status === 'PREPARING' && $o->created_at->diffInMinutes($now) >= 18)->count();
        $overdue = $orders->filter(fn (Order $o) => $o->created_at->diffInMinutes($now) >= 30)->count();

        $itemCounter = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $itemCounter[$item->product_name] = ($itemCounter[$item->product_name] ?? 0) + (int) $item->quantity;
            }
        }
        arsort($itemCounter);
        $topItems = [];
        foreach (array_slice($itemCounter, 0, 6, true) as $name => $qty) {
            $topItems[] = ['name' => $name, 'quantity' => $qty];
        }

        return response()->json([
            'summary' => [
                'queueSize' => $orders->count(),
                'preparing' => $preparing,
                'readyToDispatch' => $readyToDispatch,
                'overdue' => $overdue,
                'averagePrepMinutes' => $avgPrep,
                'maxQueueWaitMinutes' => $maxWait,
            ],
            'topItems' => $topItems,
        ]);
    }

    public function bulkAdvanceKdsOrders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'orderIds' => ['required', 'array', 'min:1', 'max:120'],
            'orderIds.*' => ['integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:160'],
        ]);

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $orders = Order::whereIn('id', $data['orderIds'])->get(['id', 'status', 'assigned_rider_id']);
        if ($orders->isEmpty()) {
            throw new ApiException(404, 'No valid orders found for KDS batch update.');
        }

        $candidates = [];
        foreach ($orders as $order) {
            $nextStatus = match ($order->status) {
                'CONFIRMED' => 'PREPARING',
                'PREPARING' => 'OUT_FOR_DELIVERY',
                default => null,
            };
            if ($nextStatus !== null) {
                $candidates[] = ['order' => $order, 'nextStatus' => $nextStatus];
            }
        }

        if ($candidates === []) {
            throw new ApiException(400, 'Selected orders are not in a KDS-advanceable state.');
        }

        DB::transaction(function () use ($candidates, $actor, $data): void {
            foreach ($candidates as $entry) {
                /** @var Order $order */
                $order = $entry['order'];
                $nextStatus = $entry['nextStatus'];

                Order::where('id', $order->id)->update([
                    'status' => $nextStatus,
                    'handled_by_id' => $actor->id,
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'from_status' => $order->status,
                    'to_status' => $nextStatus,
                    'changed_by_id' => $actor->id,
                    'note' => $data['note'] ?? null,
                    'changed_at' => now(),
                ]);

                if ($order->assigned_rider_id && $nextStatus === 'OUT_FOR_DELIVERY') {
                    Rider::where('id', $order->assigned_rider_id)->update(['availability' => 'BUSY']);
                }
            }
        });

        $updatedIds = array_map(fn ($c) => $c['order']->id, $candidates);
        $updatedOrders = Order::with(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')])
            ->whereIn('id', $updatedIds)
            ->orderByDesc('created_at')
            ->get();

        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor->id),
            'action' => 'KDS_BULK_ADVANCED',
            'entityType' => 'Order',
            'entityId' => implode(',', $updatedIds),
            'metadata' => ['orderIds' => $updatedIds, 'note' => $data['note'] ?? null],
        ]);

        return response()->json([
            'message' => 'KDS advanced '.$updatedOrders->count().' orders.',
            'updatedCount' => $updatedOrders->count(),
            'skippedCount' => count($data['orderIds']) - $updatedOrders->count(),
            'orders' => $updatedOrders->map(fn (Order $o) => $this->serializer->order($o))->values()->all(),
        ]);
    }

    public function createManualOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customerName' => ['required', 'string', 'min:2', 'max:100'],
            'customerEmail' => ['nullable', 'string', 'email'],
            'customerPhone' => ['required', 'string', 'min:7', 'max:32'],
            'deliveryAddress' => ['required', 'string', 'min:5', 'max:300'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.publicId' => ['required', 'string', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $order = $this->orderService->createOrder([
            ...$data,
            'handledById' => $actor->id,
            'source' => 'ADMIN_DASHBOARD',
        ]);

        return response()->json([
            'message' => 'Manual order created successfully.',
            'order' => $this->serializer->order($order),
        ], 201);
    }

    public function createPosOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customerName' => ['nullable', 'string', 'max:100'],
            'customerPhone' => ['nullable', 'string', 'max:32'],
            'customerEmail' => ['nullable', 'string', 'email'],
            'orderType' => ['required', 'in:DINE_IN,WALK_IN,TAKEAWAY'],
            'tableNumber' => ['nullable', 'string', 'max:20'],
            'paymentMethod' => ['required', 'in:CASH,CARD,MOBILE_WALLET'],
            'notes' => ['nullable', 'string', 'max:500'],
            'couponCode' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.publicId' => ['required', 'string', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $customerName = !empty($data['customerName']) ? trim($data['customerName']) : 'Walk-in Customer';
        $customerPhone = !empty($data['customerPhone']) ? trim($data['customerPhone']) : '+56991030440';
        $tableNumber = $data['tableNumber'] ?? null;
        if ($data['orderType'] === 'DINE_IN' && empty($tableNumber)) {
            $tableNumber = 'Table 1';
        }

        $deliveryAddress = match ($data['orderType']) {
            'DINE_IN' => 'Dine-In — '.($tableNumber ?: 'Table 1'),
            'WALK_IN' => 'Walk-In Counter',
            default => 'Takeaway Counter',
        };

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $order = $this->orderService->createOrder([
            'customerName' => $customerName,
            'customerPhone' => $customerPhone,
            'customerEmail' => $data['customerEmail'] ?? null,
            'deliveryAddress' => $deliveryAddress,
            'notes' => $data['notes'] ?? null,
            'couponCode' => $data['couponCode'] ?? null,
            'items' => $data['items'],
            'handledById' => $actor->id,
            'source' => 'POS',
            'orderType' => $data['orderType'],
            'tableNumber' => $tableNumber,
            'paymentMethod' => $data['paymentMethod'],
        ]);

        return response()->json([
            'message' => 'POS order created successfully.',
            'order' => $this->serializer->order($order),
        ], 201);
    }

    public function listPosOrders(): JsonResponse
    {
        $orders = Order::with(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderByDesc('changed_at')])
            ->where('source', 'POS')
            ->where('created_at', '>=', now()->startOfDay())
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'orders' => $orders->map(fn (Order $o) => $this->serializer->order($o))->values()->all(),
            'summary' => [
                'totalOrders' => $orders->count(),
                'totalRevenue' => round((float) $orders->sum(fn (Order $o) => (float) $o->total), 2),
                'dineIn' => $orders->where('order_type', 'DINE_IN')->count(),
                'walkIn' => $orders->where('order_type', 'WALK_IN')->count(),
                'takeaway' => $orders->where('order_type', 'TAKEAWAY')->count(),
                'pending' => $orders->where('status', 'PENDING')->count(),
                'completed' => $orders->where('status', 'COMPLETED')->count(),
                'cancelled' => $orders->where('status', 'CANCELLED')->count(),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', self::ORDER_STATUSES)],
        ]);

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $existing = Order::findOrFail($id);
        $fromStatus = $existing->status;

        $order = DB::transaction(function () use ($existing, $data, $actor, $fromStatus): Order {
            $existing->update([
                'status' => $data['status'],
                'handled_by_id' => $actor->id,
            ]);

            OrderStatusHistory::create([
                'order_id' => $existing->id,
                'from_status' => $fromStatus,
                'to_status' => $data['status'],
                'changed_by_id' => $actor->id,
                'changed_at' => now(),
            ]);

            if ($existing->assigned_rider_id) {
                if ($data['status'] === 'OUT_FOR_DELIVERY') {
                    Rider::where('id', $existing->assigned_rider_id)->update(['availability' => 'BUSY']);
                }
                if (in_array($data['status'], ['COMPLETED', 'CANCELLED'], true)) {
                    Rider::where('id', $existing->assigned_rider_id)->update(['availability' => 'AVAILABLE']);
                }
            }

            return $existing->fresh(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')]);
        });

        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor->id),
            'action' => 'ORDER_STATUS_UPDATED',
            'entityType' => 'Order',
            'entityId' => (string) $id,
            'metadata' => ['from' => $fromStatus, 'to' => $data['status']],
        ]);

        return response()->json([
            'message' => 'Order status updated successfully.',
            'order' => $this->serializer->order($order),
        ]);
    }

    public function getOrderDetails(int $id): JsonResponse
    {
        $order = Order::with(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')])
            ->findOrFail($id);

        return response()->json([
            'order' => $this->serializer->order($order),
        ]);
    }

    public function assignRider(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'riderId' => ['nullable', 'integer', 'min:1'],
        ]);

        /** @var User $actor */
        $actor = $request->attributes->get('authUser');

        $order = DB::transaction(function () use ($id, $data, $actor): Order {
            $existing = Order::findOrFail($id);
            $nextRiderId = $data['riderId'] ?? null;

            if ($nextRiderId) {
                $rider = Rider::findOrFail($nextRiderId);
                if ($rider->availability === 'OFFLINE') {
                    throw new ApiException(400, 'Rider is offline and cannot be assigned.');
                }

                $rider->update([
                    'availability' => $existing->status === 'OUT_FOR_DELIVERY' ? 'BUSY' : $rider->availability,
                ]);
            }

            if ($existing->assigned_rider_id && $existing->assigned_rider_id !== $nextRiderId) {
                Rider::where('id', $existing->assigned_rider_id)->update(['availability' => 'AVAILABLE']);
            }

            $existing->update([
                'assigned_rider_id' => $nextRiderId,
                'handled_by_id' => $actor->id,
            ]);

            return $existing->fresh(['items', 'assignedRider', 'statusHistory' => fn ($q) => $q->with('changedBy')->orderBy('changed_at')]);
        });

        return response()->json([
            'message' => 'Rider assignment updated successfully.',
            'order' => $this->serializer->order($order),
        ]);
    }

    public function listRiders(Request $request): JsonResponse
    {
        $query = Rider::query();
        if ($request->filled('availability')) {
            $query->where('availability', (string) $request->query('availability'));
        }
        if ($request->filled('search')) {
            $search = strtolower(trim((string) $request->query('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(COALESCE(vehicle, \'\')) LIKE ?', ["%{$search}%"]);
            });
        }

        $riders = $query->orderBy('full_name')->get();

        return response()->json([
            'riders' => $riders->map(fn (Rider $r) => $this->serializer->rider($r))->values()->all(),
        ]);
    }

    public function ridersSummary(): JsonResponse
    {
        $riders = Rider::orderBy('full_name')->get();
        $completedOrders = Order::where('status', 'COMPLETED')
            ->whereNotNull('assigned_rider_id')
            ->get(['assigned_rider_id', 'created_at', 'updated_at', 'total']);

        $metrics = [];
        foreach ($completedOrders as $order) {
            $rid = (int) $order->assigned_rider_id;
            $minutes = max(0, (int) $order->created_at->diffInMinutes($order->updated_at));
            $metrics[$rid]['deliveries'] = ($metrics[$rid]['deliveries'] ?? 0) + 1;
            $metrics[$rid]['minutes'] = ($metrics[$rid]['minutes'] ?? 0) + $minutes;
            $metrics[$rid]['earnings'] = ($metrics[$rid]['earnings'] ?? 0.0) + (float) $order->total;
        }

        $topRiders = $riders->map(function (Rider $rider) use ($metrics): array {
            $stat = $metrics[$rider->id] ?? ['deliveries' => 0, 'minutes' => 0, 'earnings' => 0.0];

            return [
                'rider' => [
                    'id' => $rider->id,
                    'fullName' => $rider->full_name,
                    'phone' => $rider->phone,
                    'vehicle' => $rider->vehicle,
                    'profileImageUrl' => $rider->profile_image_url,
                    'availability' => $rider->availability,
                ],
                'deliveries' => $stat['deliveries'],
                'averageDeliveryMinutes' => $stat['deliveries'] > 0 ? (int) round($stat['minutes'] / $stat['deliveries']) : 0,
                'completedRevenue' => round($stat['earnings'], 2),
            ];
        })->sortByDesc('deliveries')->take(6)->values()->all();

        return response()->json([
            'summary' => [
                'totalRiders' => $riders->count(),
                'available' => $riders->where('availability', 'AVAILABLE')->count(),
                'busy' => $riders->where('availability', 'BUSY')->count(),
                'offline' => $riders->where('availability', 'OFFLINE')->count(),
                'completedDeliveries' => $completedOrders->count(),
            ],
            'topRiders' => $topRiders,
        ]);
    }

    public function createRider(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => ['required', 'string', 'min:7', 'max:32'],
            'vehicle' => ['nullable', 'string', 'max:80'],
            'branchId' => ['nullable', 'integer', 'min:1'],
            'profileImageUrl' => ['nullable', 'string', 'max:2000000'],
        ]);

        if (Rider::where('phone', trim($data['phone']))->exists()) {
            throw new ApiException(409, 'A rider with this phone already exists.');
        }

        $rider = Rider::create([
            'full_name' => trim($data['fullName']),
            'phone' => trim($data['phone']),
            'vehicle' => $data['vehicle'] ?? null,
            'branch_id' => $data['branchId'] ?? null,
            'profile_image_url' => $data['profileImageUrl'] ?? null,
            'availability' => 'AVAILABLE',
        ]);

        return response()->json([
            'message' => 'Rider created successfully.',
            'rider' => $this->serializer->rider($rider),
        ], 201);
    }

    public function updateRider(Request $request, int $id): JsonResponse
    {
        $rider = Rider::findOrFail($id);
        $data = $request->validate([
            'fullName' => ['sometimes', 'string', 'min:2', 'max:100'],
            'phone' => ['sometimes', 'string', 'min:7', 'max:32'],
            'vehicle' => ['nullable', 'string', 'max:80'],
            'branchId' => ['nullable', 'integer', 'min:1'],
            'profileImageUrl' => ['nullable', 'string', 'max:2000000'],
        ]);

        $update = [];
        if (array_key_exists('fullName', $data)) {
            $update['full_name'] = trim($data['fullName']);
        }
        if (array_key_exists('phone', $data)) {
            $update['phone'] = trim($data['phone']);
        }
        if (array_key_exists('vehicle', $data)) {
            $update['vehicle'] = $data['vehicle'];
        }
        if (array_key_exists('branchId', $data)) {
            $update['branch_id'] = $data['branchId'];
        }
        if (array_key_exists('profileImageUrl', $data)) {
            $update['profile_image_url'] = $data['profileImageUrl'];
        }

        $rider->update($update);

        return response()->json([
            'message' => 'Rider updated successfully.',
            'rider' => $this->serializer->rider($rider->fresh()),
        ]);
    }

    public function deleteRider(int $id): JsonResponse
    {
        $activeOrder = Order::where('assigned_rider_id', $id)
            ->whereIn('status', ['OUT_FOR_DELIVERY', 'PREPARING', 'CONFIRMED'])
            ->first();

        if ($activeOrder) {
            throw new ApiException(409, "Cannot delete rider with active order {$activeOrder->order_number}. Reassign first.");
        }

        Rider::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Rider deleted successfully.',
        ]);
    }

    public function updateRiderAvailability(Request $request, int $id): JsonResponse
    {
        $rider = Rider::findOrFail($id);
        $data = $request->validate([
            'availability' => ['required', 'in:AVAILABLE,BUSY,OFFLINE'],
        ]);

        $rider->update(['availability' => $data['availability']]);

        return response()->json([
            'message' => 'Rider availability updated successfully.',
            'rider' => $this->serializer->rider($rider->fresh()),
        ]);
    }

    public function listProducts(): JsonResponse
    {
        $products = Product::with(['category', 'modifiers'])->get()
            ->sortBy(fn (Product $p) => ($p->category?->name ?? '').'|'.$p->name);

        return response()->json([
            'products' => $products->map(fn (Product $p) => $this->serializer->product($p))->values()->all(),
        ]);
    }

    public function createProduct(Request $request): JsonResponse
    {
        $data = $request->validate([
            'publicId' => ['required', 'string', 'min:1', 'max:50'],
            'slug' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'gt:0'],
            'imageUrl' => ['nullable', 'string', 'max:2000000'],
            'badge' => ['nullable', 'string', 'max:50'],
            'badges' => ['nullable', 'array', 'max:5'],
            'badges.*' => ['string', 'min:1', 'max:40'],
            'isFeatured' => ['nullable', 'boolean'],
            'isActive' => ['nullable', 'boolean'],
            'isInStock' => ['nullable', 'boolean'],
            'isSpicy' => ['nullable', 'boolean'],
            'isVegetarian' => ['nullable', 'boolean'],
            'bestSeller' => ['nullable', 'boolean'],
            'categoryId' => ['required', 'integer', 'min:1'],
        ]);

        Category::findOrFail((int) $data['categoryId']);

        $badges = $data['badges'] ?? (! empty($data['badge']) ? [$data['badge']] : []);
        $product = Product::create([
            'public_id' => trim($data['publicId']),
            'slug' => trim($data['slug']),
            'name' => trim($data['name']),
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'image_url' => $data['imageUrl'] ?? null,
            'badge' => $badges[0] ?? ($data['badge'] ?? null),
            'badges' => $badges,
            'is_featured' => (bool) ($data['isFeatured'] ?? false),
            'is_active' => $data['isActive'] ?? true,
            'is_in_stock' => $data['isInStock'] ?? true,
            'is_spicy' => (bool) ($data['isSpicy'] ?? false),
            'is_vegetarian' => (bool) ($data['isVegetarian'] ?? false),
            'best_seller' => (bool) ($data['bestSeller'] ?? false),
            'category_id' => (int) $data['categoryId'],
        ]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_PRODUCT_CREATED',
            'entityType' => 'Product',
            'entityId' => (string) $product->id,
            'metadata' => ['name' => $product->name, 'categoryId' => $product->category_id],
        ]);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $this->serializer->product($product->load(['category', 'modifiers'])),
        ], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'publicId' => ['sometimes', 'string', 'min:1', 'max:50'],
            'slug' => ['sometimes', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['sometimes', 'numeric', 'gt:0'],
            'imageUrl' => ['nullable', 'string', 'max:2000000'],
            'badge' => ['nullable', 'string', 'max:50'],
            'badges' => ['nullable', 'array', 'max:5'],
            'badges.*' => ['string', 'min:1', 'max:40'],
            'isFeatured' => ['sometimes', 'boolean'],
            'isActive' => ['sometimes', 'boolean'],
            'isInStock' => ['sometimes', 'boolean'],
            'isSpicy' => ['sometimes', 'boolean'],
            'isVegetarian' => ['sometimes', 'boolean'],
            'bestSeller' => ['sometimes', 'boolean'],
            'categoryId' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (! empty($data['categoryId'])) {
            Category::findOrFail((int) $data['categoryId']);
        }

        $update = [];
        $map = [
            'publicId' => 'public_id',
            'slug' => 'slug',
            'name' => 'name',
            'description' => 'description',
            'price' => 'price',
            'imageUrl' => 'image_url',
            'badge' => 'badge',
            'isFeatured' => 'is_featured',
            'isActive' => 'is_active',
            'isInStock' => 'is_in_stock',
            'isSpicy' => 'is_spicy',
            'isVegetarian' => 'is_vegetarian',
            'bestSeller' => 'best_seller',
            'categoryId' => 'category_id',
        ];

        foreach ($map as $camel => $snake) {
            if (array_key_exists($camel, $data)) {
                $update[$snake] = $data[$camel];
            }
        }
        if (array_key_exists('badges', $data)) {
            $update['badges'] = $data['badges'] ?? [];
            $update['badge'] = $data['badges'][0] ?? null;
        }

        $product->update($update);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_PRODUCT_UPDATED',
            'entityType' => 'Product',
            'entityId' => (string) $product->id,
            'metadata' => $data,
        ]);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $this->serializer->product($product->fresh(['category', 'modifiers'])),
        ]);
    }

    public function deleteProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $name = $product->name;

        DB::transaction(function () use ($product, $id): void {
            DealItem::where('product_id', $id)->delete();
            $product->delete();
        });

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_PRODUCT_DELETED',
            'entityType' => 'Product',
            'entityId' => (string) $id,
            'metadata' => ['name' => $name],
        ]);

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    public function createModifier(Request $request): JsonResponse
    {
        $data = $request->validate([
            'productId' => ['required', 'integer', 'min:1'],
            'name' => ['required', 'string', 'min:1', 'max:80'],
            'price' => ['required', 'numeric', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        Product::findOrFail((int) $data['productId']);

        $modifier = ProductModifier::create([
            'product_id' => (int) $data['productId'],
            'name' => trim($data['name']),
            'price' => $data['price'],
            'is_active' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Modifier created successfully.',
            'modifier' => $this->serializer->modifier($modifier),
        ], 201);
    }

    public function updateModifier(Request $request, int $id): JsonResponse
    {
        $modifier = ProductModifier::findOrFail($id);
        $data = $request->validate([
            'productId' => ['sometimes', 'integer', 'min:1'],
            'name' => ['sometimes', 'string', 'min:1', 'max:80'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $update = [];
        if (array_key_exists('productId', $data)) {
            $update['product_id'] = (int) $data['productId'];
        }
        if (array_key_exists('name', $data)) {
            $update['name'] = trim($data['name']);
        }
        if (array_key_exists('price', $data)) {
            $update['price'] = $data['price'];
        }
        if (array_key_exists('isActive', $data)) {
            $update['is_active'] = (bool) $data['isActive'];
        }

        $modifier->update($update);

        return response()->json([
            'message' => 'Modifier updated successfully.',
            'modifier' => $this->serializer->modifier($modifier->fresh()),
        ]);
    }

    public function deleteModifier(int $id): JsonResponse
    {
        ProductModifier::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Modifier deleted successfully.',
        ]);
    }

    public function bulkUpdatePricing(Request $request): JsonResponse
    {
        $data = $request->validate([
            'categoryId' => ['required', 'integer', 'min:1'],
            'mode' => ['required', 'in:PERCENTAGE,FLAT'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        Category::findOrFail((int) $data['categoryId']);
        $products = Product::where('category_id', (int) $data['categoryId'])->get();

        if ($products->isEmpty()) {
            return response()->json([
                'message' => 'No products in this category.',
                'updatedCount' => 0,
            ]);
        }

        DB::transaction(function () use ($products, $data): void {
            foreach ($products as $product) {
                $current = (float) $product->price;
                $next = $data['mode'] === 'PERCENTAGE'
                    ? $current + ($current * (float) $data['amount']) / 100
                    : $current + (float) $data['amount'];

                $product->update(['price' => max(1, round($next, 2))]);
            }
        });

        return response()->json([
            'message' => 'Bulk price update completed.',
            'updatedCount' => $products->count(),
        ]);
    }

    public function listDeals(): JsonResponse
    {
        $deals = Deal::with('items.product')
            ->orderByDesc('is_active')
            ->orderBy('expires_at')
            ->orderBy('name')
            ->get();

        return response()->json([
            'deals' => $deals->map(fn (Deal $d) => $this->serializer->deal($d))->values()->all(),
        ]);
    }

    public function createDeal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'publicId' => ['required', 'string', 'min:1', 'max:50'],
            'slug' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'imageUrl' => ['nullable', 'string', 'max:2000000'],
            'price' => ['required', 'numeric', 'gt:0'],
            'isActive' => ['nullable', 'boolean'],
            'expiresAt' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:2'],
            'items.*.productId' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $productIds = array_values(array_unique(array_column($data['items'], 'productId')));
        $validCount = Product::whereIn('id', $productIds)->where('is_active', true)->count();
        if ($validCount !== count($productIds)) {
            throw new ApiException(400, 'One or more deal items are invalid.');
        }

        $deal = DB::transaction(function () use ($data): Deal {
            $created = Deal::create([
                'public_id' => trim($data['publicId']),
                'slug' => trim($data['slug']),
                'name' => trim($data['name']),
                'description' => $data['description'] ?? null,
                'image_url' => $data['imageUrl'] ?? null,
                'price' => $data['price'],
                'is_active' => $data['isActive'] ?? true,
                'expires_at' => $data['expiresAt'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                DealItem::create([
                    'deal_id' => $created->id,
                    'product_id' => (int) $item['productId'],
                    'quantity' => (int) $item['quantity'],
                ]);
            }

            return $created->load('items.product');
        });

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_DEAL_CREATED',
            'entityType' => 'Deal',
            'entityId' => (string) $deal->id,
            'metadata' => ['name' => $deal->name, 'publicId' => $deal->public_id],
        ]);

        return response()->json([
            'message' => 'Deal created successfully.',
            'deal' => $this->serializer->deal($deal),
        ], 201);
    }

    public function updateDeal(Request $request, int $id): JsonResponse
    {
        $deal = Deal::findOrFail($id);
        $data = $request->validate([
            'publicId' => ['sometimes', 'string', 'min:1', 'max:50'],
            'slug' => ['sometimes', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'imageUrl' => ['nullable', 'string', 'max:2000000'],
            'price' => ['sometimes', 'numeric', 'gt:0'],
            'isActive' => ['sometimes', 'boolean'],
            'expiresAt' => ['nullable', 'date'],
            'items' => ['sometimes', 'array', 'min:2'],
            'items.*.productId' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        if (! empty($data['items'])) {
            $productIds = array_values(array_unique(array_column($data['items'], 'productId')));
            $validCount = Product::whereIn('id', $productIds)->where('is_active', true)->count();
            if ($validCount !== count($productIds)) {
                throw new ApiException(400, 'One or more deal items are invalid.');
            }
        }

        $updated = DB::transaction(function () use ($deal, $data): Deal {
            if (array_key_exists('items', $data)) {
                DealItem::where('deal_id', $deal->id)->delete();
                foreach ($data['items'] as $item) {
                    DealItem::create([
                        'deal_id' => $deal->id,
                        'product_id' => (int) $item['productId'],
                        'quantity' => (int) $item['quantity'],
                    ]);
                }
            }

            $update = [];
            if (array_key_exists('publicId', $data)) {
                $update['public_id'] = trim($data['publicId']);
            }
            if (array_key_exists('slug', $data)) {
                $update['slug'] = trim($data['slug']);
            }
            if (array_key_exists('name', $data)) {
                $update['name'] = trim($data['name']);
            }
            if (array_key_exists('description', $data)) {
                $update['description'] = $data['description'];
            }
            if (array_key_exists('imageUrl', $data)) {
                $update['image_url'] = $data['imageUrl'];
            }
            if (array_key_exists('price', $data)) {
                $update['price'] = $data['price'];
            }
            if (array_key_exists('isActive', $data)) {
                $update['is_active'] = (bool) $data['isActive'];
            }
            if (array_key_exists('expiresAt', $data)) {
                $update['expires_at'] = $data['expiresAt'];
            }

            if ($update !== []) {
                $deal->update($update);
            }

            return $deal->fresh('items.product');
        });

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_DEAL_UPDATED',
            'entityType' => 'Deal',
            'entityId' => (string) $deal->id,
            'metadata' => $data,
        ]);

        return response()->json([
            'message' => 'Deal updated successfully.',
            'deal' => $this->serializer->deal($updated),
        ]);
    }

    public function deleteDeal(Request $request, int $id): JsonResponse
    {
        $deal = Deal::findOrFail($id);
        $name = $deal->name;
        $deal->delete();

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_DEAL_DELETED',
            'entityType' => 'Deal',
            'entityId' => (string) $id,
            'metadata' => ['name' => $name],
        ]);

        return response()->json([
            'message' => 'Deal deleted successfully.',
        ]);
    }

    public function listCategories(): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'categories' => $categories->map(fn (Category $c) => $this->serializer->category($c))->values()->all(),
        ]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'slug' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'icon' => ['nullable', 'string', 'max:16'],
        ]);

        if (Category::where('slug', trim($data['slug']))->exists()) {
            throw new ApiException(409, 'Category slug already exists.');
        }

        $category = Category::create([
            'name' => trim($data['name']),
            'slug' => trim($data['slug']),
            'icon' => $data['icon'] ?? null,
        ]);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_CATEGORY_CREATED',
            'entityType' => 'Category',
            'entityId' => (string) $category->id,
            'metadata' => ['name' => $category->name, 'slug' => $category->slug],
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $this->serializer->category($category),
        ], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'slug' => ['sometimes', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'icon' => ['nullable', 'string', 'max:16'],
        ]);

        $update = [];
        if (array_key_exists('name', $data)) {
            $update['name'] = trim($data['name']);
        }
        if (array_key_exists('slug', $data)) {
            $update['slug'] = trim($data['slug']);
        }
        if (array_key_exists('icon', $data)) {
            $update['icon'] = $data['icon'];
        }

        if ($update === []) {
            throw new ApiException(400, 'At least one field is required.');
        }

        $category->update($update);

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_CATEGORY_UPDATED',
            'entityType' => 'Category',
            'entityId' => (string) $category->id,
            'metadata' => $data,
        ]);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $this->serializer->category($category->fresh()),
        ]);
    }

    public function deleteCategory(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $name = $category->name;

        $deletedProducts = DB::transaction(function () use ($category, $id): int {
            $productIds = Product::where('category_id', $id)->pluck('id')->all();
            if ($productIds !== []) {
                DealItem::whereIn('product_id', $productIds)->delete();
                ProductModifier::whereIn('product_id', $productIds)->delete();
                Product::whereIn('id', $productIds)->delete();
            }
            $category->delete();

            return count($productIds);
        });

        /** @var User|null $actor */
        $actor = $request->attributes->get('authUser');
        $this->staffAccess->appendStaffActivityLog([
            'requestUserId' => $actor?->id,
            'branchId' => $this->staffAccess->getActorBranchId($actor?->id),
            'action' => 'MENU_CATEGORY_DELETED',
            'entityType' => 'Category',
            'entityId' => (string) $id,
            'metadata' => ['name' => $name, 'deletedProducts' => $deletedProducts],
        ]);

        return response()->json([
            'message' => 'Category and related products deleted successfully.',
            'deletedProducts' => $deletedProducts,
        ]);
    }

    private function filteredOrdersQuery(Request $request)
    {
        $query = Order::query();

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }
        if ($request->filled('riderId')) {
            $query->where('assigned_rider_id', (int) $request->query('riderId'));
        }
        if ($request->filled('search')) {
            $search = strtolower(trim((string) $request->query('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(order_number) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(customer_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(customer_phone) LIKE ?', ["%{$search}%"]);
            });
        }
        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse((string) $request->query('from')));
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse((string) $request->query('to')));
        }

        return $query;
    }

    private function resolveAnalyticsDateRange(string $range, ?string $from, ?string $to): array
    {
        $end = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();

        if ($range === 'CUSTOM') {
            if (! $from || ! $to) {
                throw new ApiException(400, 'Custom range requires both from and to dates.');
            }
            $start = Carbon::parse($from)->startOfDay();
            if ($start->gt($end)) {
                throw new ApiException(400, 'From date cannot be after to date.');
            }

            return [$start, $end];
        }

        $start = match ($range) {
            'THIS_MONTH' => $end->copy()->startOfMonth(),
            'LAST_30_DAYS' => $end->copy()->subDays(29)->startOfDay(),
            default => $end->copy()->subDays(6)->startOfDay(),
        };

        return [$start, $end];
    }

    private function bucketStart(Carbon $date, string $granularity): Carbon
    {
        return match ($granularity) {
            'WEEKLY' => $date->copy()->startOfWeek(Carbon::MONDAY),
            'MONTHLY' => $date->copy()->startOfMonth(),
            default => $date->copy()->startOfDay(),
        };
    }

    private function bucketStep(Carbon $date, string $granularity): Carbon
    {
        return match ($granularity) {
            'WEEKLY' => $date->copy()->addWeek(),
            'MONTHLY' => $date->copy()->addMonth(),
            default => $date->copy()->addDay(),
        };
    }

    private function formatBucketLabel(Carbon $date, string $granularity): string
    {
        return match ($granularity) {
            'WEEKLY' => $date->format('d M').' - '.$date->copy()->addDays(6)->format('d M'),
            'MONTHLY' => $date->format('M Y'),
            default => $date->format('d M'),
        };
    }

    private function escapeCsv(mixed $value): string
    {
        $str = (string) ($value ?? '');
        if (preg_match('/[",\n]/', $str)) {
            return '"'.str_replace('"', '""', $str).'"';
        }

        return $str;
    }
}

