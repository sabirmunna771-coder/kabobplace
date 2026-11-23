import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAdminInventoryWasteLog,
	createAdminOrder,
	createAdminProduct,
	getAdminBranches,
	getAdminCategories,
	getAdminDashboard,
	getAdminInventoryIngredients,
	getAdminKdsOverview,
	getAdminOrderSummary,
	getAdminOrders,
	getAdminProducts,
	getAdminRiders,
	getAdminRidersSummary,
	getAdminSalesAnalytics,
	getApiAssetUrl,
	type ApiOrder,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Activity,
	AlertTriangle,
	ArrowUpRight,
	Award,
	Ban,
	BarChart3,
	Bike,
	Box,
	Building2,
	CheckCircle2,
	ChefHat,
	Clock,
	Clock3,
	DollarSign,
	Flame,
	Hash,
	Layers,
	MessageSquare,
	Package,
	Plus,
	ShoppingCart,
	Sparkles,
	Star,
	Timer,
	TrendingDown,
	TrendingUp,
	Truck,
	User,
	Users,
	Utensils,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

type ActionModal = "order" | "product" | "waste" | "riders" | null;

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-lg [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

const btnPrimary = "rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]";

/* ── Helpers ───────────────────────────────────────────────── */

const statusBadgeClass = (status: string) => {
	if (status === "COMPLETED") return "border-emerald-400/25 bg-emerald-400/15 text-emerald-200";
	if (status === "CANCELLED") return "border-red-400/25 bg-red-400/15 text-red-200";
	if (status === "OUT_FOR_DELIVERY") return "border-sky-400/25 bg-sky-400/15 text-sky-200";
	if (status === "PREPARING") return "border-primary/30 bg-primary/15 text-primary";
	if (status === "CONFIRMED") return "border-amber-300/25 bg-amber-300/15 text-amber-200";
	return "border-white/20 bg-white/10 text-zinc-200";
};

const getGreeting = (fullName?: string | null) => {
	const hour = new Date().getHours();
	const firstName = fullName?.trim()?.split(/\s+/)?.[0] ?? "Admin";
	if (hour < 12) return `Good Morning, ${firstName}!`;
	if (hour < 18) return `Good Afternoon, ${firstName}!`;
	return `Good Evening, ${firstName}!`;
};

const minutesSince = (isoDate: string) => {
	const elapsedMs = Date.now() - new Date(isoDate).getTime();
	const minutes = Math.max(1, Math.floor(elapsedMs / 60000));
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
};

const safeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const formatHour = (hour: number) => {
	if (hour === 0) return "12 AM";
	if (hour < 12) return `${hour} AM`;
	if (hour === 12) return "12 PM";
	return `${hour - 12} PM`;
};

/* ── Main Component ────────────────────────────────────────── */

const OverviewPage = () => {
	const { token, user } = useAuth();
	const { formatPrice: formatCurrency, settings } = useSiteSettings();
	const queryClient = useQueryClient();
	const [activeModal, setActiveModal] = useState<ActionModal>(null);
	const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

	const [orderForm, setOrderForm] = useState({ customerName: "", customerPhone: "", deliveryAddress: "", productPublicId: "", quantity: "1" });
	const [productForm, setProductForm] = useState({ name: "", price: "", categoryId: "" });
	const [wasteForm, setWasteForm] = useState({ ingredientId: "", quantity: "1", reason: "Daily wastage" });

	/* ── Queries ─ */
	const dashboardQ = useQuery({ queryKey: ["admin-overview-dashboard"], queryFn: () => getAdminDashboard(token!), enabled: Boolean(token), refetchInterval: 10000 });
	const ordersQ = useQuery({ queryKey: ["admin-overview-orders"], queryFn: () => getAdminOrders(token!), enabled: Boolean(token), refetchInterval: 7000 });
	const orderSummaryQ = useQuery({ queryKey: ["admin-orders-summary"], queryFn: () => getAdminOrderSummary(token!), enabled: Boolean(token), refetchInterval: 10000 });
	const kdsQ = useQuery({ queryKey: ["admin-kds-overview"], queryFn: () => getAdminKdsOverview(token!), enabled: Boolean(token), refetchInterval: 8000 });
	const riderSummaryQ = useQuery({ queryKey: ["admin-riders-summary"], queryFn: () => getAdminRidersSummary(token!), enabled: Boolean(token), refetchInterval: 15000 });
	const salesQ = useQuery({ queryKey: ["admin-sales-analytics"], queryFn: () => getAdminSalesAnalytics(token!, { range: "LAST_7_DAYS", granularity: "DAILY" }), enabled: Boolean(token), refetchInterval: 30000 });
	const ingredientsQ = useQuery({ queryKey: ["admin-overview-ingredients"], queryFn: () => getAdminInventoryIngredients(token!), enabled: Boolean(token), refetchInterval: 15000 });
	const ridersQ = useQuery({ queryKey: ["admin-overview-riders"], queryFn: () => getAdminRiders(token!), enabled: Boolean(token), refetchInterval: 15000 });
	const branchesQ = useQuery({ queryKey: ["admin-overview-branches"], queryFn: () => getAdminBranches(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const categoriesQ = useQuery({ queryKey: ["admin-overview-categories"], queryFn: () => getAdminCategories(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const productsQ = useQuery({ queryKey: ["admin-overview-products"], queryFn: () => getAdminProducts(token!), enabled: Boolean(token), refetchInterval: 20000 });

	const recentOrders = (ordersQ.data?.orders ?? dashboardQ.data?.recentOrders ?? []).slice(0, 10);
	const allOrders = ordersQ.data?.orders ?? [];
	const ingredients = ingredientsQ.data?.ingredients ?? [];
	const riders = ridersQ.data?.riders ?? [];
	const branches = branchesQ.data?.branches ?? [];
	const categories = categoriesQ.data ?? [];
	const products = productsQ.data ?? [];
	const orderSummary = orderSummaryQ.data?.summary;
	const kds = kdsQ.data;
	const riderSummary = riderSummaryQ.data;
	const sales = salesQ.data;

	const avatarUrl = getApiAssetUrl(user?.profilePictureUrl);
	const greeting = getGreeting(user?.fullName);

	/* ── Mutations ─ */
	const inv = (...keys: string[]) => { keys.forEach((k) => void queryClient.invalidateQueries({ queryKey: [k] })); };
	const invAll = () => inv("admin-overview-orders", "admin-overview-dashboard", "admin-orders-page", "admin-orders-summary", "admin-kds-overview", "admin-riders-summary", "admin-sales-analytics");

	const createOrderMutation = useMutation({
		mutationFn: () => createAdminOrder(token!, {
			customerName: orderForm.customerName.trim(),
			customerPhone: orderForm.customerPhone.trim(),
			deliveryAddress: orderForm.deliveryAddress.trim(),
			items: [{ publicId: orderForm.productPublicId, quantity: Number(orderForm.quantity) || 1 }],
		}),
		onSuccess: () => { toast.success("Order created"); setActiveModal(null); setOrderForm({ customerName: "", customerPhone: "", deliveryAddress: "", productPublicId: "", quantity: "1" }); invAll(); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to create order"),
	});

	const createProductMutation = useMutation({
		mutationFn: () => {
			const name = productForm.name.trim();
			const slug = safeSlug(name);
			return createAdminProduct(token!, { name, slug, publicId: slug.toUpperCase(), price: Number(productForm.price) || 0, categoryId: Number(productForm.categoryId), isActive: true, isInStock: true });
		},
		onSuccess: () => { toast.success("Product added"); setActiveModal(null); setProductForm({ name: "", price: "", categoryId: "" }); inv("admin-overview-products", "admin-overview-dashboard", "admin-products-page"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to add product"),
	});

	const createWasteMutation = useMutation({
		mutationFn: () => createAdminInventoryWasteLog(token!, Number(wasteForm.ingredientId), { quantity: Number(wasteForm.quantity) || 1, reason: wasteForm.reason.trim() || "Daily wastage" }),
		onSuccess: () => { toast.success("Waste logged"); setActiveModal(null); setWasteForm({ ingredientId: "", quantity: "1", reason: "Daily wastage" }); inv("admin-overview-ingredients", "admin-inventory-ingredients-page"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to log waste"),
	});

	/* ── Computed metrics ─ */
	const metrics = useMemo(() => {
		const now = new Date();
		const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startYesterday = new Date(startToday);
		startYesterday.setDate(startYesterday.getDate() - 1);

		const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= startToday);
		const yesterdayOrders = allOrders.filter((o) => { const c = new Date(o.createdAt); return c >= startYesterday && c < startToday; });
		const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
		const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
		const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : (todayRevenue > 0 ? 100 : 0);

		const bestSellersMap = new Map<string, number>();
		for (const order of todayOrders) for (const item of order.items) bestSellersMap.set(item.productName, (bestSellersMap.get(item.productName) ?? 0) + item.quantity);
		const bestSellers = Array.from(bestSellersMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

		const lowStockCount = ingredients.filter((i) => i.isLowStock).length;

		return { todayRevenue, revenueChange, bestSellers, lowStockCount };
	}, [allOrders, ingredients]);

	const operationalHealth = useMemo(() => {
		const closedBranches = branches.filter((b) => b.status === "TEMPORARILY_CLOSED").length;
		const open = orderSummary?.openOrders ?? 0;
		if (closedBranches >= 2 || open > 18) return "Critical";
		if (closedBranches >= 1 || open > 10) return "Busy";
		return "Normal";
	}, [branches, orderSummary]);

	const canSeeFinancials = user?.role === "ADMIN";
	const canManageCatalog = user?.role === "ADMIN";
	const canManageOrders = user?.role === "ADMIN";
	const canManageInventory = user?.role === "ADMIN";

	const canSubmitOrder = orderForm.customerName.trim().length >= 2 && orderForm.customerPhone.trim().length >= 7 && orderForm.deliveryAddress.trim().length >= 4 && Boolean(orderForm.productPublicId);
	const canSubmitProduct = productForm.name.trim().length >= 2 && Number(productForm.price) > 0 && Boolean(productForm.categoryId);
	const canSubmitWaste = Boolean(wasteForm.ingredientId) && Number(wasteForm.quantity) > 0;

	/* ── Revenue sparkline bar chart (7 days) ─ */
	const revenueBars = sales?.revenueSeries ?? [];
	const maxRevenue = Math.max(1, ...revenueBars.map((b) => b.revenue));

	/* ── Peak hours distribution ─ */
	const peakHours = sales?.peakHours ?? [];
	const maxPeakCount = Math.max(1, ...peakHours.map((h) => h.count));

	return (
		<ModuleScaffold title="Overview" subtitle="" hideHeader>
			<div className="space-y-5">

			{/* ═══════ Header Bar ═══════ */}
			<div className={headerBarClass}>
				<div className="flex items-center gap-4">
					<div className="h-14 w-14 overflow-hidden rounded-[16px] border border-white/10 bg-black/20 shadow-lg">
						{avatarUrl && !avatarLoadFailed ? (
							<img src={avatarUrl} alt={user?.fullName ?? "User"} className="h-full w-full object-cover" onError={() => setAvatarLoadFailed(true)} />
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
								{(user?.fullName ?? "SA").slice(0, 2).toUpperCase()}
							</div>
						)}
					</div>
					<div>
						<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">{greeting}</h1>
						<p className="flex items-center gap-1.5 text-xs text-white/40">
							<Sparkles className="h-3 w-3" /> Command Center &middot; all systems online
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
						<span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
						<span className="text-[11px] font-medium text-emerald-300">Live</span>
					</div>
				</div>
			</div>

			{(dashboardQ.isLoading && ordersQ.isLoading) && <p className="text-sm text-white/40">Loading command center...</p>}
			{dashboardQ.isError && <p className="text-sm text-red-400">Unable to load overview data.</p>}

			{/* ═══════ Quick Actions ═══════ */}
			<div className="flex gap-2 overflow-x-auto rounded-[16px] border border-white/10 bg-[#0B3D0B]/30 p-2 backdrop-blur-xl">
				{canManageOrders && (
					<Button className="h-10 shrink-0 gap-2 rounded-[12px] bg-primary px-4 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105" onClick={() => setActiveModal("order")}>
						<Plus className="h-3.5 w-3.5" /> New Order
					</Button>
				)}
				{canManageCatalog && (
					<Button variant="outline" className="h-10 shrink-0 gap-2 rounded-[12px] border-white/10 bg-white/[0.03] px-4 text-xs text-white/70 hover:bg-white/[0.06]" onClick={() => setActiveModal("product")}>
						<ChefHat className="h-3.5 w-3.5" /> Add Product
					</Button>
				)}
				{canManageInventory && (
					<Button variant="outline" className="h-10 shrink-0 gap-2 rounded-[12px] border-rose-400/25 bg-rose-400/10 px-4 text-xs text-rose-300 hover:bg-rose-400/15" onClick={() => setActiveModal("waste")}>
						<AlertTriangle className="h-3.5 w-3.5" /> Log Waste
					</Button>
				)}
				<Button variant="outline" className="h-10 shrink-0 gap-2 rounded-[12px] border-white/10 bg-white/[0.03] px-4 text-xs text-white/70 hover:bg-white/[0.06]" onClick={() => setActiveModal("riders")}>
					<Bike className="h-3.5 w-3.5" /> Rider Fleet
				</Button>
			</div>

			{/* ═══════ Core KPI Cards (from Order Summary API) ═══════ */}
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{[
					{ label: "Today's Revenue", value: canSeeFinancials ? formatCurrency(metrics.todayRevenue) : "—", sub: canSeeFinancials ? `${metrics.revenueChange >= 0 ? "+" : ""}${metrics.revenueChange.toFixed(1)}% vs yesterday` : undefined, subColor: metrics.revenueChange >= 0 ? "text-emerald-400" : "text-rose-400", Icon: DollarSign, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400", glow: "bg-emerald-500/15" },
					{ label: "Open Orders", value: orderSummary?.openOrders ?? "—", sub: `${orderSummary?.urgentOrders ?? 0} urgent`, subColor: (orderSummary?.urgentOrders ?? 0) > 0 ? "text-rose-400" : "text-white/30", Icon: ShoppingCart, color: "from-primary/20 to-accent/20", text: "text-primary", glow: "bg-primary/15" },
					{ label: "Today Orders", value: orderSummary?.todayOrders ?? "—", Icon: Package, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400", glow: "bg-sky-500/15" },
					{ label: "Completed", value: orderSummary?.completedOrders ?? "—", Icon: CheckCircle2, color: "from-emerald-500/20 to-teal-500/20", text: "text-emerald-400", glow: "bg-emerald-500/15" },
					{ label: "Cancelled", value: orderSummary?.cancelledOrders ?? 0, Icon: Ban, color: "from-rose-500/20 to-red-500/20", text: "text-rose-400", glow: "bg-rose-500/15" },
					{ label: "Avg. Order", value: orderSummary ? formatCurrency(orderSummary.averageOrderValue) : "—", Icon: BarChart3, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400", glow: "bg-violet-500/15" },
				].map((s) => (
					<div key={s.label} className={panelClass}>
						<div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl", s.glow)} />
						<div className="relative flex items-center gap-2">
							<div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br", s.color)}>
								<s.Icon className={cn("h-4 w-4", s.text)} />
							</div>
							<span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{s.label}</span>
						</div>
						<p className="relative mt-2 text-2xl font-bold text-white">{s.value}</p>
						{s.sub && <p className={cn("mt-1 text-[11px]", s.subColor)}>{s.sub}</p>}
					</div>
				))}
			</div>

			{/* ═══════ Middle Row: Revenue Sparkline + Kitchen Pulse + Rider Fleet ═══════ */}
			<div className="grid gap-4 xl:grid-cols-3">

				{/* ─ Revenue Trend (7-day sparkline) ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Revenue Trend (7 Days)
					</h3>
					{revenueBars.length > 0 ? (
						<div className="flex items-end gap-1.5" style={{ height: 80 }}>
							{revenueBars.map((b, i) => (
								<div key={i} className="group/bar flex flex-1 flex-col items-center gap-1">
									<span className="hidden text-[9px] text-white/30 group-hover/bar:block">{formatCurrency(b.revenue)}</span>
									<div
										className="w-full rounded-t-[4px] bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all group-hover/bar:from-emerald-400 group-hover/bar:to-emerald-300"
										style={{ height: `${Math.max(4, (b.revenue / maxRevenue) * 100)}%` }}
									/>
									<span className="text-[9px] text-white/20">{b.label.slice(0, 3)}</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-white/20">No revenue data yet.</p>
					)}
					{sales?.summary && canSeeFinancials && (
						<div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
							<div>
								<p className="text-[10px] uppercase text-white/30">Total (7d)</p>
								<p className="text-sm font-bold text-white">{formatCurrency(sales.summary.totalRevenue)}</p>
							</div>
							<div>
								<p className="text-[10px] uppercase text-white/30">Net Profit</p>
								<p className="text-sm font-bold text-emerald-400">{formatCurrency(sales.summary.netProfit)}</p>
							</div>
							<div>
								<p className="text-[10px] uppercase text-white/30">Cancel Rate</p>
								<p className="text-sm font-bold text-rose-400">{sales.summary.cancellationRate.toFixed(1)}%</p>
							</div>
						</div>
					)}
				</div>

				{/* ─ Kitchen Pulse (from KDS Overview API) ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Flame className="h-3.5 w-3.5 text-accent" /> Kitchen Pulse
					</h3>
					<div className="grid grid-cols-3 gap-2">
						{[
							{ label: "Queue", value: kds?.summary.queueSize ?? "—", color: "text-amber-400" },
							{ label: "Preparing", value: kds?.summary.preparing ?? "—", color: "text-primary" },
							{ label: "Ready", value: kds?.summary.readyToDispatch ?? "—", color: "text-sky-400" },
						].map((k) => (
							<div key={k.label} className="rounded-[10px] border border-white/5 bg-black/20 p-2.5 text-center">
								<p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
								<p className="text-[10px] text-white/30">{k.label}</p>
							</div>
						))}
					</div>
					<div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
						<div className="flex items-center gap-1.5">
							<Timer className="h-3 w-3 text-violet-400" />
							<span className="text-xs text-white/50">Avg Prep: <span className="font-semibold text-white">{kds ? `${kds.summary.averagePrepMinutes}m` : "—"}</span></span>
						</div>
						<div className="flex items-center gap-1.5">
							<Clock className="h-3 w-3 text-amber-400" />
							<span className="text-xs text-white/50">Max Wait: <span className="font-semibold text-white">{kds ? `${kds.summary.maxQueueWaitMinutes}m` : "—"}</span></span>
						</div>
					</div>
					{(kds?.summary.overdue ?? 0) > 0 && (
						<div className="mt-2 flex items-center gap-2 rounded-[10px] border border-rose-400/30 bg-rose-400/10 px-3 py-2">
							<AlertTriangle className="h-4 w-4 text-rose-400" />
							<span className="text-xs font-semibold text-rose-300">{kds!.summary.overdue} overdue orders in kitchen</span>
						</div>
					)}
					{kds && kds.topItems.length > 0 && (
						<div className="mt-3">
							<p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/25">Top Items in Queue</p>
							<div className="flex flex-wrap gap-1.5">
								{kds.topItems.map((item) => (
									<span key={item.name} className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-black/20 px-2 py-0.5 text-[11px] text-white/50">
										<span className="font-bold text-primary">{item.quantity}</span> {item.name}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ─ Rider Fleet Intelligence (from Riders Summary API) ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Truck className="h-3.5 w-3.5 text-sky-400" /> Rider Fleet
					</h3>
					<div className="grid grid-cols-2 gap-2">
						{[
							{ label: "Available", value: riderSummary?.summary.available ?? "—", color: "text-emerald-400" },
							{ label: "Busy", value: riderSummary?.summary.busy ?? "—", color: "text-accent" },
							{ label: "Offline", value: riderSummary?.summary.offline ?? "—", color: "text-white/30" },
							{ label: "Deliveries", value: riderSummary?.summary.completedDeliveries ?? "—", color: "text-sky-400" },
						].map((r) => (
							<div key={r.label} className="rounded-[10px] border border-white/5 bg-black/20 p-2.5">
								<p className={cn("text-lg font-bold", r.color)}>{r.value}</p>
								<p className="text-[10px] text-white/30">{r.label}</p>
							</div>
						))}
					</div>
					{riderSummary && riderSummary.topRiders.length > 0 && (
						<div className="mt-3 border-t border-white/5 pt-3">
							<p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/25">Top Performers</p>
							<div className="space-y-1.5">
								{riderSummary.topRiders.slice(0, 3).map((entry, i) => (
									<div key={entry.rider.id} className="flex items-center justify-between rounded-[8px] border border-white/5 bg-black/15 px-2.5 py-1.5">
										<div className="flex items-center gap-2">
											<span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-[10px] font-bold text-primary">
												{i === 0 ? <Award className="h-3 w-3" /> : i + 1}
											</span>
											<span className="text-xs text-white/70">{entry.rider.fullName}</span>
										</div>
										<div className="flex items-center gap-3 text-[10px]">
											<span className="text-white/40">{entry.deliveries} runs</span>
											<span className="text-sky-300">{entry.averageDeliveryMinutes}m avg</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ═══════ Low Stock + Best Sellers + Operational Health ═══════ */}
			<div className="grid gap-4 lg:grid-cols-3">
				{/* ─ Low Stock ─ */}
				<div className={cn(panelClass, metrics.lowStockCount > 0 && "!border-rose-400/30 !from-rose-500/[0.08] !to-white/[0.02]")}>
					<div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl", metrics.lowStockCount > 0 ? "bg-rose-500/20" : "bg-white/5")} />
					<div className="relative flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-rose-500/20 to-red-500/20">
							<AlertTriangle className="h-4 w-4 text-rose-400" />
						</div>
						<span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Low Stock Alerts</span>
					</div>
					<p className="relative mt-2 text-3xl font-bold text-white">{metrics.lowStockCount}</p>
					<p className="mt-1 text-xs text-white/30">Ingredients below minimum threshold</p>
					{metrics.lowStockCount > 0 && (
						<div className="mt-3 max-h-[120px] space-y-1 overflow-y-auto">
							{ingredients.filter((i) => i.isLowStock).slice(0, 6).map((i) => (
								<div key={i.id} className="flex items-center justify-between rounded-[8px] border border-rose-400/15 bg-rose-400/5 px-2.5 py-1">
									<span className="text-xs text-white/60">{i.name}</span>
									<span className="text-[10px] font-bold text-rose-300">{i.currentQty} / {i.minQty} {i.unit}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* ─ Best Sellers ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Star className="h-3.5 w-3.5 text-amber-400" /> Best Sellers Today
					</h3>
					{metrics.bestSellers.length > 0 ? (
						<div className="space-y-2">
							{metrics.bestSellers.map(([name, qty], i) => (
								<div key={name} className="flex items-center gap-3 rounded-[10px] border border-white/5 bg-black/20 px-3 py-2">
									<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 text-[11px] font-bold text-primary">{i + 1}</span>
									<span className="flex-1 truncate text-sm text-white/70">{name}</span>
									<span className="text-sm font-bold text-primary">{qty}</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-white/20">No sales recorded today.</p>
					)}
					{sales && sales.topProducts.length > 0 && (
						<div className="mt-3 border-t border-white/5 pt-3">
							<p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/25">Top by Revenue (7d)</p>
							<div className="space-y-1">
								{sales.topProducts.slice(0, 3).map((p) => (
									<div key={p.productName} className="flex items-center justify-between text-[11px] text-white/40">
										<span>{p.productName}</span>
										<span className="font-semibold text-emerald-300">{formatCurrency(p.revenue)}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ─ Branch & Operational Health ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Building2 className="h-3.5 w-3.5 text-violet-400" /> Branch Health
					</h3>
					<div className="mb-3 flex items-center gap-3 rounded-[12px] border border-white/10 bg-black/20 px-3 py-2.5">
						<Activity className={cn("h-5 w-5", operationalHealth === "Normal" ? "text-emerald-400" : operationalHealth === "Busy" ? "text-primary" : "text-rose-400")} />
						<div>
							<p className={cn("text-sm font-bold", operationalHealth === "Normal" ? "text-emerald-300" : operationalHealth === "Busy" ? "text-primary" : "text-rose-300")}>{operationalHealth}</p>
							<p className="text-[10px] text-white/30">System-wide operational status</p>
						</div>
					</div>
					<div className="space-y-1.5 max-h-[140px] overflow-y-auto">
						{branches.map((b) => (
							<div key={b.id} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
								<div>
									<p className="text-xs font-medium text-white/70">{b.name}</p>
									<p className="text-[10px] text-white/30">
										<Users className="mr-0.5 inline h-2.5 w-2.5" />{b.counts?.staffMembers ?? 0} staff &middot;
										<Truck className="mx-0.5 inline h-2.5 w-2.5" />{b.counts?.riders ?? 0} riders
									</p>
								</div>
								<span className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-bold",
									b.status === "ACTIVE" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border border-rose-400/20 bg-rose-400/10 text-rose-300",
								)}>{b.status === "ACTIVE" ? "Active" : "Closed"}</span>
							</div>
						))}
						{branches.length === 0 && <p className="text-xs text-white/20">No branches configured.</p>}
					</div>
				</div>
			</div>

			{/* ═══════ Bottom Row: Live Orders + Peak Hours ═══════ */}
			<div className="grid gap-4 xl:grid-cols-[1.5fr_0.5fr]">

				{/* ─ Live Order Ticker ─ */}
				<div className={panelClass}>
					<div className="mb-3 flex items-center justify-between">
						<h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<Zap className="h-3.5 w-3.5 text-accent" /> Live Order Feed
						</h3>
						<span className="text-[11px] text-white/25">{recentOrders.length} latest</span>
					</div>
					<div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
						{recentOrders.map((order) => (
							<div key={order.id} className="flex items-center justify-between rounded-[12px] border border-white/5 bg-black/15 px-3 py-2 text-sm transition-all hover:border-white/10 hover:bg-black/25">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-semibold text-white/70">{order.orderNumber}</span>
										<span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", statusBadgeClass(order.status))}>{order.status.replace(/_/g, " ")}</span>
									</div>
									<p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/30">
										<User className="h-2.5 w-2.5" /> {order.customerName}
										<span className="mx-1 text-white/10">&middot;</span>
										<Clock3 className="h-2.5 w-2.5" /> {minutesSince(order.createdAt)}
										{order.assignedRider && (
											<>
												<span className="mx-1 text-white/10">&middot;</span>
												<Bike className="h-2.5 w-2.5 text-violet-300" /> {order.assignedRider.fullName}
											</>
										)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs font-bold text-white/50">{formatCurrency(order.total)}</span>
									<ArrowUpRight className="h-3.5 w-3.5 text-white/15" />
								</div>
							</div>
						))}
						{recentOrders.length === 0 && !ordersQ.isLoading && <p className="py-8 text-center text-xs text-white/20">No recent orders yet.</p>}
					</div>
				</div>

				{/* ─ Peak Hours ─ */}
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Clock className="h-3.5 w-3.5 text-amber-400" /> Peak Hours
					</h3>
					{peakHours.length > 0 ? (
						<div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
							{peakHours.filter((h) => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 12).map((h) => (
								<div key={h.hour} className="flex items-center gap-2">
									<span className="w-12 text-right text-[11px] text-white/30">{formatHour(h.hour)}</span>
									<div className="flex-1 rounded-full bg-white/5" style={{ height: 6 }}>
										<div
											className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
											style={{ width: `${Math.max(4, (h.count / maxPeakCount) * 100)}%` }}
										/>
									</div>
									<span className="w-6 text-[10px] font-bold text-white/40">{h.count}</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-white/20">No peak hour data yet.</p>
					)}
				</div>
			</div>

			</div>

			{/* ═══════ Order Modal ═══════ */}
			<Dialog open={activeModal === "order"} onOpenChange={(v) => setActiveModal(v ? "order" : null)}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white"><Plus className="h-5 w-5 text-primary" /> New Order</DialogTitle>
						<DialogDescription className="text-white/40">Create a quick order from the command center.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Customer Name</Label><Input className={inputClass} value={orderForm.customerName} onChange={(e) => setOrderForm((p) => ({ ...p, customerName: e.target.value }))} /></div>
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Phone</Label><Input className={inputClass} value={orderForm.customerPhone} onChange={(e) => setOrderForm((p) => ({ ...p, customerPhone: e.target.value }))} /></div>
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Delivery Address</Label><Input className={inputClass} value={orderForm.deliveryAddress} onChange={(e) => setOrderForm((p) => ({ ...p, deliveryAddress: e.target.value }))} /></div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Product</Label>
								<select className={cn(inputClass, "h-10 w-full border px-3")} value={orderForm.productPublicId} onChange={(e) => setOrderForm((p) => ({ ...p, productPublicId: e.target.value }))}>
									<option value="">Select Product</option>
									{products.slice(0, 30).map((p) => <option key={p.dbId} value={p.id}>{p.name}</option>)}
								</select>
							</div>
							<div>
								<Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Quantity</Label>
								<Input type="number" min={1} className={inputClass} value={orderForm.quantity} onChange={(e) => setOrderForm((p) => ({ ...p, quantity: e.target.value }))} />
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setActiveModal(null)}>Cancel</Button>
						<Button className={btnPrimary} onClick={() => createOrderMutation.mutate()} disabled={!canSubmitOrder || createOrderMutation.isPending}>{createOrderMutation.isPending ? "Creating..." : "Create Order"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Product Modal ═══════ */}
			<Dialog open={activeModal === "product"} onOpenChange={(v) => setActiveModal(v ? "product" : null)}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white"><ChefHat className="h-5 w-5 text-primary" /> Add Product</DialogTitle>
						<DialogDescription className="text-white/40">Quick-add a menu product.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Product Name</Label><Input className={inputClass} value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} /></div>
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Price ({settings.currencySymbol || "$"})</Label><Input type="number" min={0} className={inputClass} value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} /></div>
						<div>
							<Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Category</Label>
							<select className={cn(inputClass, "h-10 w-full border px-3")} value={productForm.categoryId} onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))}>
								<option value="">Select Category</option>
								{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setActiveModal(null)}>Cancel</Button>
						<Button className={btnPrimary} onClick={() => createProductMutation.mutate()} disabled={!canSubmitProduct || createProductMutation.isPending}>{createProductMutation.isPending ? "Adding..." : "Add Product"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Waste Modal ═══════ */}
			<Dialog open={activeModal === "waste"} onOpenChange={(v) => setActiveModal(v ? "waste" : null)}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white"><AlertTriangle className="h-5 w-5 text-rose-400" /> Log Waste</DialogTitle>
						<DialogDescription className="text-white/40">Record inventory loss for real-time stock intelligence.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div>
							<Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Ingredient</Label>
							<select className={cn(inputClass, "h-10 w-full border px-3")} value={wasteForm.ingredientId} onChange={(e) => setWasteForm((p) => ({ ...p, ingredientId: e.target.value }))}>
								<option value="">Select Ingredient</option>
								{ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.currentQty} {i.unit})</option>)}
							</select>
						</div>
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Quantity</Label><Input type="number" min={0.001} step="0.001" className={inputClass} value={wasteForm.quantity} onChange={(e) => setWasteForm((p) => ({ ...p, quantity: e.target.value }))} /></div>
						<div><Label className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">Reason</Label><Input className={inputClass} value={wasteForm.reason} onChange={(e) => setWasteForm((p) => ({ ...p, reason: e.target.value }))} /></div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setActiveModal(null)}>Cancel</Button>
						<Button className={btnPrimary} onClick={() => createWasteMutation.mutate()} disabled={!canSubmitWaste || createWasteMutation.isPending}>{createWasteMutation.isPending ? "Logging..." : "Log Waste"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Riders Modal ═══════ */}
			<Dialog open={activeModal === "riders"} onOpenChange={(v) => setActiveModal(v ? "riders" : null)}>
				<DialogContent className={cn(modalContentClass, "sm:max-w-xl")}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white"><Truck className="h-5 w-5 text-sky-400" /> Rider Fleet Status</DialogTitle>
						<DialogDescription className="text-white/40">Live rider availability and performance.</DialogDescription>
					</DialogHeader>
					{riderSummary && (
						<div className="mb-3 grid grid-cols-4 gap-2">
							{[
								{ label: "Total", value: riderSummary.summary.totalRiders, color: "text-white" },
								{ label: "Available", value: riderSummary.summary.available, color: "text-emerald-400" },
								{ label: "Busy", value: riderSummary.summary.busy, color: "text-accent" },
								{ label: "Offline", value: riderSummary.summary.offline, color: "text-white/30" },
							].map((s) => (
								<div key={s.label} className="rounded-[10px] border border-white/5 bg-black/20 p-2 text-center">
									<p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
									<p className="text-[9px] text-white/30">{s.label}</p>
								</div>
							))}
						</div>
					)}
					<div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
						{riders.map((rider) => (
							<div key={rider.id} className="flex items-center justify-between rounded-[12px] border border-white/5 bg-black/15 px-3 py-2 text-sm">
								<div className="flex items-center gap-2 text-white/70"><User className="h-3.5 w-3.5 text-white/30" /> {rider.fullName}</div>
								<span className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-bold",
									rider.availability === "AVAILABLE" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
										: rider.availability === "BUSY" ? "border border-accent/20 bg-accent/10 text-accent"
											: "border border-white/10 bg-white/5 text-white/30",
								)}>{rider.availability}</span>
							</div>
						))}
						{riders.length === 0 && <p className="py-4 text-center text-xs text-white/20">No riders available.</p>}
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setActiveModal(null)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</ModuleScaffold>
	);
};

export default OverviewPage;
