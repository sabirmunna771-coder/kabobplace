import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addAdminInventoryVendorSupply,
	createAdminInventoryIngredient,
	createAdminInventoryVendor,
	createAdminInventoryWasteLog,
	deleteAdminInventoryRecipeLink,
	deleteAdminInventoryVendorSupply,
	getAdminInventoryIngredients,
	getAdminInventoryRecipeLinks,
	getAdminInventoryRestockLogs,
	getAdminInventoryVendors,
	getAdminInventoryWasteLogs,
	getAdminProducts,
	quickAddAdminInventoryStock,
	updateAdminInventoryIngredient,
	updateAdminInventoryVendor,
	upsertAdminInventoryRecipeLink,
	type ApiIngredient,
	type ApiRecipeLink,
	type ApiRestockLog,
	type ApiVendor,
	type ApiWasteLog,
	type InventoryUnit,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	Archive,
	ArrowDownCircle,
	ArrowUpCircle,
	Beaker,
	Box,
	Calendar,
	CircleCheck,
	CircleX,
	Clock,
	DollarSign,
	FileText,
	Link2,
	Package,
	PackageCheck,
	PackageMinus,
	PackageX,
	Pencil,
	Plus,
	Search,
	ShoppingCart,
	Trash2,
	Truck,
	User,
	Warehouse,
	X,
} from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

/* ── Design Tokens ─────────────────────────────────────────── */

const panelClass =
	"group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass =
	"relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const modalContentClass =
	"!rounded-[24px] border-white/10 bg-[#071F07] shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-3xl sm:max-w-2xl [&>button]:text-white/50 [&>button]:hover:text-white";

const inputClass = "rounded-[12px] border-white/15 bg-white/[0.04] text-sm placeholder:text-white/30 focus:border-primary focus:ring-primary/20";

const btnPrimary = "rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-[0.98]";

const UNITS: InventoryUnit[] = ["KG", "LITER", "PIECE", "CRATE", "PACK"];

/* ── Helpers ───────────────────────────────────────────────── */

const slugify = (v: string) =>
	v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const fmtQty = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(2));

const fmtDate = (s: string) => {
	const d = new Date(s);
	return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
};

const stockPercent = (current: number, min: number) => {
	if (min <= 0) return 100;
	return Math.min(100, Math.max(0, (current / min) * 100));
};

const stockColor = (pct: number) => (pct <= 25 ? "bg-rose-500" : pct <= 60 ? "bg-amber-500" : "bg-emerald-500");

/* ── Active Tab Type ───────────────────────────────────────── */

type ActiveTab = "ingredients" | "vendors" | "recipes" | "restocks" | "waste";

/* ── Component ─────────────────────────────────────────────── */

