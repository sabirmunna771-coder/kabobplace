import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	bulkUpdateAdminCategoryPricing,
	createAdminCategory,
	createAdminDeal,
	createAdminProduct,
	deleteAdminCategory,
	deleteAdminDeal,
	deleteAdminProduct,
	getAdminCategories,
	getAdminDeals,
	getAdminProducts,
	updateAdminCategory,
	updateAdminDeal,
	updateAdminProduct,
	type ApiCategory,
	type ApiDeal,
	type StoreProduct,
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
import { Pencil as LuPencil, Plus, Search, Tags, Trash2 as LuTrash2, Clock, TrendingUp, AlertCircle, Image as LuImage, Zap, ChevronDown, Star, Flame, Leaf, Package, FileText, ImageIcon, Settings2, Wrench, CircleCheck, CircleX, PackageCheck, PackageX, Pizza, Sandwich, Coffee, IceCream, Beef, Drumstick, Salad, Soup, Cherry, Cookie, Citrus, Fish, Wheat, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";

type ProductModalMode = "create" | "edit";
type CategoryModalMode = "create" | "edit";
type DealModalMode = "create" | "edit";
type ProductTabMode = "basic" | "media" | "attributes" | "modifiers";

interface ProductModifier {
	id?: number;
	name: string;
	price: number;
	productId?: number;
}

const panelClass = "group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B3D0B]/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B3D0B]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.3)] sm:p-6";

const headerBarClass = "relative flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#0B3D0B]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5";

const categoryIconOptions: Array<{ key: string; label: string; Icon: LucideIcon }> = [
	{ key: "sandwich", label: "Burger", Icon: Sandwich },
	{ key: "pizza", label: "Pizza", Icon: Pizza },
	{ key: "beef", label: "Wrap", Icon: Beef },
	{ key: "coffee", label: "Drinks", Icon: Coffee },
	{ key: "icecream", label: "Desserts", Icon: IceCream },
	{ key: "soup", label: "Soup", Icon: Soup },
	{ key: "drumstick", label: "Chicken", Icon: Drumstick },
	{ key: "flame", label: "Hot", Icon: Flame },
	{ key: "star", label: "Special", Icon: Star },
	{ key: "salad", label: "Salad", Icon: Salad },
	{ key: "fish", label: "Seafood", Icon: Fish },
	{ key: "cherry", label: "Fruits", Icon: Cherry },
	{ key: "cookie", label: "Snacks", Icon: Cookie },
	{ key: "wheat", label: "Bakery", Icon: Wheat },
	{ key: "citrus", label: "Fresh", Icon: Citrus },
];

const getCategoryIcon = (iconKey: string | null | undefined): LucideIcon => {
	const found = categoryIconOptions.find((opt) => opt.key === iconKey);
	return found?.Icon ?? Package;
};

const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");

const getDealTimerLabel = (deal: ApiDeal, now: number) => {
	if (!deal.expiresAt) return "No expiry";
	const diff = new Date(deal.expiresAt).getTime() - now;
	if (diff <= 0) return "Expired";
	const totalMins = Math.floor(diff / 60000);
	if (totalMins < 60) return `Ends in ${totalMins}m`;
	const hours = Math.floor(totalMins / 60);
	if (hours < 24) return `Ends in ${hours}h`;
	const days = Math.floor(hours / 24);
	return `Ends in ${days}d`;
};

const CatalogPage = () => {
	const { token } = useAuth();
	const { formatPrice: formatCurrency, settings } = useSiteSettings();
	const queryClient = useQueryClient();

	const [nowTick, setNowTick] = useState(Date.now());
	const [searchText, setSearchText] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

	// Product modal state
	const [isProductModalOpen, setIsProductModalOpen] = useState(false);
	const [productModalMode, setProductModalMode] = useState<ProductModalMode>("create");
	const [editingProductId, setEditingProductId] = useState<number | null>(null);
	const [productTabMode, setProductTabMode] = useState<ProductTabMode>("basic");
	
	// Basic Info
	const [productName, setProductName] = useState("");
	const [productSlug, setProductSlug] = useState("");
	const [productPrice, setProductPrice] = useState("");
	const [productCategoryId, setProductCategoryId] = useState<string>("");
	const [productDescription, setProductDescription] = useState("");
	
	// Media
	const [productImage, setProductImage] = useState("");
	const [imagePreview, setImagePreview] = useState("");
	
	// Attributes
	const [productActive, setProductActive] = useState(true);
	const [productInStock, setProductInStock] = useState(true);
	const [productFeatured, setProductFeatured] = useState(false);
	const [productSpicy, setProductSpicy] = useState(false);
	const [productVegetarian, setProductVegetarian] = useState(false);
	const [productBestSeller, setProductBestSeller] = useState(false);
	
	// Modifiers
	const [productModifiers, setProductModifiers] = useState<ProductModifier[]>([]);
	const [modifierName, setModifierName] = useState("");
	const [modifierPrice, setModifierPrice] = useState("");

	// Category modal state
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [categoryModalMode, setCategoryModalMode] = useState<CategoryModalMode>("create");
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
	const [categoryName, setCategoryName] = useState("");
	const [categorySlug, setCategorySlug] = useState("");
	const [categoryIcon, setCategoryIcon] = useState("sandwich");

	// Deal modal state
	const [isDealModalOpen, setIsDealModalOpen] = useState(false);
	const [dealModalMode, setDealModalMode] = useState<DealModalMode>("create");
	const [editingDealId, setEditingDealId] = useState<number | null>(null);
	const [dealName, setDealName] = useState("");
	const [dealSlug, setDealSlug] = useState("");
	const [dealPrice, setDealPrice] = useState("");
	const [dealDescription, setDealDescription] = useState("");
	const [dealImageUrl, setDealImageUrl] = useState("");
	const [dealIsActive, setDealIsActive] = useState(true);
	const [dealExpiresAt, setDealExpiresAt] = useState("");
	const [dealItems, setDealItems] = useState<Array<{ productId: string; quantity: string }>>([{ productId: "", quantity: "1" }]);

	// Bulk pricing modal state
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
	const [bulkDirection, setBulkDirection] = useState<"INCREASE" | "DECREASE">("INCREASE");
	const [bulkPercentage, setBulkPercentage] = useState("");

	const productsQuery = useQuery({ queryKey: ["admin-products-page"], queryFn: () => getAdminProducts(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const categoriesQuery = useQuery({ queryKey: ["admin-categories-page"], queryFn: () => getAdminCategories(token!), enabled: Boolean(token), refetchInterval: 20000 });
	const dealsQuery = useQuery({ queryKey: ["admin-deals-page"], queryFn: () => getAdminDeals(token!), enabled: Boolean(token), refetchInterval: 20000 });

	useEffect(() => {
		const id = window.setInterval(() => setNowTick(Date.now()), 60000);
		return () => window.clearInterval(id);
	}, []);

	useEffect(() => {
		if (productsQuery.isSuccess || categoriesQuery.isSuccess || dealsQuery.isSuccess) {
			setLastSyncTime(new Date());
		}
	}, [productsQuery.isSuccess, categoriesQuery.isSuccess, dealsQuery.isSuccess]);

	const refreshCatalog = () => {
		void queryClient.invalidateQueries({ queryKey: ["admin-products-page"] });
		void queryClient.invalidateQueries({ queryKey: ["admin-categories-page"] });
		void queryClient.invalidateQueries({ queryKey: ["admin-deals-page"] });
		void queryClient.invalidateQueries({ queryKey: ["admin-overview-dashboard"] });
	};

	const productToggleMutation = useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: { isActive?: boolean; isInStock?: boolean } }) => updateAdminProduct(token!, id, payload),
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: ["admin-products-page"] });
			const previous = queryClient.getQueryData<StoreProduct[]>(["admin-products-page"]);
			queryClient.setQueryData<StoreProduct[]>(["admin-products-page"], (current = []) => current.map((item) => (item.dbId === id ? { ...item, ...payload } : item)));
			return { previous };
		},
		onError: (_error, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["admin-products-page"], context.previous);
			}
			toast.error("Failed to update product");
		},
		onSuccess: () => {
			toast.success("Product updated");
			refreshCatalog();
		},
	});

	const saveProductMutation = useMutation({
		mutationFn: async () => {
			const name = productName.trim();
			const slug = slugify(productSlug.trim() || name);
			const price = Number(productPrice);
			const categoryId = Number(productCategoryId);

			if (!name || !slug) {
				throw new Error("Name and slug are required");
			}
			if (Number.isNaN(price) || price <= 0) {
				throw new Error("Please enter a valid price");
			}
			if (!categoryId || Number.isNaN(categoryId)) {
				throw new Error("Please select a category");
			}

			const payload = {
				name,
				slug,
				price,
				categoryId,
				imageUrl: productImage || undefined,
				description: productDescription.trim() || undefined,
				isActive: productActive,
				isInStock: productInStock,
				isFeatured: productFeatured,
				isSpicy: productSpicy,
				isVegetarian: productVegetarian,
				bestSeller: productBestSeller,
			};

			if (productModalMode === "edit" && editingProductId) {
				return updateAdminProduct(token!, editingProductId, payload);
			}

			const truncatedSlug = slug.slice(0, 30);
			return createAdminProduct(token!, {
				publicId: `prd-${truncatedSlug}-${Date.now().toString().slice(-6)}`,
				...payload,
			});
		},
		onSuccess: () => {
			toast.success(productModalMode === "edit" ? "Product updated" : "Product created");
			setIsProductModalOpen(false);
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save product"),
	});

	const deleteProductMutation = useMutation({
		mutationFn: (id: number) => deleteAdminProduct(token!, id),
		onSuccess: () => {
			toast.success("Product deleted");
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete product"),
	});

	const saveCategoryMutation = useMutation({
		mutationFn: () => {
			const name = categoryName.trim();
			const slug = slugify(categorySlug.trim() || name);
			if (!name || !slug) throw new Error("Category name and slug are required");

			if (categoryModalMode === "edit" && editingCategoryId) {
				return updateAdminCategory(token!, editingCategoryId, { name, slug, icon: categoryIcon });
			}

			return createAdminCategory(token!, { name, slug, icon: categoryIcon });
		},
		onSuccess: () => {
			toast.success(categoryModalMode === "edit" ? "Category updated" : "Category created");
			setIsCategoryModalOpen(false);
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save category"),
	});

	const deleteCategoryMutation = useMutation({
		mutationFn: (id: number) => deleteAdminCategory(token!, id),
		onSuccess: () => {
			toast.success("Category deleted");
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete category"),
	});

	const saveDealMutation = useMutation({
		mutationFn: () => {
			const name = dealName.trim();
			const slug = slugify(dealSlug.trim() || name);
			const price = Number(dealPrice);
			if (!name || !slug || Number.isNaN(price) || price <= 0) {
				throw new Error("Deal name, slug, and valid price are required");
			}

			const items = dealItems
				.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) }))
				.filter((item) => Number.isInteger(item.productId) && item.productId > 0 && Number.isInteger(item.quantity) && item.quantity > 0);

			if (items.length === 0) {
				throw new Error("Add at least one valid deal item");
			}

			const payload = {
				name,
				slug,
				price,
				description: dealDescription.trim() || undefined,
				imageUrl: dealImageUrl.trim() || undefined,
				isActive: dealIsActive,
				expiresAt: dealExpiresAt ? new Date(dealExpiresAt).toISOString() : undefined,
				items,
			};

			if (dealModalMode === "edit" && editingDealId) {
				return updateAdminDeal(token!, editingDealId, payload);
			}

			return createAdminDeal(token!, {
				publicId: `deal-${slug.slice(0, 30)}-${Date.now().toString().slice(-6)}`,
				...payload,
			});
		},
		onSuccess: () => {
			toast.success(dealModalMode === "edit" ? "Deal updated" : "Deal created");
			setIsDealModalOpen(false);
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save deal"),
	});

	const deleteDealMutation = useMutation({
		mutationFn: (id: number) => deleteAdminDeal(token!, id),
		onSuccess: () => {
			toast.success("Deal deleted");
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete deal"),
	});

	const bulkPricingMutation = useMutation({
		mutationFn: () => {
			const categoryId = Number(bulkCategoryId);
			const amount = Number(bulkPercentage);
			if (Number.isNaN(categoryId) || Number.isNaN(amount) || amount <= 0) {
				throw new Error("Category and valid percentage are required");
			}

			return bulkUpdateAdminCategoryPricing(token!, {
				categoryId,
				mode: "PERCENTAGE",
				amount: bulkDirection === "INCREASE" ? amount : -amount,
			});
		},
		onSuccess: () => {
			toast.success("Bulk pricing update applied");
			setIsBulkModalOpen(false);
			refreshCatalog();
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Bulk update failed"),
	});

	const products = productsQuery.data ?? [];
	const categories = categoriesQuery.data ?? [];
	const deals = dealsQuery.data?.deals ?? [];

	const filteredProducts = useMemo(() => {
		const query = searchText.trim().toLowerCase();
		return products.filter((product) => {
			const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.slug.toLowerCase().includes(query);
			const matchesCategory = categoryFilter === "all" || String(product.categoryId) === categoryFilter;
			return matchesSearch && matchesCategory;
		});
	}, [products, searchText, categoryFilter]);

	const openProductModal = (mode: ProductModalMode, product?: StoreProduct) => {
		setProductTabMode("basic");
		setProductModalMode(mode);
		if (mode === "edit" && product) {
			setEditingProductId(product.dbId);
			setProductName(product.name);
			setProductSlug(product.slug);
			setProductPrice(String(product.price));
			setProductCategoryId(String(product.categoryId));
			setProductImage(product.rawImageUrl ?? "");
			setImagePreview(product.image ?? "");
			setProductDescription(product.description || "");
			setProductActive(product.isActive);
			setProductInStock(product.isInStock);
			setProductFeatured(product.isFeatured);
			setProductSpicy(product.isSpicy || false);
			setProductVegetarian(product.isVegetarian || false);
			setProductBestSeller(product.bestSeller || false);
			setProductModifiers([]);
		} else {
			setEditingProductId(null);
			setProductName("");
			setProductSlug("");
			setProductPrice("");
			setProductCategoryId(categories[0] ? String(categories[0].id) : "");
			setProductImage("");
			setImagePreview("");
			setProductDescription("");
			setProductActive(true);
			setProductInStock(true);
			setProductFeatured(false);
			setProductSpicy(false);
			setProductVegetarian(false);
			setProductBestSeller(false);
			setProductModifiers([]);
		}
		setModifierName("");
		setModifierPrice("");
		setIsProductModalOpen(true);
	};

	const openCategoryModal = (mode: CategoryModalMode, category?: ApiCategory) => {
		setCategoryModalMode(mode);
		if (mode === "edit" && category) {
			setEditingCategoryId(category.id);
			setCategoryName(category.name);
			setCategorySlug(category.slug);
			setCategoryIcon(category.icon ?? "sandwich");
		} else {
			setEditingCategoryId(null);
			setCategoryName("");
			setCategorySlug("");
			setCategoryIcon("sandwich");
		}
		setIsCategoryModalOpen(true);
	};

	const openDealModal = (mode: DealModalMode, deal?: ApiDeal) => {
		setDealModalMode(mode);
		if (mode === "edit" && deal) {
			setEditingDealId(deal.id);
			setDealName(deal.name);
			setDealSlug(deal.slug);
			setDealPrice(String(deal.price));
			setDealDescription(deal.description ?? "");
			setDealImageUrl(deal.imageUrl ?? "");
			setDealIsActive(deal.isActive);
			setDealExpiresAt(deal.expiresAt ? new Date(deal.expiresAt).toISOString().slice(0, 16) : "");
			setDealItems(deal.items.length > 0 ? deal.items.map((item) => ({ productId: String(item.productId), quantity: String(item.quantity) })) : [{ productId: "", quantity: "1" }]);
		} else {
			setEditingDealId(null);
			setDealName("");
			setDealSlug("");
			setDealPrice("");
			setDealDescription("");
			setDealImageUrl("");
			setDealIsActive(true);
			setDealExpiresAt("");
			setDealItems([{ productId: "", quantity: "1" }]);
		}
		setIsDealModalOpen(true);
	};

	const handleProductImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			toast.error("Image file is too large. Please select an image under 2MB.");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setProductImage(reader.result);
				setImagePreview(reader.result);
				toast.success("Image selected");
			}
		};
		reader.readAsDataURL(file);
	};

	const handleDealImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			toast.error("Image file is too large. Please select an image under 2MB.");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setDealImageUrl(reader.result);
				toast.success("Deal image selected");
			}
		};
		reader.readAsDataURL(file);
	};

	const updateDealItem = (index: number, key: "productId" | "quantity", value: string) => {
		setDealItems((current) => current.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
	};

	const addDealItem = () => setDealItems((current) => [...current, { productId: "", quantity: "1" }]);
	const removeDealItem = (index: number) => setDealItems((current) => current.filter((_, idx) => idx !== index));

	return (
		<ModuleScaffold title="Catalog Intelligence Center" subtitle="Premium menu engine for operational brilliance." hideHeader>
			<div className="space-y-6 sm:space-y-8">
				{/* Header Bar with Global Search & Last Synced */}
				<div className={headerBarClass}>
					<div className="flex flex-col gap-2">
						<h2 className="text-lg font-semibold text-white">Catalog Management</h2>
						<div className="flex items-center gap-2 text-xs text-zinc-400">
							<Clock size={13} />
							<span>Last synced: {lastSyncTime.toLocaleTimeString()}</span>
						</div>
					</div>
					
					<div className="flex flex-1 flex-col gap-2 sm:max-w-md">
						<div className="relative">
							<Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
							<Input 
								value={searchText} 
								onChange={(event) => setSearchText(event.target.value)} 
								placeholder="Global search..." 
								className="h-9 rounded-[12px] border-white/12 bg-black/30 pl-9 text-sm"
							/>
						</div>
					</div>
				</div>

				{/* Action Hub */}
				<div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
					<Button 
						className="h-11 rounded-[14px] bg-primary px-4 font-bold text-primary-foreground shadow-[0_10px_24px_rgba(242,196,28,0.25)] hover:brightness-105 active:scale-[0.98]" 
						onClick={() => openProductModal("create")}
					>
						<Plus size={16} className="mr-2" /> Add Product
					</Button>
					<Button 
						className="h-11 rounded-[14px] bg-gradient-to-r from-sky-500 to-cyan-500 px-4 text-white shadow-[0_10px_24px_rgba(14,165,233,0.33)] hover:shadow-[0_14px_32px_rgba(14,165,233,0.45)]" 
						onClick={() => openCategoryModal("create")}
					>
						<Tags size={16} className="mr-2" /> Add Category
					</Button>
					<Button 
						className="h-11 rounded-[14px] bg-accent px-4 font-bold text-primary-foreground shadow-[0_10px_24px_rgba(160,208,0,0.25)] hover:brightness-105 active:scale-[0.98]" 
						onClick={() => openDealModal("create")}
					>
						<Zap size={16} className="mr-2" /> Build Deal
					</Button>
					<Button 
						className="h-11 rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500 px-4 text-white shadow-[0_10px_24px_rgba(139,92,246,0.33)] hover:shadow-[0_14px_32px_rgba(139,92,246,0.45)]" 
						onClick={() => setIsBulkModalOpen(true)}
					>
						<TrendingUp size={16} className="mr-2" /> Bulk Pricing
					</Button>
				</div>

				{/* Intel Dashboard - Stats */}
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<div className={panelClass}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-medium">Total Products</p>
								<p className="mt-3 text-3xl font-bold text-white">{products.length}</p>
							</div>
							<TrendingUp size={24} className="text-primary/40" />
						</div>
					</div>
					<div className={panelClass}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-medium">Categories</p>
								<p className="mt-3 text-3xl font-bold text-white">{categories.length}</p>
							</div>
							<Tags size={24} className="text-sky-400/40" />
						</div>
					</div>
					<div className={panelClass}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-medium">Active Deals</p>
								<p className="mt-3 text-3xl font-bold text-white">{deals.filter(d => d.isActive).length}</p>
							</div>
							<Zap size={24} className="text-rose-400/40" />
						</div>
					</div>
					<div className={panelClass}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-medium">Featured Items</p>
								<p className="mt-3 text-3xl font-bold text-white">{products.filter(p => p.isFeatured).length}</p>
							</div>
							<AlertCircle size={24} className="text-violet-400/40" />
						</div>
					</div>
				</div>

				{productsQuery.isLoading || categoriesQuery.isLoading ? (
					<div className={`${panelClass} flex items-center justify-center py-12`}>
						<p className="text-sm text-zinc-400">Syncing catalog from database...</p>
					</div>
				) : null}

				{/* Main Content Grid - Products & Management */}
				<div className="grid gap-5 xl:grid-cols-[2fr_1.2fr]">
					{/* Products Section */}
					<div className={panelClass}>
						<div className="mb-5 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-white">Product Inventory</h3>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="h-9 w-48 rounded-[12px] border-white/12 bg-black/30 text-sm">
									<SelectValue placeholder="Filter..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
							{filteredProducts.length === 0 && !productsQuery.isLoading ? (
								<div className="rounded-[16px] border border-dashed border-primary/30 bg-primary/10 px-6 py-12 text-center">
									<LuImage size={32} className="mx-auto mb-3 text-primary/40" />
									<p className="text-sm font-medium text-zinc-300 mb-1">No products yet</p>
									<p className="text-xs text-zinc-500 mb-4">Start building your menu by adding your first item</p>
									<Button 
										className="rounded-[12px] bg-primary font-bold text-primary-foreground hover:brightness-105" 
										onClick={() => openProductModal("create")}
										size="sm"
									>
										Add First Product
									</Button>
								</div>
							) : (
								filteredProducts.map((product) => (
									<div 
										key={product.dbId} 
										className="group rounded-[14px] border border-white/10 bg-black/20 p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(242,196,28,0.15)]"
									>
										<div className="flex items-start gap-3">
											{/* Product Image */}
											<div className="relative h-14 w-14 flex-shrink-0">
												<img 
													src={product.image} 
													alt={product.name} 
													className="h-full w-full rounded-full border border-white/15 object-cover shadow-md"
												/>
												{product.isFeatured && (
													<div className="absolute -top-1 -right-1 h-5 w-5 rounded-full border border-amber-300 bg-yellow-500/80 flex items-center justify-center">
														<Star size={10} className="text-white fill-white" />
													</div>
												)}
											</div>
											
											{/* Product Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-2 mb-1">
													<div className="flex-1">
														<h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
														<p className="text-xs text-zinc-400 truncate">{product.categoryLabel}</p>
													</div>
													<span className="text-xs font-bold text-primary whitespace-nowrap">{formatCurrency(product.price)}</span>
												</div>
												
												{/* Status Badges */}
												<div className="flex flex-wrap gap-1">
													<button 
														type="button" 
														onClick={() => productToggleMutation.mutate({ id: product.dbId, payload: { isActive: !product.isActive } })} 
														className={cn(
															"rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer",
															product.isActive 
																? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.2)]" 
																: "border-zinc-500/35 bg-zinc-500/12 text-zinc-300"
														)}
													>
														{product.isActive ? <><CircleCheck size={10} className="mr-0.5 inline" />Active</> : <><CircleX size={10} className="mr-0.5 inline" />Inactive</>}
													</button>
													<button 
														type="button" 
														onClick={() => productToggleMutation.mutate({ id: product.dbId, payload: { isInStock: !product.isInStock } })} 
														className={cn(
															"rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer",
															product.isInStock 
																? "border-primary/35 bg-primary/14 text-primary shadow-[0_0_12px_rgba(242,196,28,0.2)]" 
																: "border-rose-300/35 bg-rose-300/14 text-rose-100"
														)}
													>
														{product.isInStock ? <><PackageCheck size={10} className="mr-0.5 inline" />Stock</> : <><PackageX size={10} className="mr-0.5 inline" />Empty</>}
													</button>
													{product.isSpicy && (
														<span className="rounded-full border border-red-300/30 bg-red-300/14 px-2 py-0.5 text-[10px] font-medium text-red-100 inline-flex items-center gap-0.5"><Flame size={10} />Spicy</span>
													)}
													{product.isVegetarian && (
														<span className="rounded-full border border-green-300/30 bg-green-300/14 px-2 py-0.5 text-[10px] font-medium text-green-100 inline-flex items-center gap-0.5"><Leaf size={10} />Veg</span>
													)}
												</div>
											</div>
											
											{/* Actions */}
											<div className="flex gap-1 opacity-70 transition-opacity group-hover:opacity-100">
												<Button 
													variant="outline" 
													className="h-8 rounded-[8px] border-white/15 bg-white/[0.03] px-2.5 hover:bg-white/[0.08]" 
													onClick={() => openProductModal("edit", product)}
												>
													<LuPencil size={13} />
												</Button>
												<Button 
													variant="outline" 
													className="h-8 rounded-[8px] border-rose-300/30 bg-rose-400/10 px-2.5 text-rose-100 hover:bg-rose-400/15" 
													onClick={() => deleteProductMutation.mutate(product.dbId)}
												>
													<LuTrash2 size={13} />
												</Button>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Right Sidebar - Categories & Deals */}
					<div className="space-y-5">
						{/* Categories */}
						<div className={panelClass}>
							<h3 className="mb-4 text-lg font-semibold text-white">Category Hub</h3>
							<div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
								{categories.length === 0 ? (
									<p className="text-xs text-zinc-500 text-center py-4">No categories</p>
								) : (
									categories.map((category) => (
										<div key={category.id} className="flex items-center justify-between rounded-[12px] border border-white/10 bg-black/20 px-3 py-2">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												{(() => { const CatIcon = getCategoryIcon(category.icon); return <CatIcon size={18} className="text-primary" />; })()}
												<div className="min-w-0">
													<p className="font-medium text-sm text-zinc-100 truncate">{category.name}</p>
													<p className="text-xs text-zinc-600">{products.filter(p => p.categoryId === category.id).length} items</p>
												</div>
											</div>
											<div className="flex gap-1 flex-shrink-0">
												<Button 
													variant="outline" 
													className="h-7 rounded-[8px] border-white/15 bg-white/[0.03] px-2" 
													onClick={() => openCategoryModal("edit", category)}
												>
													<LuPencil size={12} />
												</Button>
												<Button 
													variant="outline" 
													className="h-7 rounded-[8px] border-rose-300/30 bg-rose-400/10 px-2 text-rose-100" 
													onClick={() => deleteCategoryMutation.mutate(category.id)}
												>
													<LuTrash2 size={12} />
												</Button>
											</div>
										</div>
									))
								)}
							</div>
						</div>

						{/* Deals */}
						<div className={panelClass}>
							<h3 className="mb-4 text-lg font-semibold text-white">Active Deals</h3>
							<div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
								{deals.length === 0 ? (
									<p className="text-xs text-zinc-500 text-center py-4">No deals yet</p>
								) : (
									deals.map((deal) => (
										<div key={deal.id} className="rounded-[12px] border border-white/10 bg-black/20 px-3 py-2">
											<div className="flex items-start justify-between gap-2 mb-1">
												<div className="flex-1 min-w-0">
													<p className="font-medium text-sm text-zinc-100 truncate">{deal.name}</p>
													<p className="text-xs text-zinc-600">{formatCurrency(deal.price)}</p>
												</div>
												<span className={cn(
													"rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
													deal.isActive 
														? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" 
														: "border-zinc-500/35 bg-zinc-500/12 text-zinc-300"
												)}>
													{deal.isActive ? "Active" : "Off"}
												</span>
											</div>
											<div className="flex items-center justify-between gap-2 text-xs text-zinc-400 mb-2">
												<span>{getDealTimerLabel(deal, nowTick)}</span>
											</div>
											<div className="flex gap-1">
												<Button 
													variant="outline" 
													className="h-6 rounded-[8px] border-white/15 bg-white/[0.03] px-2 text-xs flex-1" 
													onClick={() => openDealModal("edit", deal)}
												>
													<LuPencil size={11} className="mr-1" /> Edit
												</Button>
												<Button 
													variant="outline" 
													className="h-6 rounded-[8px] border-rose-300/30 bg-rose-400/10 px-2 text-rose-100" 
													onClick={() => deleteDealMutation.mutate(deal.id)}
												>
													<LuTrash2 size={11} />
												</Button>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Master Product Modal - Multi-Tab */}
				<Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
					<DialogContent className="max-w-2xl border-white/12 bg-[linear-gradient(180deg,rgba(24,24,29,0.95),rgba(13,13,19,0.97))] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
						<div className="rounded-[24px] border border-white/10 p-6 sm:p-8">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-white">{productModalMode === "edit" ? "Edit Product" : "Create Product"}</DialogTitle>
								<DialogDescription className="text-zinc-400 text-sm">Build your catalog with stunning visuals and rich attributes.</DialogDescription>
							</DialogHeader>
							
							{/* Tab Navigation */}
							<div className="mt-6 flex gap-2 border-b border-white/10 mb-6">
								{(['basic', 'media', 'attributes', 'modifiers'] as const).map((tab) => (
									<button
										key={tab}
										onClick={() => setProductTabMode(tab)}
										className={cn(
											"pb-3 px-4 text-sm font-medium transition-all relative",
											productTabMode === tab
												? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
												: "text-zinc-500 hover:text-zinc-300"
										)}
									>
										{tab === 'basic' && <span className="inline-flex items-center gap-1.5"><FileText size={14} /> Basic</span>}
										{tab === 'media' && <span className="inline-flex items-center gap-1.5"><ImageIcon size={14} /> Media</span>}
										{tab === 'attributes' && <span className="inline-flex items-center gap-1.5"><Settings2 size={14} /> Attributes</span>}
										{tab === 'modifiers' && <span className="inline-flex items-center gap-1.5"><Wrench size={14} /> Modifiers</span>}
									</button>
								))}
							</div>

							{/* Tab Content */}
							<div className="grid gap-4">
								{productTabMode === 'basic' && (
									<>
										<Input 
											value={productName} 
											onChange={(event) => setProductName(event.target.value)} 
											placeholder="Product name" 
											className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
										/>
										<Input 
											value={productSlug} 
											onChange={(event) => setProductSlug(event.target.value)} 
											onBlur={() => !productSlug.trim() && setProductSlug(slugify(productName))} 
											placeholder="product-slug" 
											className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
										/>
										<div className="grid grid-cols-2 gap-3">
											<Input 
												value={productPrice} 
												onChange={(event) => setProductPrice(event.target.value)} 
												placeholder="Price" 
												type="number" 
												min="1" 
												className="h-11 rounded-[12px] border-white/12 bg-black/30"
											/>
											<Select value={productCategoryId} onValueChange={setProductCategoryId}>
												<SelectTrigger className="h-11 rounded-[12px] border-white/12 bg-black/30">
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
												<SelectContent>
													{categories.map((category) => (
														<SelectItem key={category.id} value={String(category.id)}>
															{category.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										{/* Visual Image Upload directly inside Basic tab */}
										<div className="rounded-[14px] border border-white/12 bg-black/40 p-3.5 space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
													<LuImage size={14} className="text-primary" /> Product Visual & Image
												</span>
												{imagePreview && (
													<button
														type="button"
														onClick={() => {
															setProductImage("");
															setImagePreview("");
														}}
														className="text-xs font-medium text-rose-400 hover:text-rose-300 transition"
													>
														Remove
													</button>
												)}
											</div>

											<div className="flex items-center gap-3">
												<div className="relative shrink-0">
													{imagePreview ? (
														<img 
															src={imagePreview} 
															alt="Preview" 
															className="h-20 w-20 rounded-[12px] border border-primary/40 object-cover shadow-md"
														/>
													) : (
														<div className="flex h-20 w-20 items-center justify-center rounded-[12px] border border-dashed border-white/20 bg-white/5 text-white/30">
															<LuImage size={24} />
														</div>
													)}
												</div>

												<div className="flex-1 space-y-2">
													<div className="flex flex-wrap items-center gap-2">
														<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-primary px-3 py-1.5 text-xs font-bold text-[#071F07] shadow transition hover:brightness-105 active:scale-95">
															<LuImage size={14} />
															<span>{imagePreview ? "Change Image" : "Upload Image"}</span>
															<input 
																type="file" 
																accept="image/*" 
																onChange={handleProductImageUpload} 
																className="hidden"
															/>
														</label>
														<span className="text-[11px] text-zinc-400">PNG, JPG up to 2MB</span>
													</div>
													<Input 
														value={productImage} 
														onChange={(event) => {
															setProductImage(event.target.value);
															setImagePreview(event.target.value);
														}} 
														placeholder="Or paste image URL (e.g. /src/assets/chicken.jpg)" 
														className="h-9 rounded-[10px] border-white/10 bg-black/50 text-xs placeholder:text-zinc-600"
													/>
												</div>
											</div>

											<div className="border-t border-white/10 pt-2">
												<p className="mb-1.5 text-[11px] text-zinc-400">Quick Presets:</p>
												<div className="flex flex-wrap gap-1.5">
													{[
														{ label: "🍗 Broaster", url: "/src/assets/chicken.jpg" },
														{ label: "🌯 Shawarma", url: "/src/assets/shawarma.jpg" },
														{ label: "🍔 Burger", url: "/src/assets/burger2.jpg" },
														{ label: "🍕 Pizza", url: "/src/assets/pizza.jpg" },
														{ label: "🍟 Fries", url: "/src/assets/fries.jpg" },
													].map((preset) => (
														<button
															key={preset.url}
															type="button"
															onClick={() => {
																setProductImage(preset.url);
																setImagePreview(preset.url);
															}}
															className="rounded-[6px] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:border-primary/40 hover:bg-primary/10 hover:text-white"
														>
															{preset.label}
														</button>
													))}
												</div>
											</div>
										</div>

										<Textarea 
											value={productDescription} 
											onChange={(event) => setProductDescription(event.target.value)} 
											placeholder="Product description (optional)" 
											className="min-h-[90px] rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600 resize-none"
										/>
									</>
								)}

								{productTabMode === 'media' && (
									<div className="space-y-4">
										<div className="rounded-[14px] border border-dashed border-primary/40 bg-primary/10 p-4">
											<div className="flex flex-col items-center justify-center py-6">
												{imagePreview ? (
													<div className="relative mb-4">
														<img 
															src={imagePreview} 
															alt="preview" 
															className="h-32 w-32 rounded-2xl border-2 border-primary/40 object-cover shadow-lg"
														/>
														<button
															type="button"
															onClick={() => {
																setProductImage("");
																setImagePreview("");
															}}
															className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-rose-500 border border-white/20 flex items-center justify-center text-white font-bold hover:bg-rose-600"
														>
															×
														</button>
													</div>
												) : (
													<LuImage size={40} className="mb-3 text-primary/40" />
												)}
												<label className="cursor-pointer">
													<div className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-xs font-bold text-[#071F07] shadow hover:brightness-105 active:scale-95">
														<LuImage size={14} />
														<span>{imagePreview ? "Replace Image File" : "Upload Image from Device"}</span>
													</div>
													<input 
														type="file" 
														accept="image/*" 
														onChange={handleProductImageUpload} 
														className="hidden"
													/>
												</label>
												<p className="text-xs text-zinc-500 mt-2">JPG, PNG (Max 2MB)</p>
											</div>
										</div>

										<div className="rounded-[12px] border border-white/10 bg-black/30 p-3 space-y-2">
											<span className="text-xs font-medium text-white/70">Or enter an image URL directly:</span>
											<Input 
												value={productImage} 
												onChange={(event) => {
													setProductImage(event.target.value);
													setImagePreview(event.target.value);
												}} 
												placeholder="https://example.com/image.jpg or /src/assets/..." 
												className="h-9 rounded-[8px] border-white/10 bg-black/40 text-xs placeholder:text-zinc-600"
											/>
										</div>

										<div className="rounded-[12px] border border-white/10 bg-black/30 p-3">
											<p className="mb-2 text-xs font-medium text-white/70">Quick Presets:</p>
											<div className="flex flex-wrap gap-2">
												{[
													{ label: "🍗 Broaster Chicken", url: "/src/assets/chicken.jpg" },
													{ label: "🌯 Shawarma Wrap", url: "/src/assets/shawarma.jpg" },
													{ label: "🍔 Juicy Burger", url: "/src/assets/burger2.jpg" },
													{ label: "🍕 Oven Pizza", url: "/src/assets/pizza.jpg" },
													{ label: "🍟 Crispy Fries", url: "/src/assets/fries.jpg" },
												].map((preset) => (
													<button
														key={preset.url}
														type="button"
														onClick={() => {
															setProductImage(preset.url);
															setImagePreview(preset.url);
														}}
														className="rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 transition hover:border-primary/40 hover:bg-primary/10 hover:text-white"
													>
														{preset.label}
													</button>
												))}
											</div>
										</div>
									</div>
								)}

								{productTabMode === 'attributes' && (
									<>
										<div className="grid gap-3 sm:grid-cols-2">
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white">Active</span>
												<Switch checked={productActive} onCheckedChange={setProductActive} />
											</label>
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white">In Stock</span>
												<Switch checked={productInStock} onCheckedChange={setProductInStock} />
											</label>
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white">Featured</span>
												<Switch checked={productFeatured} onCheckedChange={setProductFeatured} />
											</label>
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white">Best Seller</span>
												<Switch checked={productBestSeller} onCheckedChange={setProductBestSeller} />
											</label>
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white inline-flex items-center gap-1.5"><Flame size={14} className="text-red-400" /> Spicy</span>
												<Switch checked={productSpicy} onCheckedChange={setProductSpicy} />
											</label>
											<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
												<span className="text-sm font-medium text-white inline-flex items-center gap-1.5"><Leaf size={14} className="text-green-400" /> Vegetarian</span>
												<Switch checked={productVegetarian} onCheckedChange={setProductVegetarian} />
											</label>
										</div>
									</>
								)}

								{productTabMode === 'modifiers' && (
									<>
										<p className="text-xs text-zinc-400">Add optional extras with pricing (e.g., Extra Cheese +{settings.currencySymbol || "$"}500)</p>
										<div className="grid gap-2 sm:grid-cols-[1fr_100px_40px]">
											<Input 
												value={modifierName} 
												onChange={(event) => setModifierName(event.target.value)} 
												placeholder="Modifier name" 
												className="h-10 rounded-[12px] border-white/12 bg-black/30"
											/>
											<Input 
												value={modifierPrice} 
												onChange={(event) => setModifierPrice(event.target.value)} 
												type="number" 
												placeholder="Price" 
												min="0" 
												className="h-10 rounded-[12px] border-white/12 bg-black/30"
											/>
											<Button
												type="button"
												size="sm"
												onClick={() => {
													if (modifierName.trim() && modifierPrice.trim()) {
														setProductModifiers([
															...productModifiers,
															{ name: modifierName.trim(), price: Number(modifierPrice) }
														]);
														setModifierName("");
														setModifierPrice("");
													}
												}}
												className="h-10 rounded-[10px] bg-primary font-bold text-primary-foreground hover:brightness-105"
											>
												<Plus size={14} />
											</Button>
										</div>

										{productModifiers.length > 0 && (
											<div className="space-y-2 rounded-[12px] border border-white/10 bg-black/20 p-3 max-h-[200px] overflow-y-auto">
												{productModifiers.map((modifier, idx) => (
													<div key={idx} className="flex items-center justify-between rounded-[8px] bg-black/40 px-3 py-2">
														<div>
															<p className="text-sm font-medium text-white">{modifier.name}</p>
															<p className="text-xs text-zinc-500">+{formatCurrency(modifier.price)}</p>
														</div>
														<Button
															variant="outline"
															size="sm"
															onClick={() => setProductModifiers(productModifiers.filter((_, i) => i !== idx))}
															className="h-6 px-2 border-rose-300/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20"
														>
															<LuTrash2 size={12} />
														</Button>
													</div>
												))}
											</div>
										)}
									</>
								)}
							</div>

							<DialogFooter className="mt-7">
								<Button 
									variant="outline" 
									className="rounded-[12px] border-white/12 bg-white/[0.03] hover:bg-white/[0.08]" 
									onClick={() => setIsProductModalOpen(false)}
								>
									Cancel
								</Button>
								<Button 
									className="rounded-[12px] bg-primary font-bold text-primary-foreground shadow-[0_10px_24px_rgba(242,196,28,0.25)] hover:brightness-105" 
									onClick={() => saveProductMutation.mutate()} 
									disabled={saveProductMutation.isPending}
								>
									{productModalMode === "edit" ? "Save Changes" : "Create Product"}
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>

				{/* Category Modal */}
				<Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
					<DialogContent className="max-w-xl border-white/12 bg-[linear-gradient(180deg,rgba(24,24,29,0.95),rgba(13,13,19,0.97))] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
						<div className="rounded-[24px] border border-white/10 p-6 sm:p-8">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-white">{categoryModalMode === "edit" ? "Edit Category" : "Create Category"}</DialogTitle>
								<DialogDescription className="text-zinc-400 text-sm">Organize your menu with intuitive category structures.</DialogDescription>
							</DialogHeader>
							<div className="mt-6 grid gap-4">
								<Input 
									value={categoryName} 
									onChange={(event) => setCategoryName(event.target.value)} 
									placeholder="Category name" 
									className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
								/>
								<Input 
									value={categorySlug} 
									onChange={(event) => setCategorySlug(event.target.value)} 
									onBlur={() => !categorySlug.trim() && setCategorySlug(slugify(categoryName))} 
									placeholder="category-slug" 
									className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
								/>
								<div className="rounded-[12px] border border-white/12 bg-black/30 p-4">
									<p className="mb-3 text-sm font-medium text-white">Select Icon</p>
									<div className="grid grid-cols-5 gap-2">
										{categoryIconOptions.map((opt) => (
											<button 
												key={opt.key} 
												type="button" 
												onClick={() => setCategoryIcon(opt.key)} 
												className={cn(
													"rounded-[10px] border p-3 flex flex-col items-center gap-1 transition-all",
													categoryIcon === opt.key 
														? "border-primary/40 bg-primary/20 shadow-[0_0_12px_rgba(242,196,28,0.3)]" 
														: "border-white/15 bg-white/[0.03] hover:bg-white/[0.08]"
												)}
											>
												<opt.Icon size={20} className={categoryIcon === opt.key ? "text-primary" : "text-zinc-400"} />
												<span className="text-[9px] text-zinc-400">{opt.label}</span>
											</button>
										))}
									</div>
								</div>
							</div>
							<DialogFooter className="mt-7">
								<Button 
									variant="outline" 
									className="rounded-[12px] border-white/12 bg-white/[0.03] hover:bg-white/[0.08]" 
									onClick={() => setIsCategoryModalOpen(false)}
								>
									Cancel
								</Button>
								<Button 
									className="rounded-[12px] bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.33)]" 
									onClick={() => saveCategoryMutation.mutate()} 
									disabled={saveCategoryMutation.isPending}
								>
									{categoryModalMode === "edit" ? "Save Changes" : "Create Category"}
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>

				{/* Deal Modal */}
				<Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
					<DialogContent className="max-w-3xl border-white/12 bg-[linear-gradient(180deg,rgba(24,24,29,0.95),rgba(13,13,19,0.97))] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
						<div className="rounded-[24px] border border-white/10 p-6 sm:p-8">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-white">{dealModalMode === "edit" ? "Edit Deal" : "Build Deal"}</DialogTitle>
								<DialogDescription className="text-zinc-400 text-sm">Create combo offers and time-limited promotions with ease.</DialogDescription>
							</DialogHeader>
							<div className="mt-6 grid gap-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<Input 
										value={dealName} 
										onChange={(event) => setDealName(event.target.value)} 
										placeholder="Deal name" 
										className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
									/>
									<Input 
										value={dealSlug} 
										onChange={(event) => setDealSlug(event.target.value)} 
										onBlur={() => !dealSlug.trim() && setDealSlug(slugify(dealName))} 
										placeholder="deal-slug" 
										className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600"
									/>
								</div>
								<div className="grid gap-3 sm:grid-cols-3">
									<Input 
										value={dealPrice} 
										onChange={(event) => setDealPrice(event.target.value)} 
										placeholder="Price" 
										type="number" 
										min="1" 
										className="h-11 rounded-[12px] border-white/12 bg-black/30"
									/>
									<div className="sm:col-span-2 flex items-center gap-2">
										<Input 
											value={dealImageUrl} 
											onChange={(event) => setDealImageUrl(event.target.value)} 
											placeholder="Deal Image URL (or upload from device)" 
											className="h-11 rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600 flex-1"
										/>
										<label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] bg-primary px-3 text-xs font-bold text-[#071F07] shadow transition hover:brightness-105 active:scale-95">
											<LuImage size={14} />
											<span>Upload</span>
											<input 
												type="file" 
												accept="image/*" 
												onChange={handleDealImageUpload} 
												className="hidden"
											/>
										</label>
									</div>
								</div>
								{dealImageUrl && (
									<div className="relative flex items-center gap-3 rounded-[12px] border border-white/10 bg-black/40 p-2.5">
										<img 
											src={dealImageUrl} 
											alt="Deal Banner Preview" 
											className="h-16 w-28 rounded-[8px] border border-primary/30 object-cover shadow"
										/>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-white truncate">Deal Banner Active</p>
											<p className="text-[11px] text-zinc-400">Will be shown on deal cards</p>
										</div>
										<button
											type="button"
											onClick={() => setDealImageUrl("")}
											className="text-xs font-medium text-rose-400 hover:text-rose-300 px-2 py-1"
										>
											Clear
										</button>
									</div>
								)}
								<Textarea 
									value={dealDescription} 
									onChange={(event) => setDealDescription(event.target.value)} 
									placeholder="Deal description" 
									className="min-h-[100px] rounded-[12px] border-white/12 bg-black/30 placeholder:text-zinc-600 resize-none"
								/>
								<div className="grid gap-3 sm:grid-cols-2">
									<Input 
										value={dealExpiresAt} 
										onChange={(event) => setDealExpiresAt(event.target.value)} 
										type="datetime-local" 
										className="h-11 rounded-[12px] border-white/12 bg-black/30"
									/>
									<label className="flex items-center justify-between rounded-[12px] border border-white/12 bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/40 transition-colors">
										<span className="text-sm font-medium text-white">Active</span>
										<Switch checked={dealIsActive} onCheckedChange={setDealIsActive} />
									</label>
								</div>

								{/* Deal Items Builder */}
								<div className="rounded-[12px] border border-white/12 bg-black/30 p-4">
									<div className="mb-3 flex items-center justify-between">
										<p className="text-sm font-semibold text-white inline-flex items-center gap-1.5"><Package size={14} className="text-primary" /> Combo Items</p>
										<Button 
											variant="outline" 
											size="sm"
											className="h-8 rounded-[10px] border-white/15 bg-white/[0.03] text-xs" 
											onClick={addDealItem}
										>
											<Plus size={12} className="mr-1" /> Add Item
										</Button>
									</div>
									<div className="space-y-2">
										{dealItems.map((item, index) => (
											<div key={`${index}-${item.productId}`} className="grid gap-2 sm:grid-cols-[1fr_80px_40px]">
												<Select value={item.productId} onValueChange={(value) => updateDealItem(index, "productId", value)}>
													<SelectTrigger className="h-10 rounded-[10px] border-white/12 bg-black/40">
														<SelectValue placeholder="Select product" />
													</SelectTrigger>
													<SelectContent>
														{products.map((product) => (
															<SelectItem key={product.dbId} value={String(product.dbId)}>
																{product.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Input 
													value={item.quantity} 
													onChange={(event) => updateDealItem(index, "quantity", event.target.value)} 
													type="number" 
													min="1" 
													className="h-10 rounded-[10px] border-white/12 bg-black/40"
												/>
												<Button 
													variant="outline" 
													size="sm"
													className="h-10 rounded-[10px] border-rose-300/30 bg-rose-400/10 px-2 text-rose-100 hover:bg-rose-400/15" 
													onClick={() => removeDealItem(index)} 
													disabled={dealItems.length <= 1}
												>
													<LuTrash2 size={12} />
												</Button>
											</div>
										))}
									</div>
								</div>
							</div>
							<DialogFooter className="mt-7">
								<Button 
									variant="outline" 
									className="rounded-[12px] border-white/12 bg-white/[0.03] hover:bg-white/[0.08]" 
									onClick={() => setIsDealModalOpen(false)}
								>
									Cancel
								</Button>
								<Button 
									className="rounded-[12px] bg-primary font-bold text-primary-foreground shadow-[0_10px_24px_rgba(242,196,28,0.25)] hover:brightness-105" 
									onClick={() => saveDealMutation.mutate()} 
									disabled={saveDealMutation.isPending}
								>
									{dealModalMode === "edit" ? "Save Changes" : "Create Deal"}
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>

				{/* Bulk Pricing Modal */}
				<Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
					<DialogContent className="max-w-lg border-white/12 bg-[linear-gradient(180deg,rgba(24,24,29,0.95),rgba(13,13,19,0.97))] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
						<div className="rounded-[24px] border border-white/10 p-6 sm:p-8">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-white">Bulk Pricing Engine</DialogTitle>
								<DialogDescription className="text-zinc-400 text-sm">Adjust prices across an entire category in seconds.</DialogDescription>
							</DialogHeader>
							<div className="mt-6 grid gap-4">
								<Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
									<SelectTrigger className="h-11 rounded-[12px] border-white/12 bg-black/30">
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((category) => (
											<SelectItem key={category.id} value={String(category.id)}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className="grid gap-3 sm:grid-cols-2">
									<Select value={bulkDirection} onValueChange={(value) => setBulkDirection(value as "INCREASE" | "DECREASE")}>
										<SelectTrigger className="h-11 rounded-[12px] border-white/12 bg-black/30">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="INCREASE">
												<span className="flex items-center gap-2">
													<TrendingUp size={14} className="text-emerald-400" /> Increase
												</span>
											</SelectItem>
											<SelectItem value="DECREASE">
												<span className="flex items-center gap-2">
													<span className="text-rose-400">↓</span> Decrease
												</span>
											</SelectItem>
										</SelectContent>
									</Select>
									<Input 
										value={bulkPercentage} 
										onChange={(event) => setBulkPercentage(event.target.value)} 
										type="number" 
										min="0.1" 
										step="0.1" 
										placeholder="Percentage %" 
										className="h-11 rounded-[12px] border-white/12 bg-black/30"
									/>
								</div>
								<div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
									<p className="text-sm text-zinc-300">
										{bulkCategoryId && bulkPercentage ? (
											<>
												<span className="font-semibold">Preview:</span> All items in "{categories.find(c => String(c.id) === bulkCategoryId)?.name || 'Category'}" will be <span className={bulkDirection === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'}>{bulkDirection.toLowerCase()}d by {bulkPercentage}%</span>
											</>
										) : (
											<span className="text-zinc-500">Select category and percentage to preview</span>
										)}
									</p>
								</div>
							</div>
							<DialogFooter className="mt-7">
								<Button 
									variant="outline" 
									className="rounded-[12px] border-white/12 bg-white/[0.03] hover:bg-white/[0.08]" 
									onClick={() => setIsBulkModalOpen(false)}
								>
									Cancel
								</Button>
								<Button 
									className="rounded-[12px] bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-[0_10px_24px_rgba(139,92,246,0.33)]" 
									onClick={() => bulkPricingMutation.mutate()} 
									disabled={bulkPricingMutation.isPending}
								>
									Apply Updates
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</ModuleScaffold>
	);
};

export default CatalogPage;
