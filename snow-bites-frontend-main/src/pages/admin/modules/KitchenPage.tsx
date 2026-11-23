import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	bulkAdvanceAdminKdsOrders,
	getAdminKdsOverview,
	getAdminOrders,
	updateAdminOrderStatus,
	type ApiOrder,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	ChefHat,
	ChevronRight,
	CircleDot,
	Clock,
	Clock3,
	Flame,
	Hash,
	Layers,
	ListChecks,
	MessageSquare,
	Package,
	Pause,
	Play,
	Sparkles,
	Timer,
	TrendingUp,
	Truck,
	User,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-lg [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

type KdsLane = "confirmed" | "preparing" | "ready";

const KDS_STATUSES: ApiOrder["status"][] = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];

/* ── Helpers ───────────────────────────────────────────────── */

const getElapsedMinutes = (v: string) => Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60000));

const formatElapsed = (v: string) => {
	const mins = getElapsedMinutes(v);
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	return `${hrs}h ${mins % 60}m`;
};

const urgencyColor = (mins: number) =>
	mins >= 30 ? "text-rose-400" : mins >= 15 ? "text-amber-400" : "text-emerald-400";

const urgencyBorder = (mins: number) =>
	mins >= 30
		? "border-rose-400/40 bg-[linear-gradient(180deg,rgba(251,113,133,0.12),rgba(255,255,255,0.02))] shadow-[0_0_20px_rgba(251,113,133,0.2)]"
		: mins >= 15
			? "border-amber-400/30 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(255,255,255,0.02))]"
			: "border-white/12";

/* ── Ticket Card ───────────────────────────────────────────── */

const TicketCard = ({
	order,
	isUpdating,
	lane,
	isSelected,
	onSelect,
	onAdvance,
}: {
	order: ApiOrder;
	isUpdating: boolean;
	lane: KdsLane;
	isSelected: boolean;
	onSelect: (id: number) => void;
	onAdvance: (orderId: number) => void;
}) => {
	const mins = getElapsedMinutes(order.createdAt);
	const isOverdue = mins >= 15;

	const advanceLabel =
		lane === "confirmed" ? "Start Preparing" : lane === "preparing" ? "Mark Ready" : "Dispatched";
	const advanceIcon =
		lane === "confirmed" ? <Play className="mr-1.5 h-3.5 w-3.5" /> : lane === "preparing" ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Truck className="mr-1.5 h-3.5 w-3.5" />;
	const advanceColor =
		lane === "confirmed"
			? "from-primary to-accent shadow-primary/25"
			: lane === "preparing"
				? "from-sky-500 to-cyan-500 shadow-sky-500/25"
				: "from-emerald-500 to-green-500 shadow-emerald-500/25";

	return (
		<div
			className={cn(
				"relative rounded-[16px] border p-4 backdrop-blur-xl transition-all duration-200",
				urgencyBorder(mins),
				isSelected && "ring-2 ring-primary/50 ring-offset-1 ring-offset-transparent",
				isOverdue && "animate-[admin-primary-pulse_2.2s_ease-in-out_infinite]",
			)}
		>
			{/* Checkbox + Header */}
			<div className="flex items-start gap-3">
				<button
					onClick={() => onSelect(order.id)}
					className={cn(
						"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
						isSelected ? "border-primary bg-primary/30" : "border-white/20 bg-white/5",
					)}
				>
					{isSelected && <Check className="h-3 w-3 text-primary" />}
				</button>

				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="flex items-center gap-1.5 text-sm font-semibold text-white">
							<Hash className="h-3.5 w-3.5 text-white/30" />{order.orderNumber}
						</span>
						<div className="flex items-center gap-2">
							<span className={cn("flex items-center gap-1 text-xs font-bold tabular-nums", urgencyColor(mins))}>
								<Timer className="h-3 w-3" /> {formatElapsed(order.createdAt)}
							</span>
							{isOverdue && (
								<span className="rounded-full border border-rose-300/40 bg-rose-400/20 px-2 py-0.5 text-[10px] font-bold text-rose-200">
									OVERDUE
								</span>
							)}
						</div>
					</div>

					{/* Customer */}
					<p className="mt-1 flex items-center gap-1 text-xs text-white/40">
						<User className="h-3 w-3" /> {order.customerName}
						{order.assignedRider && (
							<span className="ml-2 inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-300">
								<Truck className="h-2.5 w-2.5" /> {order.assignedRider.fullName}
							</span>
						)}
					</p>
				</div>
			</div>

			{/* Items */}
			<div className="mt-3 space-y-1.5">
				{order.items.map((item) => (
					<div key={item.id} className="flex items-center justify-between rounded-[10px] border border-white/5 bg-black/20 px-3 py-1.5">
						<span className="text-sm font-medium text-white">
							<span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold text-white/70">{item.quantity}</span>
							{item.productName}
						</span>
					</div>
				))}
			</div>

			{/* Special Instructions */}
			{order.notes && (
				<div className="mt-2.5 rounded-[10px] border border-amber-300/25 bg-amber-300/10 px-3 py-2">
					<p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/70">
						<MessageSquare className="h-3 w-3" /> Instructions
					</p>
					<p className="mt-0.5 text-xs text-amber-100">{order.notes}</p>
				</div>
			)}

			{/* Advance Button */}
			{lane !== "ready" && (
				<Button
					className={cn("mt-3 h-9 w-full rounded-[10px] bg-gradient-to-r text-xs font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110", advanceColor)}
					onClick={() => onAdvance(order.id)}
					disabled={isUpdating}
				>
					{advanceIcon} {advanceLabel}
				</Button>
			)}
		</div>
	);
};

