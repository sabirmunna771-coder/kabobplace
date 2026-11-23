import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAdminBranch,
	createAdminStaffMember,
	deleteAdminBranch,
	deleteAdminStaffMember,
	getAdminBranches,
	getAdminRolePermissions,
	getAdminStaffActivityLogs,
	getAdminStaffMembers,
	updateAdminBranch,
	updateAdminBranchStatus,
	updateAdminRolePermissions,
	updateAdminStaffMember,
	updateAdminStaffMemberActiveStatus,
	type ApiBranchProfile,
	type ApiStaffActivityLog,
	type ApiStaffMember,
	type ApiStaffPermissionKey,
	type ApiStaffRole,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	Building2,
	Check,
	ChevronRight,
	Clock,
	Crown,
	Hash,
	Lock,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Plus,
	Power,
	Search,
	Shield,
	ShieldCheck,
	Sparkles,
	Store,
	Trash2,
	User,
	UserCheck,
	UserPlus,
	Users,
	Utensils,
} from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

type BranchModalMode = "create" | "edit";
type StaffModalMode = "create" | "edit";
type ActiveTab = "branches" | "staff" | "activity" | "permissions";

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-lg [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

const btnPrimary = "rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]";

const roleBadgeClass: Record<ApiStaffRole, string> = {
	SUPER_ADMIN: "border-violet-400/30 bg-violet-400/15 text-violet-300",
	BRANCH_MANAGER: "border-sky-400/30 bg-sky-400/15 text-sky-300",
	KITCHEN_STAFF: "border-primary/30 bg-primary/15 text-primary",
	DELIVERY_RIDER: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
};

const roleIcon: Record<ApiStaffRole, typeof Crown> = {
	SUPER_ADMIN: Crown,
	BRANCH_MANAGER: Building2,
	KITCHEN_STAFF: Utensils,
	DELIVERY_RIDER: MapPin,
};

const roleOptions: ApiStaffRole[] = ["SUPER_ADMIN", "BRANCH_MANAGER", "KITCHEN_STAFF", "DELIVERY_RIDER"];
const formatRoleLabel = (role: ApiStaffRole) => role.replace(/_/g, " ");

/* ── Main Component ────────────────────────────────────────── */

const BranchStaffPage = () => {
	const { token } = useAuth();
	const queryClient = useQueryClient();

	/* ─ UI State ─ */
	const [activeTab, setActiveTab] = useState<ActiveTab>("branches");
	const [searchText, setSearchText] = useState("");
	const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
	const [branchModalMode, setBranchModalMode] = useState<BranchModalMode>("create");
	const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
	const [branchCode, setBranchCode] = useState("");
	const [branchName, setBranchName] = useState("");
	const [branchAddress, setBranchAddress] = useState("");
	const [branchPhone, setBranchPhone] = useState("");
	const [branchManagerId, setBranchManagerId] = useState<string>("none");

	const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
	const [staffModalMode, setStaffModalMode] = useState<StaffModalMode>("create");
	const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
	const [staffName, setStaffName] = useState("");
	const [staffEmail, setStaffEmail] = useState("");
	const [staffPhone, setStaffPhone] = useState("");
	const [staffRole, setStaffRole] = useState<ApiStaffRole>("BRANCH_MANAGER");
	const [staffBranchId, setStaffBranchId] = useState<string>("none");

	const [deleteTarget, setDeleteTarget] = useState<{ type: "branch" | "staff"; id: number; label: string } | null>(null);
	const [detailBranch, setDetailBranch] = useState<ApiBranchProfile | null>(null);
	const [detailStaff, setDetailStaff] = useState<ApiStaffMember | null>(null);

	/* ── Queries ─ */
	const branchesQ = useQuery({ queryKey: ["admin-branches-page"], queryFn: () => getAdminBranches(token!), enabled: Boolean(token), refetchInterval: 12000 });
	const staffQ = useQuery({ queryKey: ["admin-staff-page"], queryFn: () => getAdminStaffMembers(token!), enabled: Boolean(token), refetchInterval: 12000 });
	const logsQ = useQuery({ queryKey: ["admin-staff-logs-page"], queryFn: () => getAdminStaffActivityLogs(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const permsQ = useQuery({ queryKey: ["admin-role-permissions-page"], queryFn: () => getAdminRolePermissions(token!), enabled: Boolean(token) });

	const inv = (...keys: string[]) => { keys.forEach((k) => void queryClient.invalidateQueries({ queryKey: [k] })); };
	const invAll = () => inv("admin-branches-page", "admin-staff-page", "admin-staff-logs-page", "admin-role-permissions-page", "admin-overview-dashboard");

	/* ── Mutations ─ */
	const branchStatusMut = useMutation({
		mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "TEMPORARILY_CLOSED" }) => updateAdminBranchStatus(token!, id, status),
		onSuccess: () => { toast.success("Branch status updated"); invAll(); },
		onError: () => toast.error("Status update failed"),
	});

	const staffActiveMut = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateAdminStaffMemberActiveStatus(token!, id, isActive),
		onSuccess: () => { toast.success("Staff status updated"); invAll(); },
		onError: () => toast.error("Status update failed"),
	});

	const saveBranchMut = useMutation({
		mutationFn: () => {
			const code = branchCode.trim().toUpperCase();
			const name = branchName.trim();
			if (!code || !name) throw new Error("Branch code and name are required");
			if (!/^[A-Z0-9_-]{2,50}$/.test(code)) throw new Error("Branch code must be 2-50 characters (A-Z, 0-9, -, _)");
			const payload: Parameters<typeof createAdminBranch>[1] = {
				code, name,
				address: branchAddress.trim() || undefined,
				phone: branchPhone.trim() || undefined,
				managerStaffId: branchManagerId === "none" ? null : Number(branchManagerId),
				status: "ACTIVE" as const,
			};
			if (branchModalMode === "edit" && editingBranchId) return updateAdminBranch(token!, editingBranchId, payload);
			return createAdminBranch(token!, payload);
		},
		onSuccess: () => {
			toast.success(branchModalMode === "edit" ? "Branch updated" : "Branch created");
			setIsBranchModalOpen(false); setEditingBranchId(null);
			setBranchCode(""); setBranchName(""); setBranchAddress(""); setBranchPhone(""); setBranchManagerId("none");
			invAll();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
	});

	const saveStaffMut = useMutation({
		mutationFn: () => {
			const fullName = staffName.trim();
			const email = staffEmail.trim();
			if (!fullName) throw new Error("Staff name is required");
			if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email");
			const payload = {
				fullName, email: email || undefined, phone: staffPhone.trim() || undefined,
				role: staffRole, branchId: staffBranchId === "none" ? null : Number(staffBranchId), isActive: true,
			};
			if (staffModalMode === "edit" && editingStaffId) return updateAdminStaffMember(token!, editingStaffId, payload);
			return createAdminStaffMember(token!, payload);
		},
		onSuccess: () => {
			toast.success(staffModalMode === "edit" ? "Staff member updated" : "Staff member created");
			setIsStaffModalOpen(false); setEditingStaffId(null);
			setStaffName(""); setStaffEmail(""); setStaffPhone(""); setStaffRole("BRANCH_MANAGER"); setStaffBranchId("none");
			invAll();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
	});

	const deleteBranchMut = useMutation({
		mutationFn: (id: number) => deleteAdminBranch(token!, id),
		onSuccess: () => { toast.success("Branch removed"); setDeleteTarget(null); invAll(); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
	});

	const deleteStaffMut = useMutation({
		mutationFn: (id: number) => deleteAdminStaffMember(token!, id),
		onSuccess: () => { toast.success("Staff member removed"); setDeleteTarget(null); invAll(); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
	});

	const permsMut = useMutation({
		mutationFn: ({ role, permissions }: { role: ApiStaffRole; permissions: ApiStaffPermissionKey[] }) => updateAdminRolePermissions(token!, role, permissions),
		onSuccess: () => { toast.success("Permissions updated"); inv("admin-role-permissions-page"); },
		onError: () => toast.error("Permission update failed"),
	});

	/* ── Derived data ─ */
	const branches = branchesQ.data?.branches ?? [];
	const staff = staffQ.data?.staffMembers ?? [];
	const logs = logsQ.data?.logs ?? [];
	const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

	const activeBranches = branches.filter((b) => b.status === "ACTIVE").length;
	const activeStaff = staff.filter((s) => s.isActive).length;
	const roleCounts = useMemo(() => {
		const map = new Map<ApiStaffRole, number>();
		for (const s of staff) map.set(s.role, (map.get(s.role) ?? 0) + 1);
		return map;
	}, [staff]);

	/* ─ Search ─ */
	const q = searchText.trim().toLowerCase();
	const filteredBranches = useMemo(() => {
		if (!q) return branches;
		return branches.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || (b.address ?? "").toLowerCase().includes(q));
	}, [branches, q]);
	const filteredStaff = useMemo(() => {
		if (!q) return staff;
		return staff.filter((s) => s.fullName.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q) || (s.phone ?? "").toLowerCase().includes(q));
	}, [staff, q]);

	/* ── Modal helpers ─ */
	const openBranchModal = (mode: BranchModalMode, branch?: ApiBranchProfile) => {
		setBranchModalMode(mode);
		if (mode === "edit" && branch) {
			setEditingBranchId(branch.id); setBranchCode(branch.code); setBranchName(branch.name);
			setBranchAddress(branch.address ?? ""); setBranchPhone(branch.phone ?? "");
			setBranchManagerId(branch.managerStaffId ? String(branch.managerStaffId) : "none");
		} else {
			setEditingBranchId(null); setBranchCode(""); setBranchName(""); setBranchAddress(""); setBranchPhone(""); setBranchManagerId("none");
		}
		setIsBranchModalOpen(true);
	};
	const openStaffModal = (mode: StaffModalMode, member?: ApiStaffMember) => {
		setStaffModalMode(mode);
		if (mode === "edit" && member) {
			setEditingStaffId(member.id); setStaffName(member.fullName); setStaffEmail(member.email ?? "");
			setStaffPhone(member.phone ?? ""); setStaffRole(member.role);
			setStaffBranchId(member.branchId ? String(member.branchId) : "none");
		} else {
			setEditingStaffId(null); setStaffName(""); setStaffEmail(""); setStaffPhone(""); setStaffRole("BRANCH_MANAGER"); setStaffBranchId("none");
		}
		setIsStaffModalOpen(true);
	};

	const togglePermission = (role: ApiStaffRole, perm: ApiStaffPermissionKey) => {
		const current = permsQ.data?.rolePermissions?.[role] ?? [];
		const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
		permsMut.mutate({ role, permissions: next });
	};

	/* ── Tab config ─ */
	const tabs: Array<{ key: ActiveTab; label: string; count: number }> = [
		{ key: "branches", label: "Branches", count: branches.length },
		{ key: "staff", label: "Staff Directory", count: staff.length },
		{ key: "activity", label: "Activity Log", count: logs.length },
		{ key: "permissions", label: "Permissions", count: 0 },
	];

	const formatTimeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	};

	return (
		<ModuleScaffold title="Branch & Staff" subtitle="" hideHeader>
			<div className="space-y-5">

			{/* ═══════ Header Bar ═══════ */}
			<div className={headerBarClass}>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-500/20 to-purple-500/20">
						<Building2 className="h-5 w-5 text-violet-400" />
					</div>
					<div>
						<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Corporate HR & Branch Ops</h1>
						<p className="flex items-center gap-1.5 text-xs text-white/40">
							<Sparkles className="h-3 w-3" /> {branches.length} branches &middot; {staff.length} staff &middot; {logs.length} activity events
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button className={btnPrimary} onClick={() => openBranchModal("create")}>
						<Store className="mr-1.5 h-4 w-4" /> Branch
					</Button>
					<Button className="rounded-[14px] bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={() => openStaffModal("create")}>
						<UserPlus className="mr-1.5 h-4 w-4" /> Staff
					</Button>
				</div>
			</div>

			{(branchesQ.isLoading || staffQ.isLoading) && <p className="text-sm text-white/40">Syncing corporate data...</p>}

			{/* ═══════ KPI Cards ═══════ */}
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{[
					{ label: "Total Branches", value: branches.length, Icon: Store, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
					{ label: "Active Branches", value: activeBranches, Icon: Check, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
					{ label: "Total Staff", value: staff.length, Icon: Users, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
					{ label: "Active Staff", value: activeStaff, Icon: UserCheck, color: "from-teal-500/20 to-emerald-500/20", text: "text-teal-400" },
					{ label: "Super Admins", value: roleCounts.get("SUPER_ADMIN") ?? 0, Icon: Crown, color: "from-primary/20 to-accent/20", text: "text-primary" },
					{ label: "Activity Events", value: logs.length, Icon: Clock, color: "from-pink-500/20 to-rose-500/20", text: "text-pink-400" },
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

			{/* ═══════ Tab Navigator + Search ═══════ */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{tabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setActiveTab(t.key)}
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition-all",
								activeTab === t.key
									? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
									: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
							)}
						>
							{t.label}
							{t.count > 0 && (
								<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", activeTab === t.key ? "bg-black/20 text-primary-foreground" : "bg-white/10 text-white/30")}>{t.count}</span>
							)}
						</button>
					))}
				</div>
				{(activeTab === "branches" || activeTab === "staff") && (
					<div className="relative w-full sm:max-w-xs">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
						<Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={activeTab === "branches" ? "Search branches..." : "Search staff..."} className={cn(inputClass, "h-10 pl-10")} />
					</div>
				)}
			</div>

			{/* ═══════ BRANCHES TAB ═══════ */}
			{activeTab === "branches" && (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{filteredBranches.length === 0 && !branchesQ.isLoading && (
						<div className={cn(panelClass, "col-span-full flex flex-col items-center justify-center py-12 text-center")}>
							<div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10">
								<Store className="h-8 w-8 text-violet-300" />
							</div>
							<p className="mt-4 text-base font-semibold text-white/70">{branches.length === 0 ? "No branches yet" : "No branches match your search"}</p>
							{branches.length === 0 && <Button className={cn(btnPrimary, "mt-4")} onClick={() => openBranchModal("create")}><Plus className="mr-1.5 h-4 w-4" /> Add First Branch</Button>}
						</div>
					)}
					{filteredBranches.map((branch) => {
						const manager = branch.manager;
						const staffInBranch = staff.filter((s) => s.branchId === branch.id).length;
						return (
							<div
								key={branch.id}
								className={cn(
									"group/card relative rounded-[18px] border bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]",
									branch.status === "ACTIVE" ? "border-emerald-400/15 hover:border-emerald-400/25" : "border-rose-400/15 hover:border-rose-400/25",
								)}
							>
								{/* Status dot */}
								<div className={cn("absolute right-4 top-4 h-2.5 w-2.5 rounded-full", branch.status === "ACTIVE" ? "bg-emerald-400" : "bg-rose-400")} />
								{branch.status === "ACTIVE" && <div className="absolute right-4 top-4 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />}

								{/* Header */}
								<div className="flex items-start gap-3">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-violet-500/15 to-purple-500/10 text-sm font-bold text-violet-300">
										{branch.code.slice(0, 3)}
									</div>
									<div className="min-w-0 flex-1">
										<button onClick={() => setDetailBranch(branch)} className="text-left">
											<span className="block truncate text-sm font-semibold text-white/90 transition-colors hover:text-primary">{branch.name}</span>
										</button>
										<p className="text-[11px] text-white/35">{branch.code}</p>
									</div>
								</div>

								{/* Meta */}
								<div className="mt-2.5 space-y-1">
									{branch.address && (
										<div className="flex items-center gap-1.5 text-[10px] text-white/30">
											<MapPin className="h-2.5 w-2.5" /> {branch.address}
										</div>
									)}
									{branch.phone && (
										<div className="flex items-center gap-1.5 text-[10px] text-white/30">
											<Phone className="h-2.5 w-2.5" /> {branch.phone}
										</div>
									)}
								</div>

								{/* Stats row */}
								<div className="mt-3 flex items-center gap-2">
									<span className={cn(
										"rounded-full border px-2 py-0.5 text-[10px] font-bold",
										branch.status === "ACTIVE" ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" : "border-rose-400/30 bg-rose-400/15 text-rose-300",
									)}>
										{branch.status === "ACTIVE" ? "ACTIVE" : "CLOSED"}
									</span>
									{branch.isPrimary && (
										<span className="rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">PRIMARY</span>
									)}
									<span className="flex items-center gap-0.5 text-[10px] text-white/30">
										<Users className="h-2.5 w-2.5" /> {staffInBranch} staff
									</span>
									{branch.counts?.riders != null && (
										<span className="flex items-center gap-0.5 text-[10px] text-white/30">
											<MapPin className="h-2.5 w-2.5" /> {branch.counts.riders} riders
										</span>
									)}
								</div>

								{/* Manager */}
								{manager && (
									<div className="mt-2 flex items-center gap-2 rounded-[8px] border border-sky-400/15 bg-sky-400/5 px-2.5 py-1.5">
										<Crown className="h-3 w-3 text-sky-400" />
										<span className="text-[11px] font-semibold text-sky-300">{manager.fullName}</span>
										<span className="text-[9px] text-sky-400/40">Manager</span>
									</div>
								)}

								{/* Actions */}
								<div className="mt-3 flex items-center gap-1.5">
									<button
										onClick={() => branchStatusMut.mutate({ id: branch.id, status: branch.status === "ACTIVE" ? "TEMPORARILY_CLOSED" : "ACTIVE" })}
										disabled={branchStatusMut.isPending}
										className={cn(
											"flex h-7 items-center gap-1 rounded-[8px] border px-2 text-[10px] font-medium transition-all hover:brightness-110",
											branch.status === "ACTIVE" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300",
										)}
									>
										<Power className="h-3 w-3" /> {branch.status === "ACTIVE" ? "Close" : "Activate"}
									</button>
									<button onClick={() => openBranchModal("edit", branch)} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70">
										<Pencil className="h-3 w-3" />
									</button>
									<button onClick={() => setDeleteTarget({ type: "branch", id: branch.id, label: branch.name })} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-rose-400/15 bg-rose-400/5 text-rose-400/50 transition-all hover:bg-rose-400/15 hover:text-rose-300">
										<Trash2 className="h-3 w-3" />
									</button>
									<button onClick={() => setDetailBranch(branch)} className="ml-auto flex h-7 items-center gap-0.5 rounded-[8px] border border-white/5 bg-white/[0.02] px-2 text-[10px] text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/50">
										Details <ChevronRight className="h-3 w-3" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ═══════ STAFF TAB ═══════ */}
			{activeTab === "staff" && (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{filteredStaff.length === 0 && !staffQ.isLoading && (
						<div className={cn(panelClass, "col-span-full flex flex-col items-center justify-center py-12 text-center")}>
							<div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/10">
								<Users className="h-8 w-8 text-sky-300" />
							</div>
							<p className="mt-4 text-base font-semibold text-white/70">{staff.length === 0 ? "No staff members yet" : "No staff match your search"}</p>
							{staff.length === 0 && <Button className={cn(btnPrimary, "mt-4")} onClick={() => openStaffModal("create")}><Plus className="mr-1.5 h-4 w-4" /> Add First Staff</Button>}
						</div>
					)}
					{filteredStaff.map((member) => {
						const RIcon = roleIcon[member.role];
						return (
							<div
								key={member.id}
								className={cn(
									"group/card relative rounded-[18px] border bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]",
									member.isActive ? "border-white/10 hover:border-white/20" : "border-white/5 opacity-60 hover:border-white/10",
								)}
							>
								{/* Active dot */}
								<div className={cn("absolute right-4 top-4 h-2.5 w-2.5 rounded-full", member.isActive ? "bg-emerald-400" : "bg-white/15")} />
								{member.isActive && <div className="absolute right-4 top-4 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />}

								{/* Header */}
								<div className="flex items-start gap-3">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-sm font-bold text-white/50">
										{member.fullName.slice(0, 2).toUpperCase()}
									</div>
									<div className="min-w-0 flex-1">
										<button onClick={() => setDetailStaff(member)} className="text-left">
											<span className="block truncate text-sm font-semibold text-white/90 transition-colors hover:text-primary">{member.fullName}</span>
										</button>
										<div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/35">
											{member.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" /> {member.email}</span>}
											{member.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" /> {member.phone}</span>}
										</div>
									</div>
								</div>

								{/* Badges */}
								<div className="mt-3 flex flex-wrap items-center gap-2">
									<span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", roleBadgeClass[member.role])}>
										<RIcon className="h-2.5 w-2.5" /> {formatRoleLabel(member.role)}
									</span>
									<span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", member.isActive ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/30")}>
										{member.isActive ? "ACTIVE" : "INACTIVE"}
									</span>
								</div>

								{/* Branch */}
								<div className="mt-2 flex items-center gap-1 text-[10px] text-white/25">
									<Building2 className="h-2.5 w-2.5" /> {branchMap.get(member.branchId ?? -1) ?? "Unassigned"}
								</div>

								{/* Permissions count */}
								{member.permissions.length > 0 && (
									<div className="mt-1 flex items-center gap-1 text-[10px] text-white/20">
										<Shield className="h-2.5 w-2.5" /> {member.permissions.length} permissions
									</div>
								)}

								{/* Actions */}
								<div className="mt-3 flex items-center gap-1.5">
									<button
										onClick={() => staffActiveMut.mutate({ id: member.id, isActive: !member.isActive })}
										disabled={staffActiveMut.isPending}
										className={cn(
											"flex h-7 items-center gap-1 rounded-[8px] border px-2 text-[10px] font-medium transition-all hover:brightness-110",
											member.isActive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/40",
										)}
									>
										<Power className="h-3 w-3" /> {member.isActive ? "Deactivate" : "Activate"}
									</button>
									<button onClick={() => openStaffModal("edit", member)} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70">
										<Pencil className="h-3 w-3" />
									</button>
									<button onClick={() => setDeleteTarget({ type: "staff", id: member.id, label: member.fullName })} className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-rose-400/15 bg-rose-400/5 text-rose-400/50 transition-all hover:bg-rose-400/15 hover:text-rose-300">
										<Trash2 className="h-3 w-3" />
									</button>
									<button onClick={() => setDetailStaff(member)} className="ml-auto flex h-7 items-center gap-0.5 rounded-[8px] border border-white/5 bg-white/[0.02] px-2 text-[10px] text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/50">
										Details <ChevronRight className="h-3 w-3" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ═══════ ACTIVITY LOG TAB ═══════ */}
			{activeTab === "activity" && (
				<div className={panelClass}>
					<h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Clock className="h-3.5 w-3.5 text-pink-400" /> Recent Activity
					</h3>
					{logs.length === 0 && !logsQ.isLoading && (
						<p className="py-8 text-center text-sm text-white/30">No activity events recorded yet.</p>
					)}
					<div className="space-y-1">
						{logs.slice(0, 50).map((log: ApiStaffActivityLog) => (
							<div key={log.id} className="flex items-start gap-3 rounded-[12px] border border-white/5 bg-black/15 px-3 py-2.5 transition-all hover:border-white/10 hover:bg-black/25">
								<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04]">
									<ShieldCheck className="h-3.5 w-3.5 text-white/30" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-medium text-white/70">{log.action}</p>
									<div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-white/30">
										{log.staffMember && (
											<span className="flex items-center gap-0.5">
												<User className="h-2.5 w-2.5" /> {log.staffMember.fullName}
											</span>
										)}
										{log.branch && (
											<span className="flex items-center gap-0.5">
												<Store className="h-2.5 w-2.5" /> {log.branch.name}
											</span>
										)}
										{log.entityType && (
											<span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px]">{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</span>
										)}
										<span className="ml-auto text-white/20">{formatTimeAgo(log.createdAt)}</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ═══════ PERMISSIONS TAB ═══════ */}
			{activeTab === "permissions" && (
				<div className={panelClass}>
					<h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
						<Lock className="h-3.5 w-3.5 text-amber-400" /> Role Permission Matrix
					</h3>
					{!permsQ.data && permsQ.isLoading && <p className="text-sm text-white/30">Loading permissions...</p>}
					{permsQ.data && (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b border-white/10">
										<th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-white/40">Permission</th>
										{roleOptions.map((r) => (
											<th key={r} className="px-3 py-2.5 text-center">
												<span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold", roleBadgeClass[r])}>
													{formatRoleLabel(r)}
												</span>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{permsQ.data.permissions.map((perm) => (
										<tr key={perm.key} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
											<td className="px-3 py-2">
												<p className="text-[11px] font-medium text-white/60">{perm.label}</p>
												<p className="text-[9px] text-white/20">{perm.key}</p>
											</td>
											{roleOptions.map((role) => {
												const has = permsQ.data.rolePermissions[role]?.includes(perm.key);
												return (
													<td key={role} className="px-3 py-2 text-center">
														<button
															onClick={() => togglePermission(role, perm.key)}
															disabled={permsMut.isPending}
															className={cn(
																"inline-flex h-6 w-6 items-center justify-center rounded-[6px] border transition-all",
																has ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" : "border-white/10 bg-white/[0.02] text-white/15 hover:border-white/20 hover:bg-white/[0.04]",
															)}
														>
															{has && <Check className="h-3 w-3" />}
														</button>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			</div>

			{/* ═══════ Branch Create/Edit Modal ═══════ */}
			<Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							{branchModalMode === "edit" ? <Pencil className="h-5 w-5 text-violet-400" /> : <Store className="h-5 w-5 text-primary" />}
							{branchModalMode === "edit" ? "Edit Branch" : "Add Branch"}
						</DialogTitle>
						<DialogDescription className="text-white/40">Configure branch identity, location, and management.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Branch Code</label>
								<Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="e.g. DHA-01" className={inputClass} />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Branch Name</label>
								<Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Downtown Outlet" className={inputClass} />
							</div>
						</div>
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Address</label>
							<Input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Full street address" className={inputClass} />
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Phone</label>
								<Input value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} placeholder="042-xxxxxxx" className={inputClass} />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Branch Manager</label>
								<Select value={branchManagerId} onValueChange={setBranchManagerId}>
									<SelectTrigger className={cn(inputClass, "h-10")}><SelectValue placeholder="Select manager" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No Manager</SelectItem>
										{staff.filter((s) => s.role === "BRANCH_MANAGER" || s.role === "SUPER_ADMIN").map((s) => (
											<SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setIsBranchModalOpen(false)}>Cancel</Button>
						<Button className={btnPrimary} onClick={() => saveBranchMut.mutate()} disabled={saveBranchMut.isPending}>{saveBranchMut.isPending ? "Saving..." : branchModalMode === "edit" ? "Save Changes" : "Create Branch"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Staff Create/Edit Modal ═══════ */}
			<Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							{staffModalMode === "edit" ? <Pencil className="h-5 w-5 text-sky-400" /> : <UserPlus className="h-5 w-5 text-sky-400" />}
							{staffModalMode === "edit" ? "Edit Staff Member" : "Add Staff Member"}
						</DialogTitle>
						<DialogDescription className="text-white/40">Manage personnel profile, role, and branch assignment.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Full Name</label>
							<Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Staff member name" className={inputClass} />
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Email</label>
								<Input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="name@company.com" className={inputClass} />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Phone</label>
								<Input value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} placeholder="+569 9103 0440" className={inputClass} />
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Role</label>
								<Select value={staffRole} onValueChange={(v) => setStaffRole(v as ApiStaffRole)}>
									<SelectTrigger className={cn(inputClass, "h-10")}><SelectValue placeholder="Select role" /></SelectTrigger>
									<SelectContent>
										{roleOptions.map((r) => <SelectItem key={r} value={r}>{formatRoleLabel(r)}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Branch</label>
								<Select value={staffBranchId} onValueChange={setStaffBranchId}>
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
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
						<Button className="rounded-[14px] bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:brightness-110" onClick={() => saveStaffMut.mutate()} disabled={saveStaffMut.isPending}>
							{saveStaffMut.isPending ? "Saving..." : staffModalMode === "edit" ? "Save Changes" : "Create Staff"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Delete Confirmation Modal ═══════ */}
			<Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<AlertTriangle className="h-5 w-5 text-rose-400" /> Remove {deleteTarget?.type === "branch" ? "Branch" : "Staff Member"}
						</DialogTitle>
						<DialogDescription className="text-white/40">
							This action cannot be undone. &quot;{deleteTarget?.label}&quot; will be permanently removed.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setDeleteTarget(null)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
							onClick={() => {
								if (!deleteTarget) return;
								if (deleteTarget.type === "branch") deleteBranchMut.mutate(deleteTarget.id);
								else deleteStaffMut.mutate(deleteTarget.id);
							}}
							disabled={deleteBranchMut.isPending || deleteStaffMut.isPending}
						>
							{(deleteBranchMut.isPending || deleteStaffMut.isPending) ? "Removing..." : "Remove"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Branch Detail Modal ═══════ */}
			<Dialog open={detailBranch !== null} onOpenChange={(v) => !v && setDetailBranch(null)}>
				<DialogContent className={cn(modalContentClass, "sm:max-w-xl")}>
					{detailBranch && (() => {
						const branchStaff = staff.filter((s) => s.branchId === detailBranch.id);
						return (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-3 text-white">
										<div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-sm font-bold text-violet-300">
											{detailBranch.code.slice(0, 3)}
										</div>
										<div>
											<p className="text-base">{detailBranch.name}</p>
											<p className="text-xs font-normal text-white/40">{detailBranch.code}</p>
										</div>
									</DialogTitle>
								</DialogHeader>

								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Status</p>
										<div className="mt-1 flex items-center gap-2">
											<span className={cn("h-2 w-2 rounded-full", detailBranch.status === "ACTIVE" ? "bg-emerald-400" : "bg-rose-400")} />
											<span className="text-sm font-bold text-white">{detailBranch.status === "ACTIVE" ? "Active" : "Closed"}</span>
										</div>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Primary</p>
										<p className="mt-1 text-sm font-bold text-white">{detailBranch.isPrimary ? "Yes" : "No"}</p>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Address</p>
										<p className="mt-1 text-sm font-bold text-white">{detailBranch.address || "Not set"}</p>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Phone</p>
										<p className="mt-1 text-sm font-bold text-white">{detailBranch.phone || "Not set"}</p>
									</div>
								</div>

								{detailBranch.manager && (
									<div className="flex items-center gap-3 rounded-[12px] border border-sky-400/15 bg-sky-400/5 px-3 py-2.5">
										<Crown className="h-4 w-4 text-sky-400" />
										<div>
											<p className="text-xs font-bold text-sky-300">{detailBranch.manager.fullName}</p>
											<p className="text-[10px] text-sky-400/40">Branch Manager</p>
										</div>
									</div>
								)}

								{/* Staff in this branch */}
								{branchStaff.length > 0 && (
									<div className="rounded-[14px] border border-white/5 bg-black/15 p-3">
										<h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Staff ({branchStaff.length})</h4>
										<div className="space-y-1.5">
											{branchStaff.slice(0, 8).map((s) => (
												<div key={s.id} className="flex items-center gap-2 text-[11px]">
													<span className={cn("h-1.5 w-1.5 rounded-full", s.isActive ? "bg-emerald-400" : "bg-white/15")} />
													<span className="text-white/60">{s.fullName}</span>
													<span className={cn("rounded-full border px-1.5 py-0.5 text-[8px] font-bold", roleBadgeClass[s.role])}>{formatRoleLabel(s.role)}</span>
												</div>
											))}
										</div>
									</div>
								)}

								<div className="flex gap-2">
									<Button variant="outline" className="flex-1 rounded-[12px] border-white/10 text-xs text-white/60" onClick={() => { setDetailBranch(null); openBranchModal("edit", detailBranch); }}>
										<Pencil className="mr-1.5 h-3 w-3" /> Edit
									</Button>
									<Button
										className={cn("flex-1 text-xs font-semibold", detailBranch.status === "ACTIVE" ? "rounded-[12px] bg-emerald-600 text-white" : "rounded-[12px] bg-primary text-primary-foreground font-bold")}
										onClick={() => { branchStatusMut.mutate({ id: detailBranch.id, status: detailBranch.status === "ACTIVE" ? "TEMPORARILY_CLOSED" : "ACTIVE" }); setDetailBranch(null); }}
									>
										<Power className="mr-1.5 h-3 w-3" /> {detailBranch.status === "ACTIVE" ? "Close Branch" : "Activate"}
									</Button>
								</div>
							</>
						);
					})()}
				</DialogContent>
			</Dialog>

			{/* ═══════ Staff Detail Modal ═══════ */}
			<Dialog open={detailStaff !== null} onOpenChange={(v) => !v && setDetailStaff(null)}>
				<DialogContent className={cn(modalContentClass, "sm:max-w-xl")}>
					{detailStaff && (() => {
						const RIcon = roleIcon[detailStaff.role];
						return (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-3 text-white">
										<div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sm font-bold text-sky-300">
											{detailStaff.fullName.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<p className="text-base">{detailStaff.fullName}</p>
											<p className="text-xs font-normal text-white/40">{detailStaff.email ?? "No email"}</p>
										</div>
									</DialogTitle>
								</DialogHeader>

								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Role</p>
										<div className="mt-1 flex items-center gap-2">
											<RIcon className="h-3.5 w-3.5 text-white/50" />
											<span className="text-sm font-bold text-white">{formatRoleLabel(detailStaff.role)}</span>
										</div>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Status</p>
										<div className="mt-1 flex items-center gap-2">
											<span className={cn("h-2 w-2 rounded-full", detailStaff.isActive ? "bg-emerald-400" : "bg-white/15")} />
											<span className="text-sm font-bold text-white">{detailStaff.isActive ? "Active" : "Inactive"}</span>
										</div>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Branch</p>
										<p className="mt-1 text-sm font-bold text-white">{branchMap.get(detailStaff.branchId ?? -1) ?? "Unassigned"}</p>
									</div>
									<div className="rounded-[12px] border border-white/5 bg-black/20 p-3">
										<p className="text-[10px] uppercase text-white/30">Phone</p>
										<p className="mt-1 text-sm font-bold text-white">{detailStaff.phone || "Not set"}</p>
									</div>
								</div>

								{/* Permissions */}
								{detailStaff.permissions.length > 0 && (
									<div className="rounded-[14px] border border-white/5 bg-black/15 p-3">
										<h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Permissions ({detailStaff.permissions.length})</h4>
										<div className="flex flex-wrap gap-1">
											{detailStaff.permissions.map((p) => (
												<span key={p} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] text-white/40">{p.replace(/_/g, " ")}</span>
											))}
										</div>
									</div>
								)}

								<p className="text-[10px] text-white/20">Joined {new Date(detailStaff.createdAt).toLocaleDateString()}</p>

								<div className="flex gap-2">
									<Button variant="outline" className="flex-1 rounded-[12px] border-white/10 text-xs text-white/60" onClick={() => { setDetailStaff(null); openStaffModal("edit", detailStaff); }}>
										<Pencil className="mr-1.5 h-3 w-3" /> Edit
									</Button>
									<Button
										className={cn("flex-1 text-xs", detailStaff.isActive ? "rounded-[12px] bg-gradient-to-r from-emerald-500/80 to-green-500/80 text-white" : "rounded-[12px] bg-gradient-to-r from-sky-500/80 to-cyan-500/80 text-white")}
										onClick={() => { staffActiveMut.mutate({ id: detailStaff.id, isActive: !detailStaff.isActive }); setDetailStaff(null); }}
									>
										<Power className="mr-1.5 h-3 w-3" /> {detailStaff.isActive ? "Deactivate" : "Activate"}
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

export default BranchStaffPage;
