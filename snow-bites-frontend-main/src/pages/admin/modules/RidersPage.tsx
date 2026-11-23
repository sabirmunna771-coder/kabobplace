import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAdminRider,
	deleteAdminRider,
	getAdminBranches,
	getAdminOrders,
	getAdminRiderPerformance,
	getAdminRiders,
	getAdminRidersSummary,
	updateAdminRider,
	updateAdminRiderAvailability,
	type ApiRider,
	type ApiRiderPerformance,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	Award,
	Bike,
	Building2,
	Car,
	Check,
	ChevronRight,
	Clock,
	DollarSign,
	MapPin,
	Navigation,
	Package,
	Pencil,
	Phone,
	Plus,
	Power,
	Search,
	Sparkles,
	Timer,
	Trash2,
	TrendingUp,
	Truck,
	User,
	UserCheck,
	Users,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

type RiderModalMode = "create" | "edit";
type AvailFilter = "ALL" | "AVAILABLE" | "BUSY" | "OFFLINE";

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-lg [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

const btnPrimary = "rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]";

const availBadgeClass: Record<ApiRider["availability"], string> = {
	AVAILABLE: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
	BUSY: "border-accent/30 bg-accent/15 text-accent",
	OFFLINE: "border-white/10 bg-white/5 text-white/30",
};

const availDot: Record<ApiRider["availability"], string> = {
	AVAILABLE: "bg-emerald-400",
	BUSY: "bg-accent",
	OFFLINE: "bg-white/20",
};

const vehicleIcon = (v?: string | null) => {
	if (!v) return <Truck className="h-3.5 w-3.5" />;
	const lv = v.toLowerCase();
	if (lv.includes("bike") || lv.includes("cycle")) return <Bike className="h-3.5 w-3.5" />;
	if (lv.includes("car")) return <Car className="h-3.5 w-3.5" />;
	return <Truck className="h-3.5 w-3.5" />;
};

const vehicleOptions = ["Bike", "Car", "Cycle"];

/* ── Main Component ────────────────────────────────────────── */

const RidersPage = () => {
	const { token } = useAuth();
	const { formatPrice: formatCurrency } = useSiteSettings();
	const queryClient = useQueryClient();

	/* ─ UI State ─ */
	const [searchText, setSearchText] = useState("");
	const [availFilter, setAvailFilter] = useState<AvailFilter>("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<RiderModalMode>("create");
	const [editingRiderId, setEditingRiderId] = useState<number | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
	const [detailRider, setDetailRider] = useState<ApiRider | null>(null);
	const [formName, setFormName] = useState("");
	const [formPhone, setFormPhone] = useState("");
	const [formVehicle, setFormVehicle] = useState("");
	const [formBranchId, setFormBranchId] = useState<string>("none");

	/* ── Queries ─ */
	const ridersQ = useQuery({ queryKey: ["admin-riders-page"], queryFn: () => getAdminRiders(token!), enabled: Boolean(token), refetchInterval: 7000 });
	const summaryQ = useQuery({ queryKey: ["admin-riders-summary-page"], queryFn: () => getAdminRidersSummary(token!), enabled: Boolean(token), refetchInterval: 10000 });
	const branchesQ = useQuery({ queryKey: ["admin-branches-riders-page"], queryFn: () => getAdminBranches(token!), enabled: Boolean(token) });
	const perfQ = useQuery({ queryKey: ["admin-rider-performance-today"], queryFn: () => getAdminRiderPerformance(token!, { days: 1 }), enabled: Boolean(token), refetchInterval: 12000 });
	const ordersQ = useQuery({ queryKey: ["admin-orders-riders-link"], queryFn: () => getAdminOrders(token!), enabled: Boolean(token), refetchInterval: 7000 });

	const inv = (...keys: string[]) => { keys.forEach((k) => void queryClient.invalidateQueries({ queryKey: [k] })); };
	const invAll = () => inv("admin-riders-page", "admin-riders-summary-page", "admin-rider-performance-today", "admin-orders-riders-link", "admin-overview-dashboard", "admin-riders-summary");

	/* ── Mutations ─ */
	const availMut = useMutation({
		mutationFn: ({ riderId, availability }: { riderId: number; availability: ApiRider["availability"] }) => updateAdminRiderAvailability(token!, riderId, availability),
		onSuccess: () => { toast.success("Availability updated"); invAll(); },
		onError: () => toast.error("Update failed"),
	});

	const saveMut = useMutation({
		mutationFn: () => {
			const fullName = formName.trim();
			const phone = formPhone.trim();
			if (!fullName || !phone) throw new Error("Name and phone are required");
			const payload = { fullName, phone, vehicle: formVehicle || undefined, branchId: formBranchId === "none" ? null : Number(formBranchId) };
			if (modalMode === "edit" && editingRiderId) return updateAdminRider(token!, editingRiderId, payload);
			return createAdminRider(token!, payload);
		},
		onSuccess: () => {
			toast.success(modalMode === "edit" ? "Rider updated" : "Rider created");
			setIsModalOpen(false);
			setEditingRiderId(null);
			setFormName(""); setFormPhone(""); setFormVehicle(""); setFormBranchId("none");
			invAll();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
	});

	const deleteMut = useMutation({
		mutationFn: (riderId: number) => deleteAdminRider(token!, riderId),
		onSuccess: () => { toast.success("Rider removed"); setDeleteConfirmId(null); invAll(); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
	});

	/* ── Derived data ─ */
	const summary = summaryQ.data?.summary;
	const topRiders = summaryQ.data?.topRiders ?? [];
	const riders = ridersQ.data?.riders ?? [];
	const branches = branchesQ.data?.branches ?? [];
	const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

	const perfMap = useMemo(() => {
		const map = new Map<number, ApiRiderPerformance>();
		for (const row of perfQ.data?.performance ?? []) map.set(row.riderId, row);
		return map;
	}, [perfQ.data?.performance]);

	const activeOrderByRider = useMemo(() => {
		const map = new Map<number, { id: number; orderNumber: string; status: string }>();
		for (const order of ordersQ.data?.orders ?? []) {
			if (!order.assignedRiderId) continue;
			if (order.status !== "OUT_FOR_DELIVERY" && order.status !== "PREPARING") continue;
			if (!map.has(order.assignedRiderId)) {
				map.set(order.assignedRiderId, { id: order.id, orderNumber: order.orderNumber, status: order.status });
			}
		}
		return map;
	}, [ordersQ.data?.orders]);

	const filteredRiders = useMemo(() => {
		let result = riders;
		if (availFilter !== "ALL") result = result.filter((r) => r.availability === availFilter);
		const q = searchText.trim().toLowerCase();
		if (q) result = result.filter((r) => r.fullName.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || (r.vehicle ?? "").toLowerCase().includes(q));
		return result;
	}, [riders, availFilter, searchText]);

	/* ── Modal helpers ─ */
	const openCreateModal = () => {
		setModalMode("create"); setEditingRiderId(null);
		setFormName(""); setFormPhone(""); setFormVehicle(""); setFormBranchId("none");
		setIsModalOpen(true);
	};
	const openEditModal = (rider: ApiRider) => {
		setModalMode("edit"); setEditingRiderId(rider.id);
		setFormName(rider.fullName); setFormPhone(rider.phone); setFormVehicle(rider.vehicle ?? ""); setFormBranchId(rider.branchId ? String(rider.branchId) : "none");
		setIsModalOpen(true);
	};

	const cycleAvailability = (rider: ApiRider) => {
		const next: ApiRider["availability"] = rider.availability === "AVAILABLE" ? "BUSY" : rider.availability === "BUSY" ? "OFFLINE" : "AVAILABLE";
		availMut.mutate({ riderId: rider.id, availability: next });
	};

	/* ── Filter tabs config ─ */
	const filterTabs: Array<{ key: AvailFilter; label: string; count: number; color: string }> = [
		{ key: "ALL", label: "All Riders", count: riders.length, color: "text-white" },
		{ key: "AVAILABLE", label: "Available", count: summary?.available ?? riders.filter((r) => r.availability === "AVAILABLE").length, color: "text-emerald-400" },
		{ key: "BUSY", label: "Busy", count: summary?.busy ?? riders.filter((r) => r.availability === "BUSY").length, color: "text-accent" },
		{ key: "OFFLINE", label: "Offline", count: summary?.offline ?? riders.filter((r) => r.availability === "OFFLINE").length, color: "text-white/30" },
	];

	return (
		<ModuleScaffold title="Riders" subtitle="" hideHeader>
			<div className="space-y-5">

				{/* ═══════ Header Bar ═══════ */}
				<div className={headerBarClass}>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-sky-500/20 to-cyan-500/20">
							<Truck className="h-5 w-5 text-sky-400" />
						</div>
						<div>
							<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Fleet Command Center</h1>
							<p className="flex items-center gap-1.5 text-xs text-white/40">
								<Sparkles className="h-3 w-3" /> {riders.length} riders &middot; auto-refresh 7s
							</p>
						</div>
					</div>
					<Button className={btnPrimary} onClick={openCreateModal}>
						<Plus className="mr-1.5 h-4 w-4" /> Add Rider
					</Button>
				</div>

				{(ridersQ.isLoading || summaryQ.isLoading) && <p className="text-sm text-white/40">Syncing fleet metrics...</p>}

			{/* ═══════ KPI Cards ═══════ */}
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{[
					{ label: "Total Riders", value: summary?.totalRiders ?? riders.length, Icon: Users, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
					{ label: "Available", value: summary?.available ?? 0, Icon: UserCheck, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
					{ label: "Busy", value: summary?.busy ?? 0, Icon: Navigation, color: "from-accent/20 to-primary/20", text: "text-accent" },
					{ label: "Offline", value: summary?.offline ?? 0, Icon: Power, color: "from-white/5 to-white/[0.02]", text: "text-white/30" },
					{ label: "Deliveries Done", value: summary?.completedDeliveries ?? 0, Icon: Package, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
					{ label: "Active Orders", value: activeOrderByRider.size, Icon: Zap, color: "from-primary/20 to-accent/20", text: "text-primary" },
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

			{/* ═══════ Top Performers (from Riders Summary API) ═══════ */}
			{topRiders.length > 0 && (
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Award className="h-3.5 w-3.5 text-amber-400" /> Top Performers
					</h3>
					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
						{topRiders.slice(0, 6).map((entry, i) => {
							const perf = perfMap.get(entry.rider.id);
							return (
								<div key={entry.rider.id} className="flex items-center gap-3 rounded-[14px] border border-white/5 bg-black/20 px-3 py-2.5">
									<div className={cn(
										"flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold",
										i === 0 ? "bg-gradient-to-br from-amber-400/30 to-yellow-400/30 text-amber-200" : i === 1 ? "bg-gradient-to-br from-gray-300/20 to-white/10 text-gray-200" : i === 2 ? "bg-gradient-to-br from-primary/30 to-accent/20 text-primary" : "bg-white/5 text-white/30",
									)}>
										{i < 3 ? <Award className="h-4 w-4" /> : i + 1}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate text-sm font-semibold text-white/80">{entry.rider.fullName}</span>
											<span className={cn("h-1.5 w-1.5 rounded-full", availDot[entry.rider.availability])} />
										</div>
										<div className="flex items-center gap-3 text-[10px] text-white/35">
											<span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" /> {entry.deliveries} runs</span>
											<span className="flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" /> {entry.averageDeliveryMinutes}m avg</span>
											<span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" /> {formatCurrency(entry.completedRevenue)}</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ═══════ Filter Tabs + Search ═══════ */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{filterTabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setAvailFilter(t.key)}
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition-all",
								availFilter === t.key
									? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
									: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
							)}
						>
							{t.label}
							<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", availFilter === t.key ? "bg-black/20 text-primary-foreground" : "bg-white/10 text-white/30")}>{t.count}</span>
						</button>
					))}
				</div>
				<div className="relative">
					<Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
					<input
						type="text"
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder="Search riders by name, phone..."
						className="h-10 w-full rounded-[14px] border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder-white/25 backdrop-blur-xl transition-all focus:border-primary/50 focus:outline-none sm:w-64"
					/>
				</div>
			</div>

				{/* ═══════ Fleet Roster ═══════ */}
				{filteredRiders.length === 0 && !ridersQ.isLoading && (
					<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
						<div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/10">
							<Truck className="h-8 w-8 text-sky-300" />
						</div>
						<p className="mt-4 text-base font-semibold text-white/70">
							{riders.length === 0 ? "Your fleet is empty" : "No riders match your filters"}
						</p>
						<p className="mt-1 text-sm text-white/30">
							{riders.length === 0 ? "Add your first rider to start dispatch operations." : "Try adjusting your search or filter."}
						</p>
						{riders.length === 0 && (
							<Button className={cn(btnPrimary, "mt-4")} onClick={openCreateModal}>
								<Plus className="mr-1.5 h-4 w-4" /> Add First Rider
							</Button>
						)}
					</div>
				)}

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{filteredRiders.map((rider) => {
						const perf = perfMap.get(rider.id);
						const activeOrder = activeOrderByRider.get(rider.id);
						const deliveriesToday = perf?.completedDeliveries ?? 0;

					return (
						<div
							key={rider.id}
							className={cn(
								"group/card relative rounded-[18px] border bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]",
								rider.availability === "AVAILABLE" ? "border-emerald-400/15 hover:border-emerald-400/25" : rider.availability === "BUSY" ? "border-accent/25 hover:border-accent/40" : "border-white/8 hover:border-white/15",
							)}
						>
							{/* Availability dot */}
							<div className={cn("absolute right-4 top-4 h-2.5 w-2.5 rounded-full", availDot[rider.availability])} />
							{rider.availability === "AVAILABLE" && <div className={cn("absolute right-4 top-4 h-2.5 w-2.5 animate-ping rounded-full", availDot[rider.availability])} />}

							{/* Header */}
							<div className="flex items-start gap-3">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-sm font-bold text-white/50">
									{rider.fullName.slice(0, 2).toUpperCase()}
								</div>
								<div className="min-w-0 flex-1">
									<button onClick={() => setDetailRider(rider)} className="text-left">
										<span className="block truncate text-sm font-semibold text-white/90 transition-colors hover:text-primary">{rider.fullName}</span>
									</button>
									<div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/35">
										<span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" /> {rider.phone}</span>
										<span className="flex items-center gap-0.5">{vehicleIcon(rider.vehicle)} {rider.vehicle ?? "—"}</span>
									</div>
								</div>
							</div>

							{/* Stats row */}
							<div className="mt-3 flex items-center gap-2">
								<span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", availBadgeClass[rider.availability])}>{rider.availability}</span>
								<span className="flex items-center gap-0.5 text-[10px] text-white/30"><Package className="h-2.5 w-2.5" /> {deliveriesToday} today</span>
								{perf?.averageDeliveryMinutes != null && (
									<span className="flex items-center gap-0.5 text-[10px] text-white/30"><Timer className="h-2.5 w-2.5" /> {perf.averageDeliveryMinutes}m</span>
								)}
							</div>

							{/* Branch */}
							{rider.branchId && (
								<div className="mt-2 flex items-center gap-1 text-[10px] text-white/25">
									<Building2 className="h-2.5 w-2.5" /> {branchMap.get(rider.branchId) ?? "Branch"}
								</div>
							)}

							{/* Active order */}
							{activeOrder && (
								<div className="mt-2 flex items-center gap-2 rounded-[8px] border border-primary/20 bg-primary/10 px-2.5 py-1.5">
									<Navigation className="h-3 w-3 text-primary" />
									<span className="text-[11px] font-semibold text-primary">{activeOrder.orderNumber}</span>
									<span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">{activeOrder.status.replace(/_/g, " ")}</span>
								</div>
							)}

							{/* Actions */}
							<div className="mt-3 flex items-center gap-1.5">
								<button
									onClick={() => cycleAvailability(rider)}
									disabled={availMut.isPending}
									className={cn(
										"flex h-7 items-center gap-1 rounded-[8px] border px-2 text-[10px] font-medium transition-all hover:brightness-110",
										rider.availability === "AVAILABLE" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : rider.availability === "BUSY" ? "border-accent/20 bg-accent/10 text-accent" : "border-white/10 bg-white/5 text-white/40",
									)}
								>
									<Power className="h-3 w-3" /> {rider.availability === "OFFLINE" ? "Online" : rider.availability === "AVAILABLE" ? "Set Busy" : "Offline"}
								</button>
								<button onClick={() => openEditModal(rider)} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70">
									<Pencil className="h-3 w-3" />
								</button>
								<button onClick={() => setDeleteConfirmId(rider.id)} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-rose-400/15 bg-rose-400/5 text-rose-400/50 transition-all hover:bg-rose-400/15 hover:text-rose-300">
									<Trash2 className="h-3 w-3" />
								</button>
								<button onClick={() => setDetailRider(rider)} className="ml-auto flex h-7 items-center gap-0.5 rounded-[8px] border border-white/5 bg-white/[0.02] px-2 text-[10px] text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/50">
									Details <ChevronRight className="h-3 w-3" />
								</button>
							</div>
						</div>
					);
				})}
				</div>

			</div>

			{/* ═══════ Create / Edit Modal ═══════ */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							{modalMode === "edit" ? <Pencil className="h-5 w-5 text-sky-400" /> : <Plus className="h-5 w-5 text-primary" />}
							{modalMode === "edit" ? "Edit Rider" : "Add Rider"}
						</DialogTitle>
						<DialogDescription className="text-white/40">Manage rider profile, vehicle, and branch assignment.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Full Name</label>
							<Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Rider full name" className={inputClass} />
						</div>
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Phone</label>
							<Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+569 9103 0440" className={inputClass} />
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Vehicle Type</label>
								<Select value={formVehicle || "none"} onValueChange={(v) => setFormVehicle(v === "none" ? "" : v)}>
									<SelectTrigger className={cn(inputClass, "h-10")}><SelectValue placeholder="Select vehicle" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Not set</SelectItem>
										{vehicleOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Branch</label>
								<Select value={formBranchId} onValueChange={setFormBranchId}>
									<SelectTrigger className={cn(inputClass, "h-10")}><SelectValue placeholder="Assign branch" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Unassigned</SelectItem>
										{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button className={btnPrimary} onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Create Rider"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Delete Confirmation Modal ═══════ */}
			<Dialog open={deleteConfirmId !== null} onOpenChange={(v) => !v && setDeleteConfirmId(null)}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<AlertTriangle className="h-5 w-5 text-rose-400" /> Remove Rider
						</DialogTitle>
						<DialogDescription className="text-white/40">
							This action cannot be undone. The rider will be removed from the fleet.
							{(() => {
								const r = riders.find((x) => x.id === deleteConfirmId);
								return r ? ` "${r.fullName}" will be deleted.` : "";
							})()}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
							onClick={() => deleteConfirmId && deleteMut.mutate(deleteConfirmId)}
							disabled={deleteMut.isPending}
						>
							{deleteMut.isPending ? "Removing..." : "Remove Rider"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Rider Detail Modal ═══════ */}
			<Dialog open={detailRider !== null} onOpenChange={(v) => !v && setDetailRider(null)}>
				<DialogContent className={cn(modalContentClass, "sm:max-w-xl")}>
					{detailRider && (() => {
						const perf = perfMap.get(detailRider.id);
						const activeOrder = activeOrderByRider.get(detailRider.id);
						const topEntry = topRiders.find((t) => t.rider.id === detailRider.id);
						return (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-3 text-white">
										<div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sm font-bold text-sky-300">
											{detailRider.fullName.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<p className="text-base">{detailRider.fullName}</p>
											<p className="text-xs font-normal text-white/40">{detailRider.phone}</p>
										</div>
									</DialogTitle>
								</DialogHeader>

								{/* Status + Info */}
								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Status</p>
										<div className="mt-1 flex items-center gap-2">
											<span className={cn("h-2 w-2 rounded-full", availDot[detailRider.availability])} />
											<span className="text-sm font-bold text-white">{detailRider.availability}</span>
										</div>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Vehicle</p>
										<div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
											{vehicleIcon(detailRider.vehicle)} {detailRider.vehicle ?? "Not set"}
										</div>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Branch</p>
										<p className="mt-1 text-sm font-bold text-white">{branchMap.get(detailRider.branchId ?? -1) ?? "Unassigned"}</p>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Joined</p>
										<p className="mt-1 text-sm font-bold text-white">{new Date(detailRider.createdAt).toLocaleDateString()}</p>
									</div>
								</div>

								{/* Performance */}
								<div className="rounded-[14px] border border-white/5 bg-black/15 p-3">
									<h4 className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
										<TrendingUp className="h-3 w-3 text-emerald-400" /> Performance
									</h4>
									<div className="grid grid-cols-3 gap-2">
										<div className="text-center">
											<p className="text-lg font-bold text-white">{perf?.completedDeliveries ?? topEntry?.deliveries ?? 0}</p>
											<p className="text-[9px] text-white/25">Deliveries</p>
										</div>
										<div className="text-center">
											<p className="text-lg font-bold text-white">{perf?.averageDeliveryMinutes ?? topEntry?.averageDeliveryMinutes ?? "—"}m</p>
											<p className="text-[9px] text-white/25">Avg Time</p>
										</div>
										<div className="text-center">
											<p className="text-lg font-bold text-white">{topEntry ? formatCurrency(topEntry.completedRevenue) : "—"}</p>
											<p className="text-[9px] text-white/25">Revenue</p>
										</div>
									</div>
									{perf?.onTimeRate != null && (
										<div className="mt-2 flex items-center gap-2">
											<div className="flex-1 rounded-full bg-white/5" style={{ height: 6 }}>
												<div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${perf.onTimeRate}%` }} />
											</div>
											<span className="text-[10px] font-bold text-emerald-300">{perf.onTimeRate}% on-time</span>
										</div>
									)}
								</div>

								{/* Active Order */}
								{activeOrder && (
									<div className="flex items-center gap-3 rounded-[12px] border border-primary/20 bg-primary/10 px-3 py-2.5">
										<Navigation className="h-4 w-4 text-primary" />
										<div>
											<p className="text-xs font-bold text-primary">Active: {activeOrder.orderNumber}</p>
											<p className="text-[10px] text-primary/70">{activeOrder.status.replace(/_/g, " ")}</p>
										</div>
									</div>
								)}

								{/* Quick Actions */}
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1 rounded-[12px] border-white/10 text-xs text-white/60" onClick={() => { setDetailRider(null); openEditModal(detailRider); }}>
										<Pencil className="mr-1.5 h-3 w-3" /> Edit
									</Button>
									<Button
										className={cn("flex-1 text-xs", detailRider.availability === "AVAILABLE" ? "rounded-[12px] bg-gradient-to-r from-emerald-500/80 to-green-500/80 text-white" : "rounded-[12px] bg-gradient-to-r from-sky-500/80 to-cyan-500/80 text-white")}
										onClick={() => { cycleAvailability(detailRider); setDetailRider(null); }}
									>
										<Power className="mr-1.5 h-3 w-3" />
										{detailRider.availability === "OFFLINE" ? "Set Online" : detailRider.availability === "AVAILABLE" ? "Set Busy" : "Set Offline"}
									</Button>
								</div>
							</>
						);
					})()}
				</DialogContent>
			</Dialog>

		</ModuleScaffold>
	);
};

export default RidersPage;