/* ── Main Component ────────────────────────────────────────── */

const KitchenPage = () => {
	const { token } = useAuth();
	const qc = useQueryClient();

	/* ─ Queries ─ */
	const ordersQ = useQuery({ queryKey: ["admin-kitchen-orders"], queryFn: () => getAdminOrders(token!), enabled: Boolean(token), refetchInterval: 5000 });
	const kdsQ = useQuery({ queryKey: ["admin-kds-overview"], queryFn: () => getAdminKdsOverview(token!), enabled: Boolean(token), refetchInterval: 8000 });

	const allOrders = ordersQ.data?.orders ?? [];
	const kds = kdsQ.data;

	/* ─ Time tick for live elapsed display ─ */
	const [, setTick] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setTick((t) => t + 1), 15000);
		return () => clearInterval(id);
	}, []);

	/* ─ UI State ─ */
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkNoteOpen, setBulkNoteOpen] = useState(false);
	const [bulkNote, setBulkNote] = useState("");
	const [activeLane, setActiveLane] = useState<KdsLane>("confirmed");

	/* ─ Inv helper ─ */
	const inv = (...keys: string[]) => { keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] })); };
	const invAll = () => inv("admin-kitchen-orders", "admin-kds-overview", "admin-orders-page", "admin-overview-dashboard", "admin-orders-summary");

	/* ── Mutations ─ */
	const advanceMut = useMutation({
		mutationFn: (orderId: number) => {
			const order = allOrders.find((o) => o.id === orderId);
			if (!order) throw new Error("Order not found");
			if (order.status === "CONFIRMED") return updateAdminOrderStatus(token!, orderId, "PREPARING");
			if (order.status === "PREPARING") return updateAdminOrderStatus(token!, orderId, "OUT_FOR_DELIVERY");
			throw new Error("Cannot advance this order");
		},
		onSuccess: () => { toast.success("Order advanced"); invAll(); },
		onError: () => toast.error("Failed to advance order"),
	});

	const bulkAdvanceMut = useMutation({
		mutationFn: () => {
			if (selectedIds.size === 0) throw new Error("No orders selected");
			return bulkAdvanceAdminKdsOrders(token!, {
				orderIds: [...selectedIds],
				note: bulkNote.trim() || undefined,
			});
		},
		onSuccess: (data) => {
			toast.success(`${data.updatedCount} orders advanced${data.skippedCount > 0 ? `, ${data.skippedCount} skipped` : ""}`);
			setSelectedIds(new Set());
			setBulkNoteOpen(false);
			setBulkNote("");
			invAll();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk advance failed"),
	});

	const completeMut = useMutation({
		mutationFn: (orderId: number) => updateAdminOrderStatus(token!, orderId, "COMPLETED"),
		onSuccess: () => { toast.success("Order completed"); invAll(); },
		onError: () => toast.error("Failed to complete order"),
	});

	/* ── Filtered & sorted orders ─ */
	const confirmedOrders = useMemo(() => allOrders.filter((o) => o.status === "CONFIRMED").sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)), [allOrders]);
	const preparingOrders = useMemo(() => allOrders.filter((o) => o.status === "PREPARING").sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)), [allOrders]);
	const readyOrders = useMemo(() => allOrders.filter((o) => o.status === "OUT_FOR_DELIVERY").sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [allOrders]);

	const activeOrders = activeLane === "confirmed" ? confirmedOrders : activeLane === "preparing" ? preparingOrders : readyOrders;

	const overdueCount = useMemo(() => [...confirmedOrders, ...preparingOrders].filter((o) => getElapsedMinutes(o.createdAt) >= 15).length, [confirmedOrders, preparingOrders]);

	/* ── Selection helpers ─ */
	const toggleSelect = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};

	const toggleSelectAllLane = () => {
		const laneIds = activeOrders.map((o) => o.id);
		const allSelected = laneIds.every((id) => selectedIds.has(id));
		if (allSelected) {
			setSelectedIds((prev) => { const next = new Set(prev); laneIds.forEach((id) => next.delete(id)); return next; });
		} else {
			setSelectedIds((prev) => { const next = new Set(prev); laneIds.forEach((id) => next.add(id)); return next; });
		}
	};

	const openBulkAdvance = () => {
		if (selectedIds.size === 0) { toast.error("Select orders first"); return; }
		setBulkNote("");
		setBulkNoteOpen(true);
	};

	/* ── Lane config ─ */
	const lanes: Array<{ key: KdsLane; label: string; Icon: typeof Package; count: number; color: string; text: string }> = [
		{ key: "confirmed", label: "Queue", Icon: Clock, count: confirmedOrders.length, color: "from-amber-500/20 to-accent/20", text: "text-amber-400" },
		{ key: "preparing", label: "Preparing", Icon: Flame, count: preparingOrders.length, color: "from-primary/20 to-accent/20", text: "text-primary" },
		{ key: "ready", label: "Ready / Out", Icon: Truck, count: readyOrders.length, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
	];

	/* ── Render ─ */
	return (
		<ModuleScaffold title="Kitchen" subtitle="" hideHeader>
			<div className="space-y-5">

				{/* ═══════ Header Bar ═══════ */}
				<div className={headerBarClass}>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/20">
							<ChefHat className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Kitchen Display System</h1>
							<p className="flex items-center gap-1.5 text-xs text-white/40">
								<Sparkles className="h-3 w-3" /> Live &middot; auto-refresh 5s
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{selectedIds.size > 0 && (
							<Button
								className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20"
								onClick={openBulkAdvance}
							>
								<Zap className="mr-1.5 h-3.5 w-3.5" /> Advance {selectedIds.size} Orders
							</Button>
						)}
					</div>
				</div>

				{/* ═══════ KDS Analytics (from /kds/overview) ═══════ */}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
					{[
						{ label: "Queue Size", value: kds?.summary.queueSize ?? (confirmedOrders.length + preparingOrders.length), Icon: Layers, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
						{ label: "Preparing", value: kds?.summary.preparing ?? preparingOrders.length, Icon: Flame, color: "from-primary/20 to-accent/20", text: "text-primary" },
						{ label: "Ready to Go", value: kds?.summary.readyToDispatch ?? readyOrders.length, Icon: CheckCircle2, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
						{ label: "Overdue", value: kds?.summary.overdue ?? overdueCount, Icon: AlertTriangle, color: "from-rose-500/20 to-red-500/20", text: "text-rose-400" },
						{ label: "Avg. Prep", value: kds ? `${kds.summary.averagePrepMinutes}m` : "—", Icon: Timer, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
						{ label: "Max Wait", value: kds ? `${kds.summary.maxQueueWaitMinutes}m` : "—", Icon: Clock, color: "from-amber-500/20 to-accent/20", text: "text-amber-400" },
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

				{/* ═══════ Top Items (from KDS overview) ═══════ */}
				{kds && kds.topItems.length > 0 && (
					<div className={panelClass}>
						<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
							<TrendingUp className="h-3.5 w-3.5 text-primary" /> Top Items in Queue
						</h3>
						<div className="flex flex-wrap gap-2">
							{kds.topItems.map((item) => (
								<div key={item.name} className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-[11px] font-bold text-primary">{item.quantity}</span>
									<span className="text-sm text-white/70">{item.name}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ═══════ Lane Tabs ═══════ */}
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{lanes.map((l) => (
						<button
							key={l.key}
							onClick={() => setActiveLane(l.key)}
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-[12px] px-5 py-2.5 text-sm font-medium transition-all",
								activeLane === l.key
									? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
									: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
							)}
						>
							<l.Icon className="h-4 w-4" />
							{l.label}
							<span className={cn(
								"ml-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
								activeLane === l.key ? "bg-black/20 text-primary-foreground" : "bg-white/10 text-white/30",
								l.key === "confirmed" && l.count > 0 && activeLane !== l.key && "bg-amber-500/20 text-amber-300",
							)}>
								{l.count}
							</span>
						</button>
					))}
				</div>

				{/* ═══════ Select All + Actions Bar ═══════ */}
				{activeOrders.length > 0 && activeLane !== "ready" && (
					<div className="flex items-center gap-3">
						<button
							onClick={toggleSelectAllLane}
							className={cn(
								"flex h-5 w-5 items-center justify-center rounded-md border transition",
								activeOrders.every((o) => selectedIds.has(o.id)) ? "border-primary bg-primary/30" : "border-white/20 bg-white/5",
							)}
						>
							{activeOrders.every((o) => selectedIds.has(o.id)) && <Check className="h-3 w-3 text-primary" />}
						</button>
						<span className="text-xs text-white/40">{selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select all ${activeOrders.length}`}</span>
					</div>
				)}

				{/* ═══════ Ticket Grid ═══════ */}
				{ordersQ.isLoading && <p className="text-sm text-white/40">Syncing kitchen board...</p>}

				{activeOrders.length === 0 && !ordersQ.isLoading && (
					<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
						<div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10">
							<ChefHat className="h-8 w-8 text-emerald-300" />
						</div>
						<p className="mt-4 text-base font-semibold text-white/70">
							{activeLane === "confirmed" ? "No orders in queue" : activeLane === "preparing" ? "Nothing being prepared" : "No ready orders"}
						</p>
						<p className="mt-1 text-sm text-white/30">
							{activeLane === "confirmed" ? "New orders will appear here automatically." : activeLane === "preparing" ? "Advance queued orders to start preparing." : "Mark preparing orders as ready."}
						</p>
					</div>
				)}

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					{activeOrders.map((order) => (
						<TicketCard
							key={order.id}
							order={order}
							isUpdating={advanceMut.isPending || completeMut.isPending}
							lane={activeLane}
							isSelected={selectedIds.has(order.id)}
							onSelect={toggleSelect}
							onAdvance={(id) => {
								if (activeLane === "ready") {
									completeMut.mutate(id);
								} else {
									advanceMut.mutate(id);
								}
							}}
						/>
					))}
				</div>

				{/* ═══════ Kanban Summary (all 3 lanes side-by-side on XL) ═══════ */}
				<div className="grid gap-3 xl:grid-cols-3">
					{lanes.map((l) => {
						const laneOrders = l.key === "confirmed" ? confirmedOrders : l.key === "preparing" ? preparingOrders : readyOrders;
						return (
							<div key={l.key} className={cn(panelClass, "!p-4")}>
								<div className="mb-3 flex items-center justify-between">
									<h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
										<l.Icon className={cn("h-3.5 w-3.5", l.text)} /> {l.label}
									</h4>
									<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", l.count > 0 ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20")}>{l.count}</span>
								</div>
								{laneOrders.length === 0 ? (
									<p className="text-xs text-white/20">Empty</p>
								) : (
									<div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
										{laneOrders.slice(0, 8).map((o) => {
											const mins = getElapsedMinutes(o.createdAt);
											return (
												<div key={o.id} className="flex items-center justify-between rounded-[8px] border border-white/5 bg-black/15 px-2.5 py-1.5">
													<div className="min-w-0 flex-1">
														<span className="text-[11px] font-medium text-white/60">{o.orderNumber}</span>
														<span className="ml-2 text-[10px] text-white/30">{o.items.length} items</span>
													</div>
													<span className={cn("text-[10px] font-bold tabular-nums", urgencyColor(mins))}>{formatElapsed(o.createdAt)}</span>
												</div>
											);
										})}
										{laneOrders.length > 8 && <p className="text-[10px] text-white/20 text-center">+{laneOrders.length - 8} more</p>}
									</div>
								)}
							</div>
						);
					})}
				</div>

			</div>

			{/* ═══════ Bulk Advance Modal ═══════ */}
			<Dialog open={bulkNoteOpen} onOpenChange={setBulkNoteOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Zap className="h-5 w-5 text-violet-400" />
							Bulk Advance Orders
						</DialogTitle>
						<DialogDescription className="text-white/40">
							Advance {selectedIds.size} selected orders to their next KDS stage.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3">
							<p className="text-[11px] font-medium uppercase tracking-wider text-white/30">Transition Rules</p>
							<div className="mt-2 space-y-1.5">
								<div className="flex items-center gap-2 text-xs text-white/50">
									<span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">CONFIRMED</span>
									<ArrowRight className="h-3 w-3 text-white/20" />
									<span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">PREPARING</span>
								</div>
								<div className="flex items-center gap-2 text-xs text-white/50">
									<span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">PREPARING</span>
									<ArrowRight className="h-3 w-3 text-white/20" />
									<span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300">OUT FOR DELIVERY</span>
								</div>
							</div>
						</div>

						<div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3">
							<p className="text-xs text-white/40">Selected orders:</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{[...selectedIds].slice(0, 15).map((id) => {
									const o = allOrders.find((x) => x.id === id);
									return (
										<span key={id} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/60">
											{o ? o.orderNumber : `#${id}`}
										</span>
									);
								})}
								{selectedIds.size > 15 && <span className="text-[11px] text-white/30">+{selectedIds.size - 15} more</span>}
							</div>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Note (optional)</label>
							<Input className={inputClass} value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="Kitchen note for this batch..." />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setBulkNoteOpen(false)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
							disabled={bulkAdvanceMut.isPending}
							onClick={() => bulkAdvanceMut.mutate()}
						>
							<Zap className="mr-1.5 h-4 w-4" /> Advance {selectedIds.size} Orders
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</ModuleScaffold>
	);
};

export default KitchenPage;
