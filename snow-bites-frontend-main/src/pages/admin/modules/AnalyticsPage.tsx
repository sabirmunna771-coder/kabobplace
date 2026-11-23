import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	getAdminKdsOverview,
	getAdminOrderSummary,
	getAdminRidersSummary,
	getAdminSalesAnalytics,
	type AnalyticsGranularity,
	type AnalyticsRangePreset,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";
import {
	ArrowDown,
	ArrowUp,
	Award,
	BarChart3,
	Calendar,
	ChefHat,
	Clock,
	DollarSign,
	Flame,
	Hash,
	LineChart,
	Package,
	Percent,
	ShoppingCart,
	Sparkles,
	Timer,
	TrendingDown,
	TrendingUp,
	Trophy,
	Truck,
	Users,
	XCircle,
	Zap,
} from "lucide-react";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

type RangeTab = { key: AnalyticsRangePreset; label: string };
const rangeTabs: RangeTab[] = [
	{ key: "LAST_7_DAYS", label: "7 Days" },
	{ key: "LAST_30_DAYS", label: "30 Days" },
	{ key: "THIS_MONTH", label: "This Month" },
];
type GranTab = { key: AnalyticsGranularity; label: string };
const granTabs: GranTab[] = [
	{ key: "DAILY", label: "Daily" },
	{ key: "WEEKLY", label: "Weekly" },
	{ key: "MONTHLY", label: "Monthly" },
];

/* ── Sparkline SVG ─ */
const Sparkline = ({ data, color = "#F2C41C", height = 40 }: { data: number[]; color?: string; height?: number }) => {
	if (data.length < 2) return null;
	const max = Math.max(...data, 1);
	const w = 200;
	const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4)}`).join(" ");
	return (
		<svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
			<defs>
				<linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity="0.3" />
					<stop offset="100%" stopColor={color} stopOpacity="0" />
				</linearGradient>
			</defs>
			<polygon points={`0,${height} ${pts} ${w},${height}`} fill={`url(#spark-${color.replace("#", "")})`} />
			<polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

/* ── Horizontal Bar ─ */
const HBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
	<div className="h-2 flex-1 rounded-full bg-white/5">
		<div className="h-full rounded-full transition-all duration-500" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} />
	</div>
);

/* ── Main Component ────────────────────────────────────────── */