const InventoryPage = () => {
	const { token } = useAuth();
	const { formatPrice: fmtCurrency, settings } = useSiteSettings();
	const qc = useQueryClient();

	/* ─ Queries ─ */
	const ingredientsQ = useQuery({ queryKey: ["inv-ingredients"], queryFn: () => getAdminInventoryIngredients(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const vendorsQ = useQuery({ queryKey: ["inv-vendors"], queryFn: () => getAdminInventoryVendors(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const recipesQ = useQuery({ queryKey: ["inv-recipes"], queryFn: () => getAdminInventoryRecipeLinks(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const restocksQ = useQuery({ queryKey: ["inv-restocks"], queryFn: () => getAdminInventoryRestockLogs(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const wasteQ = useQuery({ queryKey: ["inv-waste"], queryFn: () => getAdminInventoryWasteLogs(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const productsQ = useQuery({ queryKey: ["inv-products"], queryFn: () => getAdminProducts(token!), enabled: Boolean(token), refetchInterval: 60000 });

	const ingredients = ingredientsQ.data?.ingredients ?? [];
	const vendors = vendorsQ.data?.vendors ?? [];
	const recipes = recipesQ.data?.recipeLinks ?? [];
	const restocks = restocksQ.data?.restockLogs ?? [];
	const wastes = wasteQ.data?.wasteLogs ?? [];
	const products = productsQ.data ?? [];

	/* ─ UI state ─ */
	const [activeTab, setActiveTab] = useState<ActiveTab>("ingredients");
	const [search, setSearch] = useState("");
	const [lastSynced] = useState(() => new Date());

	/* ─ Ingredient Modal ─ */
	const [ingModalOpen, setIngModalOpen] = useState(false);
	const [ingEditId, setIngEditId] = useState<number | null>(null);
	const [ingName, setIngName] = useState("");
	const [ingSlug, setIngSlug] = useState("");
	const [ingUnit, setIngUnit] = useState<InventoryUnit>("PIECE");
	const [ingCurrentQty, setIngCurrentQty] = useState("");
	const [ingMinQty, setIngMinQty] = useState("");
	const [ingIsCore, setIngIsCore] = useState(true);

	/* ─ Restock Modal ─ */
	const [restockModalOpen, setRestockModalOpen] = useState(false);
	const [restockIngId, setRestockIngId] = useState<string>("");
	const [restockQty, setRestockQty] = useState("");
	const [restockUnitCost, setRestockUnitCost] = useState("");
	const [restockVendorId, setRestockVendorId] = useState<string>("");
	const [restockNote, setRestockNote] = useState("");

	/* ─ Waste Modal ─ */
	const [wasteModalOpen, setWasteModalOpen] = useState(false);
	const [wasteIngId, setWasteIngId] = useState<string>("");
	const [wasteQty, setWasteQty] = useState("");
	const [wasteReason, setWasteReason] = useState("");
	const [wasteNote, setWasteNote] = useState("");

	/* ─ Vendor Modal ─ */
	const [vendorModalOpen, setVendorModalOpen] = useState(false);
	const [vendorEditId, setVendorEditId] = useState<number | null>(null);
	const [vendorName, setVendorName] = useState("");
	const [vendorContact, setVendorContact] = useState("");
	const [vendorPhone, setVendorPhone] = useState("");
	const [vendorEmail, setVendorEmail] = useState("");
	const [vendorNotes, setVendorNotes] = useState("");

	/* ─ Vendor Supply Modal ─ */
	const [supplyModalOpen, setSupplyModalOpen] = useState(false);
	const [supplyVendorId, setSupplyVendorId] = useState<number | null>(null);
	const [supplyIngId, setSupplyIngId] = useState<string>("");
	const [supplyItemName, setSupplyItemName] = useState("");

	/* ─ Recipe Link Modal ─ */
	const [recipeModalOpen, setRecipeModalOpen] = useState(false);
	const [recipeProductId, setRecipeProductId] = useState<string>("");
	const [recipeIngId, setRecipeIngId] = useState<string>("");
	const [recipeQty, setRecipeQty] = useState("");

	/* ─ Invalidation helper ─ */
	const inv = (...keys: string[]) => { keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] })); };

	/* ── Mutations ─────────────────────────────────────────── */

	const createIngMut = useMutation({
		mutationFn: () => {
			const name = ingName.trim();
			if (!name) throw new Error("Name required");
			return createAdminInventoryIngredient(token!, {
				name,
				slug: ingSlug.trim() || slugify(name) || `ing-${Date.now()}`,
				unit: ingUnit,
				currentQty: Number(ingCurrentQty) || 0,
				minQty: Number(ingMinQty) || 0,
				isCore: ingIsCore,
			});
		},
		onSuccess: () => { toast.success("Ingredient created"); setIngModalOpen(false); inv("inv-ingredients"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const updateIngMut = useMutation({
		mutationFn: () => {
			if (!ingEditId) throw new Error("No ingredient selected");
			return updateAdminInventoryIngredient(token!, ingEditId, {
				name: ingName.trim() || undefined,
				slug: ingSlug.trim() || undefined,
				unit: ingUnit,
				currentQty: ingCurrentQty !== "" ? Number(ingCurrentQty) : undefined,
				minQty: ingMinQty !== "" ? Number(ingMinQty) : undefined,
				isCore: ingIsCore,
			});
		},
		onSuccess: () => { toast.success("Ingredient updated"); setIngModalOpen(false); inv("inv-ingredients"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const restockMut = useMutation({
		mutationFn: () => {
			const id = Number(restockIngId);
			if (!id) throw new Error("Select an ingredient");
			const qty = Number(restockQty);
			if (qty <= 0) throw new Error("Quantity must be > 0");
			return quickAddAdminInventoryStock(token!, id, {
				quantity: qty,
				unitCost: Number(restockUnitCost) || 0,
				vendorId: restockVendorId ? Number(restockVendorId) : undefined,
				note: restockNote.trim() || undefined,
			});
		},
		onSuccess: () => { toast.success("Stock restocked"); setRestockModalOpen(false); inv("inv-ingredients", "inv-restocks"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const wasteMut = useMutation({
		mutationFn: () => {
			const id = Number(wasteIngId);
			if (!id) throw new Error("Select an ingredient");
			const qty = Number(wasteQty);
			if (qty <= 0) throw new Error("Quantity must be > 0");
			return createAdminInventoryWasteLog(token!, id, {
				quantity: qty,
				reason: wasteReason.trim() || undefined,
				note: wasteNote.trim() || undefined,
			});
		},
		onSuccess: () => { toast.success("Waste logged"); setWasteModalOpen(false); inv("inv-ingredients", "inv-waste"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const createVendorMut = useMutation({
		mutationFn: () => {
			const name = vendorName.trim();
			if (!name) throw new Error("Name required");
			return createAdminInventoryVendor(token!, {
				name,
				contactName: vendorContact.trim() || undefined,
				phone: vendorPhone.trim() || undefined,
				email: vendorEmail.trim() || undefined,
				notes: vendorNotes.trim() || undefined,
			});
		},
		onSuccess: () => { toast.success("Vendor created"); setVendorModalOpen(false); inv("inv-vendors"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const updateVendorMut = useMutation({
		mutationFn: () => {
			if (!vendorEditId) throw new Error("No vendor selected");
			return updateAdminInventoryVendor(token!, vendorEditId, {
				name: vendorName.trim() || undefined,
				contactName: vendorContact.trim() || undefined,
				phone: vendorPhone.trim() || undefined,
				email: vendorEmail.trim() || undefined,
				notes: vendorNotes.trim() || undefined,
			});
		},
		onSuccess: () => { toast.success("Vendor updated"); setVendorModalOpen(false); inv("inv-vendors"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const addSupplyMut = useMutation({
		mutationFn: () => {
			if (!supplyVendorId) throw new Error("No vendor");
			const ingId = Number(supplyIngId);
			if (!ingId) throw new Error("Select ingredient");
			return addAdminInventoryVendorSupply(token!, supplyVendorId, {
				ingredientId: ingId,
				itemName: supplyItemName.trim() || undefined,
			});
		},
		onSuccess: () => { toast.success("Supply link added"); setSupplyModalOpen(false); inv("inv-vendors"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const deleteSupplyMut = useMutation({
		mutationFn: (id: number) => deleteAdminInventoryVendorSupply(token!, id),
		onSuccess: () => { toast.success("Supply link removed"); inv("inv-vendors"); },
	});

	const upsertRecipeMut = useMutation({
		mutationFn: () => {
			const pId = Number(recipeProductId);
			const iId = Number(recipeIngId);
			const qty = Number(recipeQty);
			if (!pId || !iId || qty <= 0) throw new Error("Fill all fields");
			return upsertAdminInventoryRecipeLink(token!, { productId: pId, ingredientId: iId, quantity: qty });
		},
		onSuccess: () => { toast.success("Recipe link saved"); setRecipeModalOpen(false); inv("inv-recipes"); },
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
	});

	const deleteRecipeMut = useMutation({
		mutationFn: (id: number) => deleteAdminInventoryRecipeLink(token!, id),
		onSuccess: () => { toast.success("Recipe link removed"); inv("inv-recipes"); },
	});

	/* ── Modal openers ─────────────────────────────────────── */

	const openCreateIngredient = () => {
		setIngEditId(null); setIngName(""); setIngSlug(""); setIngUnit("PIECE"); setIngCurrentQty("0"); setIngMinQty("0"); setIngIsCore(true);
		setIngModalOpen(true);
	};

	const openEditIngredient = (ing: ApiIngredient) => {
		setIngEditId(ing.id); setIngName(ing.name); setIngSlug(ing.slug); setIngUnit(ing.unit); setIngCurrentQty(String(ing.currentQty)); setIngMinQty(String(ing.minQty)); setIngIsCore(ing.isCore);
		setIngModalOpen(true);
	};

	const openRestock = (prefillId?: number) => {
		setRestockIngId(prefillId ? String(prefillId) : ""); setRestockQty(""); setRestockUnitCost(""); setRestockVendorId(""); setRestockNote("");
		setRestockModalOpen(true);
	};

	const openWaste = (prefillId?: number) => {
		setWasteIngId(prefillId ? String(prefillId) : ""); setWasteQty(""); setWasteReason(""); setWasteNote("");
		setWasteModalOpen(true);
	};

	const openCreateVendor = () => {
		setVendorEditId(null); setVendorName(""); setVendorContact(""); setVendorPhone(""); setVendorEmail(""); setVendorNotes("");
		setVendorModalOpen(true);
	};

	const openEditVendor = (v: ApiVendor) => {
		setVendorEditId(v.id); setVendorName(v.name); setVendorContact(v.contactName ?? ""); setVendorPhone(v.phone ?? ""); setVendorEmail(v.email ?? ""); setVendorNotes(v.notes ?? "");
		setVendorModalOpen(true);
	};

	const openAddSupply = (vendorId: number) => {
		setSupplyVendorId(vendorId); setSupplyIngId(""); setSupplyItemName("");
		setSupplyModalOpen(true);
	};

	const openRecipeLink = () => {
		setRecipeProductId(""); setRecipeIngId(""); setRecipeQty("");
		setRecipeModalOpen(true);
	};

	/* ── Filtered data ─────────────────────────────────────── */

	const lowStockCount = ingredients.filter((i) => i.isLowStock).length;
	const totalRestockCost = restocks.reduce((sum, r) => sum + r.totalCost, 0);

	const filteredIngredients = useMemo(() => {
		if (!search.trim()) return ingredients;
		const q = search.toLowerCase();
		return ingredients.filter((i) => i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q));
	}, [ingredients, search]);

	const filteredVendors = useMemo(() => {
		if (!search.trim()) return vendors;
		const q = search.toLowerCase();
		return vendors.filter((v) => v.name.toLowerCase().includes(q) || v.contactName?.toLowerCase().includes(q));
	}, [vendors, search]);

	const filteredRecipes = useMemo(() => {
		if (!search.trim()) return recipes;
		const q = search.toLowerCase();
		return recipes.filter((r) => r.productName.toLowerCase().includes(q) || r.ingredientName.toLowerCase().includes(q));
	}, [recipes, search]);

	const filteredRestocks = useMemo(() => {
		if (!search.trim()) return restocks;
		const q = search.toLowerCase();
		return restocks.filter((r) => r.ingredientName.toLowerCase().includes(q) || r.vendorName?.toLowerCase().includes(q));
	}, [restocks, search]);

	const filteredWaste = useMemo(() => {
		if (!search.trim()) return wastes;
		const q = search.toLowerCase();
		return wastes.filter((w) => w.ingredientName.toLowerCase().includes(q) || w.reason?.toLowerCase().includes(q));
	}, [wastes, search]);

	/* ── Tab Config ────────────────────────────────────────── */

	const tabs: Array<{ key: ActiveTab; label: string; Icon: typeof Package; count: number }> = [
		{ key: "ingredients", label: "Ingredients", Icon: Box, count: ingredients.length },
		{ key: "vendors", label: "Vendors", Icon: Truck, count: vendors.length },
		{ key: "recipes", label: "Recipe Links", Icon: Link2, count: recipes.length },
		{ key: "restocks", label: "Restock Log", Icon: ArrowUpCircle, count: restocks.length },
		{ key: "waste", label: "Waste Log", Icon: ArrowDownCircle, count: wastes.length },
	];

	/* ── Render ─────────────────────────────────────────────── */

	return (
		<ModuleScaffold title="Inventory" subtitle="" hideHeader>
			<div className="space-y-5">

				{/* ═══════ Header Bar ═══════ */}
				<div className={headerBarClass}>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/20">
							<Warehouse className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Inventory Intelligence Center</h1>
							<p className="flex items-center gap-1.5 text-xs text-white/40">
								<Clock className="h-3 w-3" />
								Last synced {lastSynced.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
							</p>
						</div>
					</div>
					<div className="relative w-full max-w-xs">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search inventory..."
							className={cn(inputClass, "pl-9")}
						/>
					</div>
				</div>

				{/* ═══════ Stat Cards ═══════ */}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
					{[
						{ label: "Total Ingredients", value: ingredients.length, Icon: Box, color: "from-sky-500/20 to-cyan-500/20", text: "text-sky-400" },
						{ label: "Low Stock Alerts", value: lowStockCount, Icon: AlertTriangle, color: "from-rose-500/20 to-red-500/20", text: "text-rose-400" },
						{ label: "Active Vendors", value: vendors.length, Icon: Truck, color: "from-violet-500/20 to-purple-500/20", text: "text-violet-400" },
						{ label: "Recipe Links", value: recipes.length, Icon: Link2, color: "from-amber-500/20 to-accent/20", text: "text-amber-400" },
						{ label: "Restock Entries", value: restocks.length, Icon: ArrowUpCircle, color: "from-emerald-500/20 to-green-500/20", text: "text-emerald-400" },
						{ label: "Total Restock Cost", value: fmtCurrency(totalRestockCost), Icon: DollarSign, color: "from-primary/20 to-accent/20", text: "text-primary" },
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
				<div className="flex flex-wrap gap-2">
					<Button className={btnPrimary} onClick={openCreateIngredient}><Plus className="mr-1.5 h-4 w-4" /> Add Ingredient</Button>
					<Button className="rounded-[14px] bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20" onClick={() => openRestock()}><ArrowUpCircle className="mr-1.5 h-4 w-4" /> Restock</Button>
					<Button className="rounded-[14px] bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20" onClick={() => openWaste()}><PackageMinus className="mr-1.5 h-4 w-4" /> Log Waste</Button>
					<Button className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20" onClick={openCreateVendor}><Truck className="mr-1.5 h-4 w-4" /> Add Vendor</Button>
					<Button className="rounded-[14px] bg-accent px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-accent/20" onClick={openRecipeLink}><Link2 className="mr-1.5 h-4 w-4" /> Link Recipe</Button>
				</div>

				{/* ═══════ Tab Navigator ═══════ */}
				<div className="flex gap-1 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
					{tabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setActiveTab(t.key)}
							className={cn(
								"flex items-center gap-2 whitespace-nowrap rounded-[12px] px-4 py-2.5 text-sm font-medium transition-all",
								activeTab === t.key
									? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
									: "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
							)}
						>
							<t.Icon className="h-4 w-4" />
							{t.label}
							<span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold", activeTab === t.key ? "bg-black/20 text-primary-foreground" : "bg-white/10 text-white/30")}>{t.count}</span>
						</button>
					))}
				</div>

				{/* ═══════ TAB: Ingredients ═══════ */}
				{activeTab === "ingredients" && (
					<div className="space-y-3">
						{ingredientsQ.isLoading && <p className="text-sm text-white/40">Loading ingredients...</p>}
						{filteredIngredients.length === 0 && !ingredientsQ.isLoading && (
							<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
								<Package className="mb-3 h-12 w-12 text-white/20" />
								<p className="text-sm text-white/40">No ingredients found</p>
								<Button className={cn(btnPrimary, "mt-4")} onClick={openCreateIngredient}><Plus className="mr-1.5 h-4 w-4" /> Add First Ingredient</Button>
							</div>
						)}
						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{filteredIngredients.map((ing) => {
								const pct = stockPercent(ing.currentQty, ing.minQty);
								return (
									<div key={ing.id} className={panelClass}>
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<div className={cn(
													"flex h-10 w-10 items-center justify-center rounded-[12px]",
													ing.isLowStock ? "bg-rose-500/20" : "bg-emerald-500/20",
												)}>
													{ing.isLowStock ? <PackageX className="h-5 w-5 text-rose-400" /> : <PackageCheck className="h-5 w-5 text-emerald-400" />}
												</div>
												<div>
													<h3 className="flex items-center gap-2 text-sm font-semibold text-white">
														{ing.name}
														{ing.isCore && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">CORE</span>}
													</h3>
													<p className="text-xs text-white/40">{ing.slug} &middot; {ing.unit}</p>
												</div>
											</div>
											<div className="flex gap-1">
												<button onClick={() => openEditIngredient(ing)} className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white/60">
													<Pencil className="h-3.5 w-3.5" />
												</button>
											</div>
										</div>

										{/* Stock bar */}
										<div className="mt-4">
											<div className="flex items-baseline justify-between text-xs">
												<span className="font-semibold text-white">{fmtQty(ing.currentQty)} {ing.unit}</span>
												<span className="text-white/30">Min: {fmtQty(ing.minQty)}</span>
											</div>
											<div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
												<div className={cn("h-full rounded-full transition-all", stockColor(pct))} style={{ width: `${pct}%` }} />
											</div>
											{ing.isLowStock && (
												<p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-400">
													<AlertTriangle className="h-3 w-3" /> Low stock — restock needed
												</p>
											)}
										</div>

										{/* Quick actions */}
										<div className="mt-3 flex gap-2">
											<Button variant="outline" className="h-8 flex-1 rounded-[10px] border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/10" onClick={() => openRestock(ing.id)}>
												<ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> Restock
											</Button>
											<Button variant="outline" className="h-8 flex-1 rounded-[10px] border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10" onClick={() => openWaste(ing.id)}>
												<ArrowDownCircle className="mr-1 h-3.5 w-3.5" /> Waste
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* ═══════ TAB: Vendors ═══════ */}
				{activeTab === "vendors" && (
					<div className="space-y-3">
						{vendorsQ.isLoading && <p className="text-sm text-white/40">Loading vendors...</p>}
						{filteredVendors.length === 0 && !vendorsQ.isLoading && (
							<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
								<Truck className="mb-3 h-12 w-12 text-white/20" />
								<p className="text-sm text-white/40">No vendors yet</p>
								<Button className={cn(btnPrimary, "mt-4")} onClick={openCreateVendor}><Plus className="mr-1.5 h-4 w-4" /> Add First Vendor</Button>
							</div>
						)}
						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{filteredVendors.map((v) => (
								<div key={v.id} className={panelClass}>
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-violet-500/20">
												<Truck className="h-5 w-5 text-violet-400" />
											</div>
											<div>
												<h3 className="text-sm font-semibold text-white">{v.name}</h3>
												{v.contactName && <p className="flex items-center gap-1 text-xs text-white/40"><User className="h-3 w-3" /> {v.contactName}</p>}
											</div>
										</div>
										<button onClick={() => openEditVendor(v)} className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white/60">
											<Pencil className="h-3.5 w-3.5" />
										</button>
									</div>

									{/* Contact details */}
									<div className="mt-3 space-y-1">
										{v.phone && <p className="text-xs text-white/50">{v.phone}</p>}
										{v.email && <p className="text-xs text-white/50">{v.email}</p>}
										{v.notes && <p className="mt-1 text-xs italic text-white/30">{v.notes}</p>}
									</div>

									{/* Supplies */}
									<div className="mt-3 border-t border-white/5 pt-3">
										<div className="flex items-center justify-between">
											<p className="text-[11px] font-medium uppercase tracking-wider text-white/30">Supplies ({v.supplies.length})</p>
											<button onClick={() => openAddSupply(v.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-violet-400 hover:bg-violet-500/10">
												<Plus className="h-3 w-3" /> Add
											</button>
										</div>
										{v.supplies.length > 0 ? (
											<div className="mt-2 flex flex-wrap gap-1.5">
												{v.supplies.map((s) => (
													<span key={s.id} className="group/pill flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/60">
														{s.ingredientName}{s.itemName ? ` (${s.itemName})` : ""}
														<button onClick={() => deleteSupplyMut.mutate(s.id)} className="ml-0.5 opacity-0 transition group-hover/pill:opacity-100">
															<X className="h-3 w-3 text-white/30 hover:text-rose-400" />
														</button>
													</span>
												))}
											</div>
										) : (
											<p className="mt-1.5 text-[11px] text-white/20">No supply links yet</p>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ═══════ TAB: Recipe Links ═══════ */}
				{activeTab === "recipes" && (
					<div className="space-y-3">
						{recipesQ.isLoading && <p className="text-sm text-white/40">Loading recipe links...</p>}
						{filteredRecipes.length === 0 && !recipesQ.isLoading && (
							<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
								<Link2 className="mb-3 h-12 w-12 text-white/20" />
								<p className="text-sm text-white/40">No recipe links yet</p>
								<Button className={cn(btnPrimary, "mt-4")} onClick={openRecipeLink}><Plus className="mr-1.5 h-4 w-4" /> Add First Recipe Link</Button>
							</div>
						)}
						<div className={panelClass}>
							<div className="flex items-center justify-between mb-4">
								<h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Beaker className="h-4 w-4 text-amber-400" /> Product-Ingredient Mapping</h3>
								<Button variant="outline" className="h-8 rounded-[10px] border-amber-500/30 text-xs text-amber-400 hover:bg-amber-500/10" onClick={openRecipeLink}><Plus className="mr-1 h-3.5 w-3.5" /> Add Link</Button>
							</div>
							{filteredRecipes.length > 0 && (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-white/10 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
												<th className="pb-3 pr-4">Product</th>
												<th className="pb-3 pr-4">Ingredient</th>
												<th className="pb-3 pr-4">Qty / Unit</th>
												<th className="pb-3 text-right">Actions</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-white/5">
											{filteredRecipes.map((r) => (
												<tr key={r.id} className="group/row">
													<td className="py-3 pr-4">
														<span className="flex items-center gap-2 text-white/80">
															<ShoppingCart className="h-3.5 w-3.5 text-primary" />
															{r.productName}
														</span>
													</td>
													<td className="py-3 pr-4 text-white/60">{r.ingredientName}</td>
													<td className="py-3 pr-4 text-white/60">{fmtQty(r.quantity)} {r.ingredientUnit}</td>
													<td className="py-3 text-right">
														<button onClick={() => deleteRecipeMut.mutate(r.id)} className="rounded-lg p-1.5 text-white/20 transition hover:bg-rose-500/10 hover:text-rose-400">
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ═══════ TAB: Restock Log ═══════ */}
				{activeTab === "restocks" && (
					<div className="space-y-3">
						{restocksQ.isLoading && <p className="text-sm text-white/40">Loading restock logs...</p>}
						{filteredRestocks.length === 0 && !restocksQ.isLoading && (
							<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
								<ArrowUpCircle className="mb-3 h-12 w-12 text-white/20" />
								<p className="text-sm text-white/40">No restock entries yet</p>
							</div>
						)}
						{filteredRestocks.length > 0 && (
							<div className={panelClass}>
								<h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><ArrowUpCircle className="h-4 w-4 text-emerald-400" /> Restock History</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-white/10 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
												<th className="pb-3 pr-4">Date</th>
												<th className="pb-3 pr-4">Ingredient</th>
												<th className="pb-3 pr-4">Qty</th>
												<th className="pb-3 pr-4">Unit Cost</th>
												<th className="pb-3 pr-4">Total</th>
												<th className="pb-3 pr-4">Vendor</th>
												<th className="pb-3">Note</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-white/5">
											{filteredRestocks.map((r) => (
												<tr key={r.id}>
													<td className="py-3 pr-4 text-[11px] text-white/40">{fmtDate(r.createdAt)}</td>
													<td className="py-3 pr-4 font-medium text-white/80">{r.ingredientName}</td>
													<td className="py-3 pr-4 text-white/60">{fmtQty(r.quantity)} {r.unit}</td>
													<td className="py-3 pr-4 text-white/60">{fmtCurrency(r.unitCost)}</td>
													<td className="py-3 pr-4 font-semibold text-emerald-400">{fmtCurrency(r.totalCost)}</td>
													<td className="py-3 pr-4 text-white/50">{r.vendorName ?? "—"}</td>
													<td className="py-3 text-xs text-white/30">{r.note ?? "—"}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}

				{/* ═══════ TAB: Waste Log ═══════ */}
				{activeTab === "waste" && (
					<div className="space-y-3">
						{wasteQ.isLoading && <p className="text-sm text-white/40">Loading waste logs...</p>}
						{filteredWaste.length === 0 && !wasteQ.isLoading && (
							<div className={cn(panelClass, "flex flex-col items-center justify-center py-12 text-center")}>
								<ArrowDownCircle className="mb-3 h-12 w-12 text-white/20" />
								<p className="text-sm text-white/40">No waste entries yet</p>
							</div>
						)}
						{filteredWaste.length > 0 && (
							<div className={panelClass}>
								<h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><ArrowDownCircle className="h-4 w-4 text-rose-400" /> Waste History</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-white/10 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
												<th className="pb-3 pr-4">Date</th>
												<th className="pb-3 pr-4">Ingredient</th>
												<th className="pb-3 pr-4">Qty</th>
												<th className="pb-3 pr-4">Reason</th>
												<th className="pb-3">Note</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-white/5">
											{filteredWaste.map((w) => (
												<tr key={w.id}>
													<td className="py-3 pr-4 text-[11px] text-white/40">{fmtDate(w.createdAt)}</td>
													<td className="py-3 pr-4 font-medium text-white/80">{w.ingredientName}</td>
													<td className="py-3 pr-4 text-rose-400">{fmtQty(w.quantity)} {w.unit}</td>
													<td className="py-3 pr-4 text-white/50">{w.reason ?? "—"}</td>
													<td className="py-3 text-xs text-white/30">{w.note ?? "—"}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}

			</div>

			{/* ═══════════════════════════════════════════════════
			     MODALS
			   ═══════════════════════════════════════════════════ */}

			{/* ── Ingredient Modal ── */}
			<Dialog open={ingModalOpen} onOpenChange={setIngModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Box className="h-5 w-5 text-primary" />
							{ingEditId ? "Edit Ingredient" : "New Ingredient"}
						</DialogTitle>
						<DialogDescription className="text-white/40">
							{ingEditId ? "Update ingredient details and stock levels." : "Add a new raw material to your inventory."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Name</label>
								<Input className={inputClass} value={ingName} onChange={(e) => { setIngName(e.target.value); if (!ingEditId) setIngSlug(slugify(e.target.value)); }} placeholder="e.g. Chicken Breast" />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Slug</label>
								<Input className={inputClass} value={ingSlug} onChange={(e) => setIngSlug(e.target.value)} placeholder="auto-generated" />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-3">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Unit</label>
								<Select value={ingUnit} onValueChange={(v) => setIngUnit(v as InventoryUnit)}>
									<SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
									<SelectContent className="border-white/10 bg-[#1a1a22]">
										{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Current Qty</label>
								<Input type="number" className={inputClass} value={ingCurrentQty} onChange={(e) => setIngCurrentQty(e.target.value)} placeholder="0" />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Min Qty</label>
								<Input type="number" className={inputClass} value={ingMinQty} onChange={(e) => setIngMinQty(e.target.value)} placeholder="0" />
							</div>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3">
							<div>
								<p className="text-sm font-medium text-white">Core Ingredient</p>
								<p className="text-xs text-white/40">Mark as essential for operations</p>
							</div>
							<Switch checked={ingIsCore} onCheckedChange={setIngIsCore} />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setIngModalOpen(false)}>Cancel</Button>
						<Button
							className={btnPrimary}
							disabled={createIngMut.isPending || updateIngMut.isPending}
							onClick={() => ingEditId ? updateIngMut.mutate() : createIngMut.mutate()}
						>
							{ingEditId ? "Save Changes" : "Create Ingredient"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Restock Modal ── */}
			<Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<ArrowUpCircle className="h-5 w-5 text-emerald-400" />
							Restock Inventory
						</DialogTitle>
						<DialogDescription className="text-white/40">Add stock with cost tracking and vendor attribution.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Ingredient</label>
							<Select value={restockIngId} onValueChange={setRestockIngId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{ingredients.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({fmtQty(i.currentQty)} {i.unit})</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Quantity</label>
								<Input type="number" className={inputClass} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="0" />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Unit Cost ({settings.currencySymbol || "$"})</label>
								<Input type="number" className={inputClass} value={restockUnitCost} onChange={(e) => setRestockUnitCost(e.target.value)} placeholder="0.00" />
							</div>
						</div>

						{/* Cost preview */}
						{Number(restockQty) > 0 && Number(restockUnitCost) > 0 && (
							<div className="flex items-center justify-between rounded-[12px] border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
								<span className="text-sm text-white/60">Total Cost</span>
								<span className="text-lg font-bold text-emerald-400">{fmtCurrency(Number(restockQty) * Number(restockUnitCost))}</span>
							</div>
						)}

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Vendor (optional)</label>
							<Select value={restockVendorId} onValueChange={setRestockVendorId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select vendor..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{vendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Note (optional)</label>
							<Textarea className={cn(inputClass, "min-h-[60px]")} value={restockNote} onChange={(e) => setRestockNote(e.target.value)} placeholder="Delivery batch #, invoice ref, etc." />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setRestockModalOpen(false)}>Cancel</Button>
						<Button className="rounded-[14px] bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white" disabled={restockMut.isPending} onClick={() => restockMut.mutate()}>
							Confirm Restock
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Waste Modal ── */}
			<Dialog open={wasteModalOpen} onOpenChange={setWasteModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<PackageMinus className="h-5 w-5 text-rose-400" />
							Log Waste
						</DialogTitle>
						<DialogDescription className="text-white/40">Record spoilage, damage, or waste for accurate tracking.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Ingredient</label>
							<Select value={wasteIngId} onValueChange={setWasteIngId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{ingredients.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({fmtQty(i.currentQty)} {i.unit})</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Quantity Wasted</label>
							<Input type="number" className={inputClass} value={wasteQty} onChange={(e) => setWasteQty(e.target.value)} placeholder="0" />
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Reason</label>
							<Select value={wasteReason} onValueChange={setWasteReason}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select reason..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{["Expired", "Spoiled", "Damaged", "Overcooked", "Dropped", "Contaminated", "Quality Issue", "Other"].map((r) => (
										<SelectItem key={r} value={r}>{r}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Note (optional)</label>
							<Textarea className={cn(inputClass, "min-h-[60px]")} value={wasteNote} onChange={(e) => setWasteNote(e.target.value)} placeholder="Additional details..." />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setWasteModalOpen(false)}>Cancel</Button>
						<Button className="rounded-[14px] bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white" disabled={wasteMut.isPending} onClick={() => wasteMut.mutate()}>
							Log Waste
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Vendor Modal ── */}
			<Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Truck className="h-5 w-5 text-violet-400" />
							{vendorEditId ? "Edit Vendor" : "New Vendor"}
						</DialogTitle>
						<DialogDescription className="text-white/40">
							{vendorEditId ? "Update vendor details." : "Register a new supplier or vendor."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Company Name</label>
							<Input className={inputClass} value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Fresh Foods Ltd." />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Contact Person</label>
								<Input className={inputClass} value={vendorContact} onChange={(e) => setVendorContact(e.target.value)} placeholder="Full name" />
							</div>
							<div>
								<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Phone</label>
								<Input className={inputClass} value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} placeholder="+569 9103 0440" />
							</div>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Email</label>
							<Input type="email" className={inputClass} value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="vendor@example.com" />
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Notes</label>
							<Textarea className={cn(inputClass, "min-h-[60px]")} value={vendorNotes} onChange={(e) => setVendorNotes(e.target.value)} placeholder="Payment terms, delivery schedule, etc." />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
						<Button
							className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white"
							disabled={createVendorMut.isPending || updateVendorMut.isPending}
							onClick={() => vendorEditId ? updateVendorMut.mutate() : createVendorMut.mutate()}
						>
							{vendorEditId ? "Save Changes" : "Create Vendor"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Vendor Supply Modal ── */}
			<Dialog open={supplyModalOpen} onOpenChange={setSupplyModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Package className="h-5 w-5 text-violet-400" />
							Add Vendor Supply
						</DialogTitle>
						<DialogDescription className="text-white/40">Link an ingredient to this vendor.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Ingredient</label>
							<Select value={supplyIngId} onValueChange={setSupplyIngId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{ingredients.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Item Name (optional)</label>
							<Input className={inputClass} value={supplyItemName} onChange={(e) => setSupplyItemName(e.target.value)} placeholder="Vendor's SKU or item name" />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setSupplyModalOpen(false)}>Cancel</Button>
						<Button className="rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white" disabled={addSupplyMut.isPending} onClick={() => addSupplyMut.mutate()}>
							Add Supply Link
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Recipe Link Modal ── */}
			<Dialog open={recipeModalOpen} onOpenChange={setRecipeModalOpen}>
				<DialogContent className={modalContentClass}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Beaker className="h-5 w-5 text-amber-400" />
							Link Recipe
						</DialogTitle>
						<DialogDescription className="text-white/40">Define how much of an ingredient a product needs.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Product</label>
							<Select value={recipeProductId} onValueChange={setRecipeProductId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select product..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{products.map((p) => <SelectItem key={p.dbId} value={String(p.dbId)}>{p.name}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Ingredient</label>
							<Select value={recipeIngId} onValueChange={setRecipeIngId}>
								<SelectTrigger className={inputClass}><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
								<SelectContent className="border-white/10 bg-[#1a1a22]">
									{ingredients.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.unit})</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Quantity Required</label>
							<Input type="number" className={inputClass} value={recipeQty} onChange={(e) => setRecipeQty(e.target.value)} placeholder="e.g. 0.250" />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" className="rounded-[12px] border-white/10 text-white/60" onClick={() => setRecipeModalOpen(false)}>Cancel</Button>
						<Button className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105" disabled={upsertRecipeMut.isPending} onClick={() => upsertRecipeMut.mutate()}>
							Save Recipe Link
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</ModuleScaffold>
	);
};

export default InventoryPage;
