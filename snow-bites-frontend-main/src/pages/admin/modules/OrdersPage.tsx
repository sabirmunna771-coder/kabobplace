import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	assignRiderToAdminOrder,
	bulkUpdateAdminOrderStatus,
	createAdminOrder,
	downloadAdminOrdersCsv,
	getAdminOrderDetails,
	getAdminOrders,
	getAdminOrderSummary,
	getAdminProducts,
	getAdminRiders,
	updateAdminOrderStatus,
	type ApiOrder,
	type ApiOrderStatusHistory,
	type ApiRider,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	Bike,
	Calendar,
	Check,
	CheckCircle2,
	ChevronRight,
	CircleDot,
	ClipboardList,
	Clock,
	DollarSign,
	Download,
	FileText,
	Hash,
	Layers,
	ListChecks,
	MapPin,
	Minus,
	Package,
	Phone,
	Plus,
	Receipt,
	Search,
	ShoppingCart,
	Sparkles,
	Tag,
	Timer,
	Trash2,
	TrendingUp,
	Truck,
	User,
	UserCheck,
	X,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────────── */

type FeedFilter = "ALL" | "OPEN" | ApiOrder["status"];

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-3xl [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

const btnPrimary = "rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-[0.98]";

const statusClassMap: Record<ApiOrder["status"], string> = {
	PENDING: "border-amber-300/30 bg-amber-300/15 text-amber-200",
	CONFIRMED: "border-sky-400/30 bg-sky-400/15 text-sky-200",
	PREPARING: "border-primary/30 bg-primary/15 text-primary",
	OUT_FOR_DELIVERY: "border-violet-400/30 bg-violet-400/15 text-violet-200",
	COMPLETED: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
	CANCELLED: "border-rose-400/30 bg-rose-400/15 text-rose-200",
};

const statusIconMap: Record<ApiOrder["status"], typeof Clock> = {
	PENDING: Clock,
	CONFIRMED: CheckCircle2,
	PREPARING: Timer,
	OUT_FOR_DELIVERY: Truck,
	COMPLETED: Check,
	CANCELLED: XCircle,
};

const ALL_STATUSES: ApiOrder["status"][] = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];

/* ── Helpers ───────────────────────────────────────────────────── */

const isOpenOrder = (status: ApiOrder["status"]) => ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(status);

const inferOrderType = (o: ApiOrder) => {
	const t = `${o.deliveryAddress} ${o.notes ?? ""}`.toLowerCase();
	return t.includes("pickup") || t.includes("self") ? "Pickup" : "Delivery";
};

const relativeTime = (v: string) => {
	const mins = Math.max(1, Math.floor((Date.now() - new Date(v).getTime()) / 60000));
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
};

const fmtDate = (s: string) => {
	const d = new Date(s);
	return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
};

const filterOptions: Array<{ key: FeedFilter; label: string; Icon: typeof Package }> = [
	{ key: "ALL", label: "All", Icon: Layers },
	{ key: "OPEN", label: "Open", Icon: CircleDot },
	{ key: "PENDING", label: "Pending", Icon: Clock },
	{ key: "CONFIRMED", label: "Confirmed", Icon: CheckCircle2 },
	{ key: "PREPARING", label: "Preparing", Icon: Timer },
	{ key: "OUT_FOR_DELIVERY", label: "Delivering", Icon: Truck },
	{ key: "COMPLETED", label: "Completed", Icon: Check },
	{ key: "CANCELLED", label: "Cancelled", Icon: XCircle },
];

/* ── Component ─────────────────────────────────────────────────── */