const AnalyticsPage = () => {
	const { token } = useAuth();
	const { formatPrice: formatCurrency } = useSiteSettings();
	const [range, setRange] = useState<AnalyticsRangePreset>("LAST_30_DAYS");
	const [granularity, setGranularity] = useState<AnalyticsGranularity>("DAILY");

	/* ── Queries ─ */
	const salesQ = useQuery({
		queryKey: ["admin-analytics-sales", range, granularity],
		queryFn: () => getAdminSalesAnalytics(token!, { range, granularity }),
		enabled: Boolean(token),
		refetchInterval: 30000,
	});
	const orderSumQ = useQuery({
		queryKey: ["admin-analytics-order-summary"],
		queryFn: () => getAdminOrderSummary(token!),
		enabled: Boolean(token),
		refetchInterval: 15000,
	});
	const kdsQ = useQuery({
		queryKey: ["admin-analytics-kds"],
		queryFn: () => getAdminKdsOverview(token!),
		enabled: Boolean(token),
		refetchInterval: 10000,
	});
	const ridersQ = useQuery({
		queryKey: ["admin-analytics-riders"],
		queryFn: () => getAdminRidersSummary(token!),
		enabled: Boolean(token),
		refetchInterval: 15000,
	});

	/* ── Derived data ─ */
	const summary = salesQ.data?.summary;
	const revSeries = salesQ.data?.revenueSeries ?? [];
	const volSeries = salesQ.data?.orderVolumeSeries ?? [];
	const topProducts = salesQ.data?.topProducts ?? [];
	const peakHours = salesQ.data?.peakHours ?? [];
	const oSum = orderSumQ.data?.summary;
	const kds = kdsQ.data?.summary;
	const riderSum = ridersQ.data?.summary;
	const topRiders = ridersQ.data?.topRiders ?? [];

	const revData = useMemo(() => revSeries.map((p) => p.revenue), [revSeries]);
	const ordData = useMemo(() => volSeries.map((p) => p.receivedOrders), [volSeries]);
	const peakMax = useMemo(() => Math.max(...peakHours.map((h) => h.count), 1), [peakHours]);
	const topProdMax = useMemo(() => Math.max(...topProducts.map((p) => p.revenue), 1), [topProducts]);

	return (
		<ModuleScaffold title="Analytics" subtitle="" hideHeader>
			<div className="space-y-5">

			{/* ═══════ Header Bar ═══════ */}
			<div className={headerBarClass}>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/20">
						<BarChart3 className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Analytics & Intelligence</h1>
						<p className="flex items-center gap-1.5 text-xs text-white/40">
							<Sparkles className="h-3 w-3" /> Real-time performance across sales, KDS, and fleet
						</p>
					</div>
				</div>
				{(salesQ.isLoading || orderSumQ.isLoading) && <p className="text-sm text-white/40">Computing analytics intelligence...</p>}
			</div>

			{/* ═══════ Range + Granularity Controls ═══════ */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{rangeTabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setRange(t.key)}
							className={cn(
								"whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition-all",
								range === t.key
									? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
									: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
							)}
						>
							<Calendar className="mr-1.5 inline h-3 w-3" />{t.label}
						</button>
					))}
				</div>
				<div className="flex gap-1 rounded-[14px] border border-white/10 bg-white/[0.03] p-1">
					{granTabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setGranularity(t.key)}
							className={cn(
								"rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all",
								granularity === t.key ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50",
							)}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>

			{/* ═══════ KPI Cards Row 1 — Sales ═══════ */}
			{summary && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{[
						{ label: "Total Revenue", value: formatCurrency(summary.totalRevenue), Icon: DollarSign, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400", trend: summary.totalRevenue > 0 },
						{ label: "Total Orders", value: summary.totalOrders, Icon: ShoppingCart, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
						{ label: "Avg Order Value", value: formatCurrency(summary.averageOrderValue), Icon: TrendingUp, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
						{ label: "Net Profit", value: formatCurrency(summary.netProfit), Icon: Zap, color: "from-primary/20 to-accent/20", text: "text-primary", trend: summary.netProfit > 0 },
					].map((s) => (
						<div key={s.label} className={panelClass}>
							<div className="flex items-center gap-2">
								<div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br", s.color)}>
									<s.Icon className={cn("h-4 w-4", s.text)} />
								</div>
								<span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{s.label}</span>
							</div>
							<p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
							{s.trend !== undefined && (
								<div className={cn("mt-1 flex items-center gap-1 text-[10px] font-medium", s.trend ? "text-emerald-400" : "text-rose-400")}>
									{s.trend ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
									{s.trend ? "Profitable" : "Loss"}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* ═══════ KPI Cards Row 2 — Operations ═══════ */}
			{summary && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{[
						{ label: "Completed", value: summary.completedOrders, Icon: Package, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
						{ label: "Cancelled", value: summary.cancelledOrders, Icon: XCircle, color: "from-rose-500/20 to-red-500/20", text: "text-rose-400" },
						{ label: "Cancel Rate", value: `${summary.cancellationRate.toFixed(1)}%`, Icon: Percent, color: "from-pink-500/20 to-rose-500/20", text: "text-pink-400" },
						{ label: "Ingredient Cost", value: formatCurrency(summary.estimatedIngredientCost), Icon: Flame, color: "from-accent/20 to-primary/20", text: "text-accent" },
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
			)}

				{/* ═══════ Revenue Trend Chart ═══════ */}
				{revSeries.length > 1 && (
					<div className={panelClass}>
						<h3 className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<LineChart className="h-3.5 w-3.5 text-emerald-400" /> Revenue Trend
						</h3>
						<div className="space-y-2">
							{[
								{ label: "Today's Orders", value: oSum.todayOrders, color: "text-sky-400" },
								{ label: "Open Orders", value: oSum.openOrders, color: "text-amber-400" },
								{ label: "Unassigned", value: oSum.unassignedOrders, color: "text-primary" },
								{ label: "Urgent (>45m)", value: oSum.urgentOrders, color: "text-rose-400" },
								{ label: "Today Revenue", value: formatCurrency(oSum.revenueTotal), color: "text-emerald-400" },
							].map((r) => (
								<div key={r.label} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
									<span className="text-[11px] text-white/40">{r.label}</span>
									<span className={cn("text-sm font-bold", r.color)}>{r.value}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ═══════ Order Volume Chart ═══════ */}
				{volSeries.length > 1 && (
					<div className={panelClass}>
						<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<ChefHat className="h-3.5 w-3.5 text-accent" /> Kitchen Pulse
						</h3>
						<div className="space-y-2">
							{[
								{ label: "Queue Size", value: kds.queueSize, color: "text-sky-400" },
								{ label: "Preparing", value: kds.preparing, color: "text-primary" },
								{ label: "Ready to Dispatch", value: kds.readyToDispatch, color: "text-emerald-400" },
								{ label: "Overdue", value: kds.overdue, color: "text-rose-400" },
								{ label: "Avg Prep Time", value: `${kds.averagePrepMinutes}m`, color: "text-violet-400" },
								{ label: "Max Wait", value: `${kds.maxQueueWaitMinutes}m`, color: "text-pink-400" },
							].map((r) => (
								<div key={r.label} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
									<span className="text-[11px] text-white/40">{r.label}</span>
									<span className={cn("text-sm font-bold", r.color)}>{r.value}</span>
								</div>
							))}
						</div>
						<div className="mt-2 flex items-center gap-4 text-[10px]">
							<span className="flex items-center gap-1 text-sky-400"><span className="h-2 w-2 rounded-full bg-sky-400" /> Received</span>
							<span className="flex items-center gap-1 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed</span>
						</div>
					</div>
				)}

				{/* ═══════ Middle Grid: Operations + Kitchen + Riders ═══════ */}
				<div className="grid gap-3 lg:grid-cols-3">
					{/* Live Operations */}
					{oSum && (
						<div className={panelClass}>
							<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
								<Zap className="h-3.5 w-3.5 text-amber-400" /> Live Operations
							</h3>
							<div className="space-y-2">
								{[
									{ label: "Today's Orders", value: oSum.todayOrders, color: "text-sky-400" },
									{ label: "Open Orders", value: oSum.openOrders, color: "text-amber-400" },
									{ label: "Unassigned", value: oSum.unassignedOrders, color: "text-orange-400" },
									{ label: "Urgent (>45m)", value: oSum.urgentOrders, color: "text-rose-400" },
									{ label: "Today Revenue", value: formatCurrency(oSum.revenueTotal), color: "text-emerald-400" },
								].map((r) => (
									<div key={r.label} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
										<span className="text-[11px] text-white/40">{r.label}</span>
										<span className={cn("text-sm font-bold", r.color)}>{r.value}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Kitchen Pulse */}
					{kds && (
						<div className={panelClass}>
							<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
								<ChefHat className="h-3.5 w-3.5 text-orange-400" /> Kitchen Pulse
							</h3>
							<div className="space-y-2">
								{[
									{ label: "Queue Size", value: kds.queueSize, color: "text-sky-400" },
									{ label: "Preparing", value: kds.preparing, color: "text-orange-400" },
									{ label: "Ready to Dispatch", value: kds.readyToDispatch, color: "text-emerald-400" },
									{ label: "Overdue", value: kds.overdue, color: "text-rose-400" },
									{ label: "Avg Prep Time", value: `${kds.averagePrepMinutes}m`, color: "text-violet-400" },
									{ label: "Max Wait", value: `${kds.maxQueueWaitMinutes}m`, color: "text-pink-400" },
								].map((r) => (
									<div key={r.label} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
										<span className="text-[11px] text-white/40">{r.label}</span>
										<span className={cn("text-sm font-bold", r.color)}>{r.value}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Rider Fleet */}
					{riderSum && (
						<div className={panelClass}>
							<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
								<Truck className="h-3.5 w-3.5 text-sky-400" /> Rider Fleet
							</h3>
							<div className="space-y-2">
								{[
									{ label: "Total Riders", value: riderSum.totalRiders, color: "text-sky-400" },
									{ label: "Available", value: riderSum.available, color: "text-emerald-400" },
									{ label: "Busy", value: riderSum.busy, color: "text-orange-400" },
									{ label: "Offline", value: riderSum.offline, color: "text-white/30" },
									{ label: "Completed Deliveries", value: riderSum.completedDeliveries, color: "text-violet-400" },
								].map((r) => (
									<div key={r.label} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/15 px-3 py-2">
										<span className="text-[11px] text-white/40">{r.label}</span>
										<span className={cn("text-sm font-bold", r.color)}>{r.value}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ═══════ Bottom Grid: Top Products + Peak Hours + Top Riders ═══════ */}
				<div className="grid gap-3 lg:grid-cols-3">
					{/* Top Products */}
					<div className={panelClass}>
						<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<Trophy className="h-3.5 w-3.5 text-amber-400" /> Top Products
						</h3>
						{topProducts.length === 0 && !salesQ.isLoading && (
							<p className="py-6 text-center text-sm text-white/30">No product data in this range.</p>
						)}
						<div className="space-y-2">
							{topProducts.slice(0, 5).map((product, i) => (
								<div key={product.productName} className="flex items-center gap-3 rounded-[12px] border border-white/5 bg-black/15 px-3 py-2.5">
									<div className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold",
										i === 0 ? "bg-gradient-to-br from-amber-400/30 to-yellow-400/30 text-amber-200" : i === 1 ? "bg-gradient-to-br from-gray-300/20 to-white/10 text-gray-200" : i === 2 ? "bg-gradient-to-br from-primary/30 to-accent/20 text-primary" : "bg-white/5 text-white/30",
									)}>
										{i < 3 ? <Award className="h-3.5 w-3.5" /> : i + 1}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[11px] font-semibold text-white/70">{product.productName}</p>
										<div className="mt-1 flex items-center gap-2">
											<HBar value={product.revenue} max={topProdMax} color="#F2C41C" />
											<span className="shrink-0 text-[10px] font-bold text-primary">{formatCurrency(product.revenue)}</span>
										</div>
										<p className="mt-0.5 text-[9px] text-white/25">Qty {product.quantity}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Peak Hours */}
					<div className={panelClass}>
						<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<Clock className="h-3.5 w-3.5 text-violet-400" /> Peak Hours
						</h3>
						{peakHours.length === 0 && !salesQ.isLoading && (
							<p className="py-6 text-center text-sm text-white/30">No hourly data available.</p>
						)}
						<div className="space-y-0.5">
							{peakHours.filter((h) => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 10).map((h) => {
								const label = `${h.hour.toString().padStart(2, "0")}:00`;
								const intensity = h.count / peakMax;
								return (
									<div key={h.hour} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5">
										<span className="w-10 text-right text-[10px] font-medium text-white/40">{label}</span>
										<div className="flex-1">
											<div className="h-3 rounded-full bg-white/5">
												<div
													className="h-full rounded-full transition-all duration-500"
													style={{
														width: `${intensity * 100}%`,
														background: intensity > 0.75 ? "linear-gradient(90deg, #F2C41C, #A0D000)" : intensity > 0.4 ? "linear-gradient(90deg, #8b5cf6, #a855f7)" : "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
													}}
												/>
											</div>
										</div>
										<span className={cn("w-6 text-right text-[10px] font-bold", intensity > 0.75 ? "text-primary" : intensity > 0.4 ? "text-violet-300" : "text-white/25")}>{h.count}</span>
									</div>
								);
							})}
						</div>
					</div>

					{/* Top Riders */}
					<div className={panelClass}>
						<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<Users className="h-3.5 w-3.5 text-sky-400" /> Top Riders
						</h3>
						{topRiders.length === 0 && !ridersQ.isLoading && (
							<p className="py-6 text-center text-sm text-white/30">No rider data available.</p>
						)}
						<div className="space-y-2">
							{topRiders.slice(0, 6).map((entry, i) => (
								<div key={entry.rider.id} className="flex items-center gap-3 rounded-[12px] border border-white/5 bg-black/15 px-3 py-2">
									<div className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold",
										i === 0 ? "bg-gradient-to-br from-amber-400/30 to-yellow-400/30 text-amber-200" : i === 1 ? "bg-gradient-to-br from-gray-300/20 to-white/10 text-gray-200" : i === 2 ? "bg-gradient-to-br from-primary/30 to-accent/20 text-primary" : "bg-white/5 text-white/30",
									)}>
										{i < 3 ? <Award className="h-3.5 w-3.5" /> : i + 1}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate text-[11px] font-semibold text-white/70">{entry.rider.fullName}</span>
											<span className={cn("h-1.5 w-1.5 rounded-full", entry.rider.availability === "AVAILABLE" ? "bg-emerald-400" : entry.rider.availability === "BUSY" ? "bg-accent" : "bg-white/20")} />
										</div>
										<div className="mt-0.5 flex items-center gap-3 text-[9px] text-white/30">
											<span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" /> {entry.deliveries}</span>
											<span className="flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" /> {entry.averageDeliveryMinutes}m</span>
											<span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" /> {formatCurrency(entry.completedRevenue)}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

			</div>
		</ModuleScaffold>
	);
};

export default AnalyticsPage;