const OrdersPage = () => {
	const { token } = useAuth();
	const { formatPrice: fmtCurrency } = useSiteSettings();
	const qc = useQueryClient();

	/* ─ Queries ─ */
	const ordersQ = useQuery({ queryKey: ["admin-orders-page"], queryFn: () => getAdminOrders(token!), enabled: Boolean(token), refetchInterval: 7000 });
	const summaryQ = useQuery({ queryKey: ["admin-orders-summary"], queryFn: () => getAdminOrderSummary(token!), enabled: Boolean(token), refetchInterval: 15000 });
	const ridersQ = useQuery({ queryKey: ["admin-riders-for-orders"], queryFn: () => getAdminRiders(token!), enabled: Boolean(token), refetchInterval: 30000 });
	const productsQ = useQuery({ queryKey: ["admin-products-for-orders"], queryFn: () => getAdminProducts(token!), enabled: Boolean(token), refetchInterval: 60000 });

	const orders = useMemo(() => [...(ordersQ.data?.orders ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [ordersQ.data?.orders]);
	const summary = summaryQ.data?.summary;
	const riders = ridersQ.data?.riders ?? [];
	const products = productsQ.data ?? [];

	/* ─ UI state ─ */
	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState<FeedFilter>("OPEN");
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
	const [lastSynced] = useState(() => new Date());

	/* ─ Detail modal ─ */
	const detailQ = useQuery({
		queryKey: ["admin-order-detail", selectedOrderId],
		queryFn: () => getAdminOrderDetails(token!, selectedOrderId!),
		enabled: Boolean(token && selectedOrderId),
	});
	const selectedOrder = detailQ.data?.order ?? orders.find((o) => o.id === selectedOrderId) ?? null;

	/* ─ Create Order Modal ─ */
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [newCustomerName, setNewCustomerName] = useState("");
	const [newCustomerPhone, setNewCustomerPhone] = useState("");
	const [newCustomerEmail, setNewCustomerEmail] = useState("");
	const [newAddress, setNewAddress] = useState("");
	const [newNotes, setNewNotes] = useState("");
	const [newItems, setNewItems] = useState<Array<{ publicId: string; quantity: number }>>([{ publicId: "", quantity: 1 }]);

	/* ─ Bulk Status Modal ─ */
	const [bulkModalOpen, setBulkModalOpen] = useState(false);
	const [bulkStatus, setBulkStatus] = useState<ApiOrder["status"]>("CONFIRMED");

	/* ─ Rider Assign Modal ─ */
	const [riderModalOpen, setRiderModalOpen] = useState(false);
	const [riderAssignOrderId, setRiderAssignOrderId] = useState<number | null>(null);
	const [riderAssignId, setRiderAssignId] = useState<string>("");

	/* ─ Query invalidation ─ */
	const inv = (...keys: string[]) => { keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] })); };

	/* ── Mutations ───────────────────────────────────────────── */

	const statusMut = useMutation({
		mutationFn: ({ orderId, status }: { orderId: number; status: ApiOrder["status"] }) => updateAdminOrderStatus(token!, orderId, status),
		onSuccess: () => {
			toast.success("Status updated");
			inv("admin-orders-page", "admin-orders-summary", "admin-order-detail", "admin-overview-dashboard");
		},
		onError: () => toast.error("Failed to update status"),
	});

	const bulkStatusMut = useMutation({
		mutationFn: () => bulkUpdateAdminOrderStatus(token!, { orderIds: [...bulkSelected], status: bulkStatus }),
		onSuccess: (data) => {
			toast.success(`${data.orders.length} orders updated`);
			setBulkSelected(new Set());
			setBulkModalOpen(false);
			inv("admin-orders-page", "admin-orders-summary", "admin-overview-dashboard");
		},
		onError: () => toast.error("Bulk update failed"),
	});

	const assignRiderMut = useMutation({
		mutationFn: () => {
			if (!riderAssignOrderId) throw new Error("No order selected");
			return assignRiderToAdminOrder(token!, riderAssignOrderId, riderAssignId ? Number(riderAssignId) : null);
		},
		onSuccess: () => {
			toast.success("Rider assigned");
			setRiderModalOpen(false);
			inv("admin-orders-page", "admin-order-detail", "admin-riders-for-orders");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to assign rider"),
	});

	const createOrderMut = useMutation({
		mutationFn: () => {
			const name = newCustomerName.trim();
			const phone = newCustomerPhone.trim();
			const address = newAddress.trim();
			if (!name || !phone || !address) throw new Error("Name, phone, address required");
			const items = newItems.filter((i) => i.publicId && i.quantity > 0);
			if (items.length === 0) throw new Error("Add at least one item");
			return createAdminOrder(token!, {
				customerName: name,
				customerPhone: phone,
				customerEmail: newCustomerEmail.trim() || undefined,
				deliveryAddress: address,
				notes: newNotes.trim() || undefined,
				items,
			});
		},
		onSuccess: () => {
			toast.success("Order created");
			setCreateModalOpen(false);
			inv("admin-orders-page", "admin-orders-summary");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create order"),
	});

	const exportCsvMut = useMutation({
		mutationFn: () => downloadAdminOrdersCsv(token!, statusFilter !== "ALL" && statusFilter !== "OPEN" ? { status: statusFilter } : undefined),
		onSuccess: (blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("CSV exported");
		},
		onError: () => toast.error("Export failed"),
	});

	/* ── Filtered data ───────────────────────────────────────── */

	const filteredOrders = useMemo(() => {
		const q = searchText.trim().toLowerCase();
		return orders.filter((o) => {
			const match = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || String(o.id).includes(q) || o.customerPhone.includes(q);
			if (!match) return false;
			if (statusFilter === "ALL") return true;
			if (statusFilter === "OPEN") return isOpenOrder(o.status);
			return o.status === statusFilter;
		});
	}, [orders, searchText, statusFilter]);

	/* ── Local stats from orders list ────────────────────────── */

	const localStats = useMemo(() => {
		const total = orders.length;
		const open = orders.filter((o) => isOpenOrder(o.status)).length;
		const completed = orders.filter((o) => o.status === "COMPLETED").length;
		const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
		const revenue = orders.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + o.total, 0);
		return { total, open, completed, cancelled, revenue };
	}, [orders]);

	/* ── Modal helpers ───────────────────────────────────────── */

	const openCreateOrder = () => {
		setNewCustomerName(""); setNewCustomerPhone(""); setNewCustomerEmail(""); setNewAddress(""); setNewNotes("");
		setNewItems([{ publicId: "", quantity: 1 }]);
		setCreateModalOpen(true);
	};

	const openBulkUpdate = () => {
		if (bulkSelected.size === 0) { toast.error("Select orders first"); return; }
		setBulkStatus("CONFIRMED");
		setBulkModalOpen(true);
	};

	const openRiderAssign = (orderId: number, currentRiderId?: number | null) => {
		setRiderAssignOrderId(orderId);
		setRiderAssignId(currentRiderId ? String(currentRiderId) : "");
		setRiderModalOpen(true);
	};

	const toggleBulkSelect = (id: number) => {
		setBulkSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (bulkSelected.size === filteredOrders.length) {
			setBulkSelected(new Set());
		} else {
			setBulkSelected(new Set(filteredOrders.map((o) => o.id)));
		}
	};

	const addOrderItem = () => setNewItems((prev) => [...prev, { publicId: "", quantity: 1 }]);
	const removeOrderItem = (idx: number) => setNewItems((prev) => prev.filter((_, i) => i !== idx));
	const updateOrderItem = (idx: number, field: "publicId" | "quantity", val: string | number) => {
		setNewItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
	};

	const modalTax = selectedOrder ? Math.max(0, selectedOrder.total - (selectedOrder.subtotal - selectedOrder.discountAmount)) : 0;

	/* ── Render ─────────────────────────────────────────────── */

	return (
		<ModuleScaffold title="Orders" subtitle="" hideHeader>
			<div className="space-y-5">

				{/* ═══════ Header Bar ═══════ */}
				<div className={headerBarClass}>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/20">
							<Receipt className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Order Command Center</h1>
							<p className="flex items-center gap-1.5 text-xs text-white/40">
								<Clock className="h-3 w-3" />
								Live &middot; refreshing every 7s
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative w-full max-w-xs">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
							<Input
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								placeholder="Search orders..."
								className={cn(inputClass, "pl-9")}
							/>
						</div>
					</div>
				</div>

				{/* ═══════ Stat Cards (from summary API) ═══════ */}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
					{[
						{ label: "Total Orders", value: summary?.totalOrders ?? localStats.total, Icon: Layers, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
						{ label: "Open / Active", value: summary?.openOrders ?? localStats.open, Icon: CircleDot, color: "from-primary/20 to-accent/20", text: "text-primary" },
						{ label: "Today's Orders", value: summary?.todayOrders ?? "—", Icon: Calendar, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
						{ label: "Unassigned", value: summary?.unassignedOrders ?? "—", Icon: AlertTriangle, color: "from-rose-500/20 to-red-500/20", text: "text-rose-400" },
						{ label: "Revenue", value: fmtCurrency(summary?.revenueTotal ?? localStats.revenue), Icon: DollarSign, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
						{ label: "Avg. Order", value: summary?.averageOrderValue ? fmtCurrency(summary.averageOrderValue) : "—", Icon: TrendingUp, color: "from-amber-500/20 to-accent/20", text: "text-accent" },
					].map((s) => (
						<div key={s.label} className={panelClass}>
							<div className="flex items-center gap-2">
								<div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br", s.color)}>
									<s.Icon className={cn("h-4 w-4", s.text)} />
								</div>
								<span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{s.label}</span>
							</div>
							<p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
						</div>
					))}
				</div>

				{/* ═══════ Action Hub ═══════ */}
				<div className="flex flex-wrap items-center gap-2">
					<Button className={btnPrimary} onClick={openCreateOrder}><Plus className="mr-1.5 h-4 w-4" /> New Order</Button>
					<Button
						className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
						onClick={openBulkUpdate}
						disabled={bulkSelected.size === 0}
					>
						<ListChecks className="mr-1.5 h-4 w-4" /> Bulk Update ({bulkSelected.size})
					</Button>
					<Button
						className="rounded-[14px] bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
						onClick={() => exportCsvMut.mutate()}
						disabled={exportCsvMut.isPending}
					>
						<Download className="mr-1.5 h-4 w-4" /> Export CSV
					</Button>
				</div>

				{/* ═══════ Filter Tabs ═══════ */}
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{filterOptions.map((f) => {
						const count = f.key === "ALL" ? orders.length : f.key === "OPEN" ? localStats.open : orders.filter((o) => o.status === f.key).length;
						return (
							<button
								key={f.key}
								onClick={() => setStatusFilter(f.key)}
								className={cn(
									"flex items-center gap-2 whitespace-nowrap rounded-[12px] px-4 py-2.5 text-sm font-medium transition-all",
									statusFilter === f.key
										? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
										: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
								)}
							>
								<f.Icon className="h-4 w-4" />
								{f.label}
								<span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold", statusFilter === f.key ? "bg-black/20 text-primary-foreground" : "bg-white/10 text-white/30")}>{count}</span>
							</button>
						);
					})}
				</div>

				{/* ═══════ Select All ═══════ */}
				{filteredOrders.length > 0 && (
					<div className="flex items-center gap-3">
						<button
							onClick={toggleSelectAll}
							className={cn(
								"flex h-5 w-5 items-center justify-center rounded-md border transition",
								bulkSelected.size === filteredOrders.length ? "border-primary bg-primary/30" : "border-white/20 bg-white/5",
							)}
						>
							{bulkSelected.size === filteredOrders.length && <Check className="h-3 w-3 text-primary" />}
						</button>
						<span className="text-xs text-white/40">
							{bulkSelected.size > 0 ? `${bulkSelected.size} selected` : `Select all ${filteredOrders.length} orders`}
						</span>
					</div>
				)}

				{/* ═══════ Order List ═══════ */}
				<div className="space-y-2">
					{ordersQ.isLoading && <p className="text-sm text-white/40">Loading orders...</p>}

					{filteredOrders.map((order) => {
						const StatusIcon = statusIconMap[order.status];
						const selected = bulkSelected.has(order.id);
						return (
							<div
								key={order.id}
								className={cn(
									"flex items-center gap-3 rounded-[16px] border px-4 py-3 transition-all duration-200",
									selected
										? "border-primary/40 bg-primary/[0.08]"
										: "border-white/10 bg-black/20 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)]",
								)}
							>
								{/* Checkbox */}
								<button
									onClick={() => toggleBulkSelect(order.id)}
									className={cn(
										"flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
										selected ? "border-primary bg-primary/30" : "border-white/20 bg-white/5",
									)}
								>
									{selected && <Check className="h-3 w-3 text-primary" />}
								</button>

								{/* Main card – clickable */}
								<div
									role="button"
									tabIndex={0}
									onClick={() => setSelectedOrderId(order.id)}
									onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedOrderId(order.id); } }}
									className="flex flex-1 cursor-pointer flex-col gap-2 text-left lg:flex-row lg:items-center lg:justify-between select-none"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="flex items-center gap-1 text-sm font-semibold text-white">
												<Hash className="h-3.5 w-3.5 text-white/30" />{order.orderNumber}
											</span>
											<span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", statusClassMap[order.status])}>
												<StatusIcon className="h-3 w-3" />
												{order.status.replace(/_/g, " ")}
											</span>
											{order.assignedRider && (
												<span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
													<Bike className="h-3 w-3" /> {order.assignedRider.fullName}
												</span>
											)}
										</div>
										<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40">
											<span className="flex items-center gap-1"><User className="h-3 w-3" /> {order.customerName}</span>
											<span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.customerPhone}</span>
											<span className="flex items-center gap-1">{inferOrderType(order) === "Delivery" ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />} {inferOrderType(order)}</span>
											<span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {relativeTime(order.createdAt)}</span>
											{order.items.length > 0 && <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.items.length} items</span>}
										</div>
									</div>

									<div className="flex items-center gap-3">
										{order.couponCode && (
											<span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
												<Tag className="h-3 w-3" /> {order.couponCode}
											</span>
										)}
										<span className="text-base font-bold text-white">{fmtCurrency(order.total)}</span>
										<ChevronRight className="h-4 w-4 text-white/20" />
									</div>
								</div>

								{/* Quick assign rider */}
								{isOpenOrder(order.status) && (
									<button
										onClick={() => openRiderAssign(order.id, order.assignedRiderId)}
										className="rounded-lg p-1.5 text-white/20 transition hover:bg-violet-500/10 hover:text-violet-400"
										title="Assign rider"
									>
										<Bike className="h-4 w-4" />
									</button>
								)}
							</div>
						);
					})}

					{filteredOrders.length === 0 && !ordersQ.isLoading && (
						<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
							<ClipboardList className="mb-3 h-12 w-12 text-white/20" />
							<p className="text-sm font-semibold text-white/60">No orders found</p>
							<p className="mt-1 text-xs text-white/30">Try adjusting filters or create a new order.</p>
							<Button className={cn(btnPrimary, "mt-4")} onClick={openCreateOrder}><Plus className="mr-1.5 h-4 w-4" /> New Order</Button>
						</div>
					)}
				</div>
			</div>

			{/* ═══════════════════════════════════════════════════════
			     MODALS
			   ═══════════════════════════════════════════════════════ */}

			{/* ── Order Detail Modal ── */}
			<Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => { if (!open) setSelectedOrderId(null); }}>
				<DialogContent className={cn(modalContentClass, "max-h-[90vh] overflow-y-auto")}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Receipt className="h-5 w-5 text-primary" />
							Order Detail
						</DialogTitle>
						<DialogDescription className="text-white/40">Full billing, customer info, status timeline & rider management.</DialogDescription>
					</DialogHeader>

					{selectedOrder ? (
						<div className="space-y-4 py-2">

							{/* Info Grid */}
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
								{[
									{ label: "Order Number", value: selectedOrder.orderNumber, Icon: Hash },
									{ label: "Customer", value: selectedOrder.customerName, Icon: User },
									{ label: "Phone", value: selectedOrder.customerPhone, Icon: Phone },
									{ label: "Type", value: inferOrderType(selectedOrder), Icon: Truck },
								].map((c) => (
									<div key={c.label} className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3">
										<p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/30"><c.Icon className="h-3 w-3" /> {c.label}</p>
										<p className="mt-1 text-sm font-semibold text-white">{c.value}</p>
									</div>
								))}
							</div>

							{/* Status + Rider Row */}
							<div className="flex flex-wrap items-center gap-2">
								<span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", statusClassMap[selectedOrder.status])}>
									{(() => { const I = statusIconMap[selectedOrder.status]; return <I className="h-3.5 w-3.5" />; })()}
									{selectedOrder.status.replace(/_/g, " ")}
								</span>
								{selectedOrder.assignedRider && (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
										<Bike className="h-3.5 w-3.5" /> {selectedOrder.assignedRider.fullName}
									</span>
								)}
								{selectedOrder.couponCode && (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
										<Tag className="h-3.5 w-3.5" /> {selectedOrder.couponCode} ({selectedOrder.discountLabel})
									</span>
								)}
								<span className="text-xs text-white/30">{fmtDate(selectedOrder.createdAt)}</span>
							</div>

							{/* Address & Notes */}
							{(selectedOrder.deliveryAddress || selectedOrder.notes) && (
								<div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3 space-y-1">
									{selectedOrder.deliveryAddress && <p className="flex items-center gap-1.5 text-xs text-white/60"><MapPin className="h-3 w-3 text-white/30" /> {selectedOrder.deliveryAddress}</p>}
									{selectedOrder.notes && <p className="flex items-center gap-1.5 text-xs italic text-white/40"><FileText className="h-3 w-3 text-white/30" /> {selectedOrder.notes}</p>}
								</div>
							)}

							{/* Order Bill */}
							<div className="rounded-[14px] border border-white/10 bg-black/20 p-4">
								<h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><ShoppingCart className="h-4 w-4 text-primary" /> Order Items</h4>
								<div className="space-y-2">
									{selectedOrder.items.map((item) => (
										<div key={item.id} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/20 px-3 py-2 text-sm">
											<div>
												<p className="font-medium text-white">{item.productName}</p>
												<p className="text-[11px] text-white/40">Qty {item.quantity} × {fmtCurrency(item.productPrice)}</p>
											</div>
											<p className="font-semibold text-white">{fmtCurrency(item.lineTotal)}</p>
										</div>
									))}
								</div>
								<div className="mt-4 space-y-1.5 text-sm">
									<div className="flex justify-between text-white/40"><span>Subtotal</span><span>{fmtCurrency(selectedOrder.subtotal)}</span></div>
									{selectedOrder.discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{fmtCurrency(selectedOrder.discountAmount)}</span></div>}
									{modalTax > 0 && <div className="flex justify-between text-white/40"><span>Tax / Service</span><span>{fmtCurrency(modalTax)}</span></div>}
									<div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>Total</span><span>{fmtCurrency(selectedOrder.total)}</span></div>
								</div>
							</div>

							{/* Status History Timeline */}
							{selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
								<div className="rounded-[14px] border border-white/10 bg-black/20 p-4">
									<h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Clock className="h-4 w-4 text-sky-400" /> Status Timeline</h4>
									<div className="space-y-2">
										{selectedOrder.statusHistory.map((h, idx) => (
											<div key={h.id} className="flex items-start gap-3">
												<div className="flex flex-col items-center">
													<div className={cn("flex h-6 w-6 items-center justify-center rounded-full", idx === selectedOrder.statusHistory!.length - 1 ? "bg-primary/30" : "bg-white/10")}>
														<CircleDot className={cn("h-3 w-3", idx === selectedOrder.statusHistory!.length - 1 ? "text-primary" : "text-white/30")} />
													</div>
													{idx < selectedOrder.statusHistory!.length - 1 && <div className="mt-1 h-6 w-px bg-white/10" />}
												</div>
												<div className="pb-2">
													<div className="flex items-center gap-2">
														{h.fromStatus && <span className="text-[10px] text-white/30">{h.fromStatus}</span>}
														{h.fromStatus && <ChevronRight className="h-3 w-3 text-white/20" />}
														<span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", statusClassMap[h.toStatus])}>{h.toStatus.replace(/_/g, " ")}</span>
													</div>
													<p className="mt-0.5 text-[10px] text-white/30">
														<span>{fmtDate(h.changedAt)}</span>
														{h.changedBy ? <span> by {h.changedBy.fullName}</span> : null}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Quick Status + Rider Assign */}
							<div className="rounded-[14px] border border-white/10 bg-black/20 p-4">
								<h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-amber-400" /> Quick Actions</h4>
								<div className="space-y-3">
									<div>
										<p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/30">Update Status</p>
										<div className="flex flex-wrap gap-2">
											{ALL_STATUSES.map((s) => {
												const SI = statusIconMap[s];
												return (
													<button
														key={s}
														type="button"
														disabled={statusMut.isPending || selectedOrder.status === s}
														onClick={() => statusMut.mutate({ orderId: selectedOrder.id, status: s })}
														className={cn(
															"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
															selectedOrder.status === s
																? cn(statusClassMap[s], "font-bold")
																: "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/[0.06]",
														)}
													>
														<SI className="h-3 w-3" /> {s.replace(/_/g, " ")}
													</button>
												);
											})}
										</div>
									</div>

									{/* Rider assignment */}
									<div>
										<p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/30">Assign Rider</p>
										<Button
											variant="outline"
											className="h-8 rounded-[10px] border-violet-500/30 text-xs text-violet-400 hover:bg-violet-500/10"
											onClick={() => openRiderAssign(selectedOrder.id, selectedOrder.assignedRiderId)}
										>
											<Bike className="mr-1.5 h-3.5 w-3.5" />
											{selectedOrder.assignedRider ? `Change (${selectedOrder.assignedRider.fullName})` : "Assign Rider"}
										</Button>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-2 py-8 text-sm text-white/40"><Sparkles className="h-4 w-4" /> Loading order details...</div>
					)}

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setSelectedOrderId(null)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Create Order Modal ── */}
			<Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
				<DialogContent className={cn(modalContentClass, "max-h-[90vh] overflow-y-auto")}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Plus className="h-5 w-5 text-primary" />
							Create Manual Order
						</DialogTitle>
						<DialogDescription className="text-white/40">Place an order on behalf of a walk-in or phone customer.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Customer Name *</label>
								<Input className={inputClass} value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Full name" />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Phone *</label>
								<Input className={inputClass} value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="+569 9103 0440" />
							</div>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Email (optional)</label>
							<Input type="email" className={inputClass} value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="customer@email.com" />
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Delivery Address *</label>
							<Textarea className={cn(inputClass, "min-h-[60px]")} value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Full delivery address or 'Self Pickup'" />
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Notes (optional)</label>
							<Input className={inputClass} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Special instructions..." />
						</div>

						{/* Order Items */}
						<div>
							<div className="mb-2 flex items-center justify-between">
								<label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Order Items *</label>
								<button onClick={addOrderItem} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-accent">
									<Plus className="h-3 w-3" /> Add Item
								</button>
							</div>
							<div className="space-y-2">
								{newItems.map((item, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<Select value={item.publicId} onValueChange={(v) => updateOrderItem(idx, "publicId", v)}>
											<SelectTrigger className={cn(inputClass, "flex-1")}><SelectValue placeholder="Select product..." /></SelectTrigger>
											<SelectContent className="border-white/10 bg-[#1a1a22]">
												{products.filter((p) => p.isActive && p.isInStock).map((p) => (
													<SelectItem key={p.id} value={p.id}>{p.name} — {fmtCurrency(p.price)}</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="number"
											min={1}
											className={cn(inputClass, "w-20")}
											value={item.quantity}
											onChange={(e) => updateOrderItem(idx, "quantity", Math.max(1, Number(e.target.value)))}
										/>
										{newItems.length > 1 && (
											<button onClick={() => removeOrderItem(idx)} className="rounded-lg p-1.5 text-white/30 hover:bg-rose-500/10 hover:text-rose-400">
												<Trash2 className="h-4 w-4" />
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
						<Button className={btnPrimary} disabled={createOrderMut.isPending} onClick={() => createOrderMut.mutate()}>
							Create Order
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Bulk Status Modal ── */}
			<Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<ListChecks className="h-5 w-5 text-violet-400" />
							Bulk Status Update
						</DialogTitle>
						<DialogDescription className="text-white/40">Update {bulkSelected.size} selected orders to a new status.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">New Status</label>
							<Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as ApiOrder["status"])}>
								<SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3">
							<p className="text-xs text-white/40">Selected orders:</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{[...bulkSelected].slice(0, 20).map((id) => {
									const o = orders.find((x) => x.id === id);
									return (
										<span key={id} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/60">
											{o ? o.orderNumber : `#${id}`}
										</span>
									);
								})}
								{bulkSelected.size > 20 && <span className="text-[11px] text-white/30">+{bulkSelected.size - 20} more</span>}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setBulkModalOpen(false)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white"
							disabled={bulkStatusMut.isPending}
							onClick={() => bulkStatusMut.mutate()}
						>
							Update {bulkSelected.size} Orders
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Rider Assign Modal ── */}
			<Dialog open={riderModalOpen} onOpenChange={setRiderModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Bike className="h-5 w-5 text-violet-400" />
							Assign Rider
						</DialogTitle>
						<DialogDescription className="text-white/40">Select a delivery rider for this order.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Rider</label>
							<Select value={riderAssignId} onValueChange={setRiderAssignId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select rider..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{riders.map((r) => (
										<SelectItem key={r.id} value={String(r.id)}>
											{r.fullName} — {r.availability}
											{r.vehicle ? ` (${r.vehicle})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{riderAssignId && (() => {
							const r = riders.find((x) => x.id === Number(riderAssignId));
							if (!r) return null;
							return (
								<div className="flex items-center gap-3 rounded-[12px] border border-violet-400/20 bg-violet-400/5 p-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
										<UserCheck className="h-5 w-5 text-violet-400" />
									</div>
									<div>
										<p className="text-sm font-semibold text-white">{r.fullName}</p>
										<p className="text-xs text-white/40">{r.phone} &middot; {r.vehicle ?? "No vehicle"} &middot; <span className={cn(r.availability === "AVAILABLE" ? "text-emerald-400" : r.availability === "BUSY" ? "text-amber-400" : "text-rose-400")}>{r.availability}</span></p>
									</div>
								</div>
							);
						})()}

						{/* Unassign option */}
						{riderAssignId && (
							<button
								onClick={() => setRiderAssignId("")}
								className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
							>
								<X className="h-3 w-3" /> Remove rider assignment
							</button>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setRiderModalOpen(false)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white"
							disabled={assignRiderMut.isPending}
							onClick={() => assignRiderMut.mutate()}
						>
							{riderAssignId ? "Assign Rider" : "Remove Rider"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</ModuleScaffold>
	);
};

export default OrdersPage;
