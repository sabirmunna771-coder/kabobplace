import burger2Img from "@/assets/burger2.jpg";
import chickenImg from "@/assets/chicken.jpg";
import friesImg from "@/assets/fries.jpg";
import noodlesImg from "@/assets/noodles.jpg";
import pizzaImg from "@/assets/pizza.jpg";
import shawarmaImg from "@/assets/shawarma.jpg";
import type { MenuItem } from "@/data/menu";

/**
 * Resolves the API base (always ends with `/api`, or is a relative `"/api"` for same-site proxies).
 * Order: (1) `window.__SNOW_BITES_API_URL__` in index.html — works after deploy without rebuild
 *        (2) `__SNOW_BITES_API_FROM_BUILD` from Vite (reads process.env VITE_API_* on `npm run build` — required for some hosts)
 *        (3) `VITE_API_URL` or `VITE_API_BASE_URL` in import.meta.env
 *        (4) dev: localhost:4000
 *        (5) prod, no config: `"/api"` (same origin; only if the host proxies `/api` to the backend)
 */
function normalizeToApiBase(raw: string): string {
  const base = raw.replace(/\/$/, "");
  if (base.endsWith("/api")) {
    return base;
  }
  return `${base}/api`;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.__SNOW_BITES_API_URL__?.trim()) {
      return normalizeToApiBase(window.__SNOW_BITES_API_URL__.trim());
    }
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
    if (hostname.includes("ngrok") || hostname.includes(".dev")) {
      return `${window.location.protocol}//${hostname}:4000/api`;
    }
    return `${window.location.origin}/api`;
  }

  const v =
    (typeof __SNOW_BITES_API_FROM_BUILD !== "undefined" && __SNOW_BITES_API_FROM_BUILD?.trim()) ||
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim();
  if (v) {
    return normalizeToApiBase(v);
  }

  return "/api";
}

export function getApiOrigin(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("http")) {
    return base.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export const API_BASE_URL = getApiBaseUrl();
export const API_ORIGIN = getApiOrigin();

const fallbackImages: Record<string, string> = {
  broaster: chickenImg,
  burgers: burger2Img,
  pizza: pizzaImg,
  pizzas: pizzaImg,
  "grills-pakistani": chickenImg,
  agregados: friesImg,
  chinese: chickenImg,
  noodles: noodlesImg,
  shawarma: shawarmaImg,
  sides: friesImg,
};

export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "CUSTOMER";
  profilePictureUrl?: string | null;
}

export function getApiAssetUrl(assetPath?: string | null) {
  if (!assetPath) return null;
  if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith("data:")) {
    return assetPath;
  }
  if (assetPath.startsWith("/src/assets/") || assetPath.startsWith("src/assets/")) {
    const filename = assetPath.replace(/^(\/)?src\/assets\//, "");
    if (filename.includes("chicken")) return chickenImg;
    if (filename.includes("burger")) return burger2Img;
    if (filename.includes("fries")) return friesImg;
    if (filename.includes("pizza")) return pizzaImg;
    if (filename.includes("shawarma")) return shawarmaImg;
    if (filename.includes("noodles")) return noodlesImg;
  }

  const origin = getApiOrigin();
  return `${origin}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: ApiUser;
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
}

export interface StoreProduct extends MenuItem {
  dbId: number;
  slug: string;
  categoryId: number;
  categoryLabel: string;
  isFeatured: boolean;
  isActive: boolean;
  isInStock: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  bestSeller: boolean;
  badges: string[];
  modifiers: ApiProductModifier[];
  rawImageUrl: string | null;
}

export interface ApiProductModifier {
  id: number;
  productId: number;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDealItem {
  id: number;
  dealId: number;
  productId: number;
  quantity: number;
  productName: string;
  productPublicId: string;
}

export interface ApiDeal {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  isActive: boolean;
  expiresAt?: string | null;
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
  items: ApiDealItem[];
}

export interface ApiOrderItem {
  id: number;
  productId?: number | null;
  productName: string;
  productPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ApiOrder {
  id: number;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  couponId?: number | null;
  couponCode?: string | null;
  discountLabel?: string | null;
  source?: string;
  orderType?: string;
  tableNumber?: string | null;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: ApiOrderItem[];
  assignedRiderId?: number | null;
  assignedRider?: ApiRider | null;
  statusHistory?: ApiOrderStatusHistory[];
}

export interface ApiRider {
  id: number;
  fullName: string;
  phone: string;
  vehicle?: string | null;
  profileImageUrl?: string | null;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  branchId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRiderSummary {
  summary: {
    totalRiders: number;
    available: number;
    busy: number;
    offline: number;
    completedDeliveries: number;
  };
  topRiders: Array<{
    rider: {
      id: number;
      fullName: string;
      phone: string;
      vehicle?: string | null;
      profileImageUrl?: string | null;
      availability: "AVAILABLE" | "BUSY" | "OFFLINE";
    };
    deliveries: number;
    averageDeliveryMinutes: number;
    completedRevenue: number;
  }>;
}

export type ApiStaffRole = "SUPER_ADMIN" | "BRANCH_MANAGER" | "KITCHEN_STAFF" | "DELIVERY_RIDER";

export interface ApiBranchProfile {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "TEMPORARILY_CLOSED";
  isPrimary: boolean;
  managerStaffId?: number | null;
  manager?: {
    id: number;
    fullName: string;
    role: ApiStaffRole;
    email?: string | null;
    profileImageUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  counts?: {
    riders: number;
    staffMembers: number;
    stocks: number;
  };
}

export type ApiStaffPermissionKey =
  | "MANAGE_BRANCH_PROFILE"
  | "MANAGE_STAFF"
  | "VIEW_BRANCH_ANALYTICS"
  | "MANAGE_BRANCH_INVENTORY"
  | "UPDATE_ORDER_STATUS"
  | "VIEW_RIDER_PERFORMANCE"
  | "MANAGE_MENU"
  | "MANAGE_PROMOTIONS"
  | "VIEW_ACTIVITY_LOGS"
  | "MANAGE_ROLE_PERMISSIONS";

export interface ApiStaffMember {
  id: number;
  userId?: number | null;
  branchId?: number | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
  role: ApiStaffRole;
  permissions: ApiStaffPermissionKey[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: ApiBranchProfile | null;
}

export interface ApiStaffActivityLog {
  id: number;
  branchId?: number | null;
  staffMemberId?: number | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  branch?: {
    id: number;
    name: string;
  } | null;
  staffMember?: {
    id: number;
    fullName: string;
    role: ApiStaffRole;
  } | null;
}

export interface ApiRiderPerformance {
  riderId: number;
  fullName: string;
  phone: string;
  vehicle?: string | null;
  availability: ApiRider["availability"];
  branchId?: number | null;
  completedDeliveries: number;
  averageDeliveryMinutes?: number | null;
  onTimeRate?: number | null;
}

export interface ApiOrderStatusHistory {
  id: number;
  fromStatus?: ApiOrder["status"] | null;
  toStatus: ApiOrder["status"];
  note?: string | null;
  changedById?: number | null;
  changedAt: string;
  changedBy?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

export interface ApiAdminOrderSummary {
  totalOrders: number;
  openOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  unassignedOrders: number;
  urgentOrders: number;
  todayOrders: number;
  revenueTotal: number;
  averageOrderValue: number;
}

export interface ApiKdsOverview {
  summary: {
    queueSize: number;
    preparing: number;
    readyToDispatch: number;
    overdue: number;
    averagePrepMinutes: number;
    maxQueueWaitMinutes: number;
  };
  topItems: Array<{ name: string; quantity: number }>;
}

export type InventoryUnit = "KG" | "LITER" | "PIECE" | "CRATE" | "PACK";

export interface ApiIngredient {
  id: number;
  name: string;
  slug: string;
  unit: InventoryUnit;
  currentQty: number;
  minQty: number;
  isCore: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRecipeLink {
  id: number;
  productId: number;
  productName: string;
  productPublicId: string;
  ingredientId: number;
  ingredientName: string;
  ingredientUnit: InventoryUnit;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVendorSupply {
  id: number;
  ingredientId: number;
  ingredientName: string;
  itemName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVendor {
  id: number;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  supplies: ApiVendorSupply[];
}

export interface ApiRestockLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: InventoryUnit;
  vendorId?: number | null;
  vendorName?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  note?: string | null;
  createdAt: string;
}

export interface ApiWasteLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: InventoryUnit;
  quantity: number;
  reason?: string | null;
  note?: string | null;
  createdAt: string;
}

export type DiscountType = "PERCENTAGE" | "FIXED";
export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";

export interface ApiCoupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  isValidNow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFlashSale {
  id: number;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  loyaltyTag: "New" | "Regular" | "VIP";
  lastOrderAt?: string | null;
  daysInactive?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMarketingNotification {
  id: number;
  title: string;
  message: string;
  kind: "GENERAL" | "DEAL_OF_DAY" | "WE_MISS_YOU" | "URGENT";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReview {
  id: number;
  userId?: number | null;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

export interface ApiHeroBanner {
  id: number;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAnnouncementBar {
  id: number;
  text: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMarketingContent {
  announcement?: ApiAnnouncementBar | null;
  banners: ApiHeroBanner[];
  notifications: ApiMarketingNotification[];
  reviews: ApiReview[];
  flashSale?: ApiFlashSale | null;
}

export type AnalyticsRangePreset = "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "CUSTOM";
export type AnalyticsGranularity = "DAILY" | "WEEKLY" | "MONTHLY";

export interface ApiSalesSummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  estimatedIngredientCost: number;
  netProfit: number;
  averageOrderValue: number;
  cancellationRate: number;
}

export interface ApiSalesSeriesPoint {
  label: string;
  revenue?: number;
  completedOrders?: number;
  receivedOrders?: number;
}

export interface ApiTopProduct {
  productName: string;
  revenue: number;
  quantity: number;
}

export interface ApiPeakHourPoint {
  hour: number;
  count: number;
}

export interface ApiSalesAnalytics {
  filters: {
    range: AnalyticsRangePreset;
    granularity: AnalyticsGranularity;
    from: string;
    to: string;
  };
  summary: ApiSalesSummary;
  revenueSeries: Array<Required<Pick<ApiSalesSeriesPoint, "label" | "revenue" | "completedOrders">>>;
  orderVolumeSeries: Array<Required<Pick<ApiSalesSeriesPoint, "label" | "receivedOrders" | "completedOrders">>>;
  topProducts: ApiTopProduct[];
  peakHours: ApiPeakHourPoint[];
}

interface RawCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
}

interface RawProduct {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  badge?: string | null;
  badges?: string[];
  isFeatured: boolean;
  isActive: boolean;
  isInStock: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  bestSeller: boolean;
  modifiers?: ApiProductModifier[];
  category: RawCategory;
}

interface ApiErrorPayload {
  message?: string;
  errors?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
}

export interface ApiRolePermissionDefinition {
  key: ApiStaffPermissionKey;
  label: string;
}

export interface ApiRolePermissionsResponse {
  permissions: ApiRolePermissionDefinition[];
  rolePermissions: Record<ApiStaffRole, ApiStaffPermissionKey[]>;
  defaults: Record<ApiStaffRole, ApiStaffPermissionKey[]>;
}

export interface ApiBranchInventoryItem {
  id?: number;
  branchId?: number;
  branchName?: string;
  ingredientId: number;
  ingredientName: string;
  ingredientSlug: string;
  unit: InventoryUnit;
  currentQty: number;
  minQty: number;
  updatedAt?: string | null;
}

async function apiRequest<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | T | null;

  if (!response.ok) {
    const err = payload as ApiErrorPayload | null;
    const fieldErrors = err?.errors?.fieldErrors;
    if (fieldErrors) {
      const details = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ");
      throw new Error(details || err?.message || "Request failed.");
    }
    throw new Error(err?.message ?? "Request failed.");
  }

  return payload as T;
}

export async function getAdminRolePermissions(token: string) {
  return apiRequest<ApiRolePermissionsResponse>("/admin/branch-staff/permissions", undefined, token);
}

export async function updateAdminRolePermissions(token: string, role: ApiStaffRole, permissions: ApiStaffPermissionKey[]) {
  return apiRequest<{ role: ApiStaffRole; permissions: ApiStaffPermissionKey[] }>(`/admin/branch-staff/permissions/${role}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  }, token);
}

export async function getAdminBranchInventory(token: string, branchId?: number) {
  const query = branchId ? `?branchId=${branchId}` : "";
  return apiRequest<{ branch?: ApiBranchProfile; inventory: ApiBranchInventoryItem[] }>(`/admin/branch-staff/inventory${query}`, undefined, token);
}

export async function updateAdminBranchInventory(token: string, branchId: number, ingredientId: number, payload: { currentQty: number; minQty?: number }) {
  return apiRequest<{ stock: ApiBranchInventoryItem }>(`/admin/branch-staff/branches/${branchId}/inventory/${ingredientId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

const legacyAssetMap: Record<string, string> = {
  "/src/assets/burger2.jpg": burger2Img,
  "/src/assets/chicken.jpg": chickenImg,
  "/src/assets/fries.jpg": friesImg,
  "/src/assets/noodles.jpg": noodlesImg,
  "/src/assets/pizza.jpg": pizzaImg,
  "/src/assets/shawarma.jpg": shawarmaImg,
};

function resolveProductImage(imageUrl: string | null | undefined, categorySlug: string): string {
  if (imageUrl) {
    const legacy = legacyAssetMap[imageUrl];
    if (legacy) return legacy;
    const resolved = getApiAssetUrl(imageUrl);
    if (resolved) return resolved;
  }
  return fallbackImages[categorySlug] ?? burger2Img;
}

function mapProduct(product: RawProduct): StoreProduct {
  const normalizedBadges = (product.badges?.length ? product.badges : product.badge ? [product.badge] : []).filter(Boolean);
  const resolvedImage = resolveProductImage(product.imageUrl, product.category.slug);

  return {
    id: product.publicId,
    dbId: product.id,
    slug: product.slug,
    categoryId: product.category.id,
    name: product.name,
    price: product.price,
    category: product.category.slug,
    categoryLabel: product.category.name,
    image: resolvedImage,
    rawImageUrl: product.imageUrl ?? null,
    description: product.description ?? undefined,
    badge: normalizedBadges[0] ?? undefined,
    badges: normalizedBadges,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    isInStock: product.isInStock,
    isSpicy: product.isSpicy ?? false,
    isVegetarian: product.isVegetarian ?? false,
    bestSeller: product.bestSeller ?? false,
    modifiers: product.modifiers ?? [],
  };
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(fullName: string, email: string, password: string, phone?: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, phone }),
  });
}

export async function getMe(token: string) {
  return apiRequest<{ user: ApiUser }>("/auth/me", undefined, token);
}

export async function updateMyProfile(token: string, payload: {
  fullName: string;
  email: string;
  phone?: string;
}) {
  return apiRequest<{ message: string; user: ApiUser }>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function uploadMyProfileAvatar(token: string, imageDataUrl: string) {
  return apiRequest<{ message: string; user: ApiUser }>("/auth/profile/avatar", {
    method: "POST",
    body: JSON.stringify({ imageDataUrl }),
  }, token);
}

export async function changeMyPassword(token: string, payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>("/auth/profile/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function getCategories() {
  const data = await apiRequest<{ categories: RawCategory[] }>("/categories");
  return data.categories;
}

export async function getProducts(filters?: { search?: string; category?: string; featured?: boolean }) {
  const params = new URLSearchParams();

  if (filters?.search) params.set("search", filters.search);
  if (filters?.category && filters.category !== "all") params.set("category", filters.category);
  if (filters?.featured) params.set("featured", "true");

  const query = params.toString();
  const data = await apiRequest<{ products: RawProduct[] }>(`/products${query ? `?${query}` : ""}`);
  return data.products.map(mapProduct);
}

export async function createPublicOrder(
  payload: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    deliveryAddress: string;
    notes?: string;
    couponCode?: string;
    orderType?: "DELIVERY" | "PICKUP" | "DINE_IN" | "WALK_IN" | "TAKEAWAY";
    paymentMethod?: "CASH" | "CARD" | "MOBILE_WALLET";
    items: Array<{ publicId: string; quantity: number }>;
  },
  token?: string | null,
) {
  return apiRequest<{ message: string; order: ApiOrder }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token ?? undefined);
}

export async function getPublicSettings() {
  return apiRequest<{ data: AppSettings }>("/settings/public");
}

export async function getPublicBranches() {
  return apiRequest<{ branches: ApiBranchProfile[] }>("/branches/public");
}

export async function getPublicDeals() {
  return apiRequest<{ deals: ApiDeal[] }>("/deals");
}

export async function getPublicMarketingContent() {
  return apiRequest<ApiMarketingContent>("/marketing/content");
}

export async function validatePublicCoupon(payload: { code: string; subtotal: number }) {
  return apiRequest<{ message: string; coupon: ApiCoupon; discountAmount: number; finalTotal: number }>("/marketing/validate-coupon", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitPublicReview(payload: {
  customerName: string;
  customerEmail?: string;
  rating: number;
  comment: string;
}) {
  return apiRequest<{ message: string; review: ApiReview }>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminDashboard(token: string) {
  return apiRequest<{
    stats: {
      productCount: number;
      categoryCount: number;
      totalOrders: number;
      openOrders: number;
      totalRevenue: number;
    };
    recentOrders: ApiOrder[];
  }>("/admin/dashboard", undefined, token);
}

export async function getAdminOrders(token: string) {
  return apiRequest<{ orders: ApiOrder[] }>("/admin/orders", undefined, token);
}

export async function getAdminOrderSummary(
  token: string,
  filters?: { status?: ApiOrder["status"]; search?: string; riderId?: number },
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.riderId) params.set("riderId", String(filters.riderId));
  const query = params.toString();
  return apiRequest<{ summary: ApiAdminOrderSummary }>(`/admin/orders/summary${query ? `?${query}` : ""}`, undefined, token);
}

export async function bulkUpdateAdminOrderStatus(
  token: string,
  payload: { orderIds: number[]; status: ApiOrder["status"] },
) {
  return apiRequest<{ message: string; orders: ApiOrder[] }>("/admin/orders/bulk-status", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function downloadAdminOrdersCsv(
  token: string,
  filters?: { status?: ApiOrder["status"]; search?: string; riderId?: number },
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.riderId) params.set("riderId", String(filters.riderId));

  const response = await fetch(`${getApiBaseUrl()}/admin/orders/export.csv${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to export orders CSV.";
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore parse errors for non-JSON responses
    }
    throw new Error(message);
  }

  return response.blob();
}

export async function getAdminKdsOverview(token: string) {
  return apiRequest<ApiKdsOverview>("/admin/kds/overview", undefined, token);
}

export async function bulkAdvanceAdminKdsOrders(
  token: string,
  payload: { orderIds: number[]; note?: string },
) {
  return apiRequest<{ message: string; updatedCount: number; skippedCount: number; orders: ApiOrder[] }>("/admin/kds/bulk-advance", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminOrderDetails(token: string, id: number) {
  return apiRequest<{ order: ApiOrder }>(`/admin/orders/${id}/details`, undefined, token);
}

export async function updateAdminOrderStatus(token: string, id: number, status: ApiOrder["status"]) {
  return apiRequest<{ message: string; order: ApiOrder }>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);
}

export async function assignRiderToAdminOrder(token: string, id: number, riderId: number | null) {
  return apiRequest<{ message: string; order: ApiOrder }>(`/admin/orders/${id}/assign-rider`, {
    method: "PATCH",
    body: JSON.stringify({ riderId }),
  }, token);
}

export async function createAdminOrder(token: string, payload: {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  items: Array<{ publicId: string; quantity: number }>;
}) {
  return apiRequest<{ message: string; order: ApiOrder }>("/admin/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminProducts(token: string) {
  const data = await apiRequest<{ products: RawProduct[] }>("/admin/products", undefined, token);
  return data.products.map(mapProduct);
}

export async function createAdminProduct(token: string, payload: {
  publicId: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  badge?: string;
  badges?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  isInStock?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  bestSeller?: boolean;
  categoryId: number;
}) {
  return apiRequest<{ message: string; product: RawProduct }>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminProduct(token: string, id: number, payload: Partial<{
  publicId: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  badge?: string;
  badges: string[];
  isFeatured: boolean;
  isActive: boolean;
  isInStock: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  bestSeller: boolean;
  categoryId: number;
}>) {
  return apiRequest<{ message: string; product: RawProduct }>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminProduct(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  }, token);
}

export async function createAdminProductModifier(token: string, payload: {
  productId: number;
  name: string;
  price: number;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; modifier: ApiProductModifier }>("/admin/products/modifiers", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminProductModifier(token: string, id: number, payload: Partial<{
  productId: number;
  name: string;
  price: number;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; modifier: ApiProductModifier }>(`/admin/products/modifiers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminProductModifier(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/products/modifiers/${id}`, {
    method: "DELETE",
  }, token);
}

export async function bulkUpdateAdminCategoryPricing(token: string, payload: {
  categoryId: number;
  mode: "PERCENTAGE" | "FLAT";
  amount: number;
}) {
  return apiRequest<{ message: string; updatedCount: number }>("/admin/products/bulk-price", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminCategories(token: string) {
  const data = await apiRequest<{ categories: RawCategory[] }>("/admin/categories", undefined, token);
  return data.categories;
}

export async function createAdminCategory(token: string, payload: { name: string; slug: string; icon?: string }) {
  return apiRequest<{ message: string }>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminCategory(token: string, id: number, payload: Partial<{ name: string; slug: string; icon?: string }>) {
  return apiRequest<{ message: string }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminCategory(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/categories/${id}`, {
    method: "DELETE",
  }, token);
}

export async function getAdminRiders(token: string) {
  return apiRequest<{ riders: ApiRider[] }>("/admin/riders", undefined, token);
}

export async function getAdminBranches(token: string) {
  return apiRequest<{ branches: ApiBranchProfile[] }>("/admin/branch-staff/branches", undefined, token);
}

export async function createAdminBranch(token: string, payload: {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  managerStaffId?: number | null;
  status?: "ACTIVE" | "TEMPORARILY_CLOSED";
  isPrimary?: boolean;
}) {
  return apiRequest<{ branch: ApiBranchProfile }>("/admin/branch-staff/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminBranch(token: string, id: number, payload: Partial<{
  code: string;
  name: string;
  address?: string;
  phone?: string;
  managerStaffId?: number | null;
  status: "ACTIVE" | "TEMPORARILY_CLOSED";
  isPrimary: boolean;
}>) {
  return apiRequest<{ branch: ApiBranchProfile }>(`/admin/branch-staff/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminBranch(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/branch-staff/branches/${id}`, {
    method: "DELETE",
  }, token);
}

export async function updateAdminBranchStatus(token: string, id: number, status: "ACTIVE" | "TEMPORARILY_CLOSED") {
  return apiRequest<{ branch: ApiBranchProfile }>(`/admin/branch-staff/branches/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);
}

export async function getAdminStaffMembers(token: string, filters?: {
  branchId?: number;
  role?: ApiStaffRole;
  isActive?: boolean;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set("branchId", String(filters.branchId));
  if (filters?.role) params.set("role", filters.role);
  if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));
  if (filters?.search) params.set("search", filters.search);
  const query = params.toString();
  return apiRequest<{ staffMembers: ApiStaffMember[] }>(`/admin/branch-staff/staff${query ? `?${query}` : ""}`, undefined, token);
}

export async function createAdminStaffMember(token: string, payload: {
  userId?: number | null;
  branchId?: number | null;
  fullName: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  role: ApiStaffRole;
  permissions?: string[];
  isActive?: boolean;
}) {
  return apiRequest<{ staffMember: ApiStaffMember }>("/admin/branch-staff/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminStaffMember(token: string, id: number, payload: Partial<{
  userId?: number | null;
  branchId?: number | null;
  fullName: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  role: ApiStaffRole;
  permissions: string[];
  isActive: boolean;
}>) {
  return apiRequest<{ staffMember: ApiStaffMember }>(`/admin/branch-staff/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminStaffMember(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/branch-staff/staff/${id}`, {
    method: "DELETE",
  }, token);
}

export async function updateAdminStaffMemberActiveStatus(token: string, id: number, isActive: boolean) {
  return apiRequest<{ staffMember: ApiStaffMember }>(`/admin/branch-staff/staff/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  }, token);
}

export async function getAdminStaffActivityLogs(token: string, filters?: {
  branchId?: number;
  staffMemberId?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set("branchId", String(filters.branchId));
  if (filters?.staffMemberId) params.set("staffMemberId", String(filters.staffMemberId));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRequest<{ logs: ApiStaffActivityLog[] }>(`/admin/branch-staff/activity-logs${query ? `?${query}` : ""}`, undefined, token);
}

export async function getAdminRiderPerformance(token: string, filters?: { branchId?: number; days?: number }) {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set("branchId", String(filters.branchId));
  if (filters?.days) params.set("days", String(filters.days));
  const query = params.toString();
  return apiRequest<{ performance: ApiRiderPerformance[] }>(`/admin/branch-staff/rider-performance${query ? `?${query}` : ""}`, undefined, token);
}

export async function getAdminRidersSummary(token: string) {
  return apiRequest<ApiRiderSummary>("/admin/riders/summary", undefined, token);
}

export async function createAdminRider(token: string, payload: { fullName: string; phone: string; vehicle?: string; branchId?: number | null; profileImageUrl?: string }) {
  return apiRequest<{ message: string; rider: ApiRider }>("/admin/riders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminRider(token: string, id: number, payload: Partial<{ fullName: string; phone: string; vehicle?: string; branchId?: number | null; profileImageUrl?: string }>) {
  return apiRequest<{ message: string; rider: ApiRider }>(`/admin/riders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminRider(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/riders/${id}`, {
    method: "DELETE",
  }, token);
}

export async function updateAdminRiderAvailability(token: string, id: number, availability: ApiRider["availability"]) {
  return apiRequest<{ message: string; rider: ApiRider }>(`/admin/riders/${id}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ availability }),
  }, token);
}

export async function getAdminDeals(token: string) {
  return apiRequest<{ deals: ApiDeal[] }>("/admin/deals", undefined, token);
}

export async function createAdminDeal(token: string, payload: {
  publicId: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isActive?: boolean;
  expiresAt?: string;
  items: Array<{ productId: number; quantity: number }>;
}) {
  return apiRequest<{ message: string; deal: ApiDeal }>("/admin/deals", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminDeal(token: string, id: number, payload: Partial<{
  publicId: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isActive: boolean;
  expiresAt?: string;
  items: Array<{ productId: number; quantity: number }>;
}>) {
  return apiRequest<{ message: string; deal: ApiDeal }>(`/admin/deals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminDeal(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/deals/${id}`, {
    method: "DELETE",
  }, token);
}

export async function getAdminInventoryIngredients(token: string) {
  return apiRequest<{ ingredients: ApiIngredient[] }>("/admin/inventory/ingredients", undefined, token);
}

export async function createAdminInventoryIngredient(token: string, payload: {
  name: string;
  slug: string;
  unit: InventoryUnit;
  currentQty: number;
  minQty: number;
  isCore?: boolean;
}) {
  return apiRequest<{ message: string; ingredient: ApiIngredient }>("/admin/inventory/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminInventoryIngredient(token: string, id: number, payload: Partial<{
  name: string;
  slug: string;
  unit: InventoryUnit;
  currentQty: number;
  minQty: number;
  isCore: boolean;
}>) {
  return apiRequest<{ message: string; ingredient: ApiIngredient }>(`/admin/inventory/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function quickAddAdminInventoryStock(token: string, id: number, payload: {
  quantity: number;
  unitCost: number;
  vendorId?: number;
  note?: string;
}) {
  return apiRequest<{ message: string; ingredient: ApiIngredient }>(`/admin/inventory/ingredients/${id}/quick-add`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function createAdminInventoryWasteLog(token: string, id: number, payload: {
  quantity: number;
  reason?: string;
  note?: string;
}) {
  return apiRequest<{ message: string; ingredient: ApiIngredient }>(`/admin/inventory/ingredients/${id}/waste`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminInventoryRecipeLinks(token: string) {
  return apiRequest<{ recipeLinks: ApiRecipeLink[] }>("/admin/inventory/recipes", undefined, token);
}

export async function upsertAdminInventoryRecipeLink(token: string, payload: {
  productId: number;
  ingredientId: number;
  quantity: number;
}) {
  return apiRequest<{ message: string; recipeLink: ApiRecipeLink }>("/admin/inventory/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminInventoryRecipeLink(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/inventory/recipes/${id}`, {
    method: "DELETE",
  }, token);
}

export async function getAdminInventoryVendors(token: string) {
  return apiRequest<{ vendors: ApiVendor[] }>("/admin/inventory/vendors", undefined, token);
}

export async function createAdminInventoryVendor(token: string, payload: {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  return apiRequest<{ message: string; vendor: ApiVendor }>("/admin/inventory/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminInventoryVendor(token: string, id: number, payload: Partial<{
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
}>) {
  return apiRequest<{ message: string; vendor: ApiVendor }>(`/admin/inventory/vendors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function addAdminInventoryVendorSupply(token: string, vendorId: number, payload: {
  ingredientId: number;
  itemName?: string;
}) {
  return apiRequest<{ message: string; supply: ApiVendorSupply }>(`/admin/inventory/vendors/${vendorId}/supplies`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminInventoryVendorSupply(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/inventory/vendor-supplies/${id}`, {
    method: "DELETE",
  }, token);
}

export async function getAdminInventoryRestockLogs(token: string) {
  return apiRequest<{ restockLogs: ApiRestockLog[] }>("/admin/inventory/restock-logs", undefined, token);
}

export async function getAdminInventoryWasteLogs(token: string) {
  return apiRequest<{ wasteLogs: ApiWasteLog[] }>("/admin/inventory/waste-logs", undefined, token);
}

export async function getAdminSalesAnalytics(token: string, filters?: {
  range?: AnalyticsRangePreset;
  granularity?: AnalyticsGranularity;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.range) params.set("range", filters.range);
  if (filters?.granularity) params.set("granularity", filters.granularity);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const query = params.toString();
  return apiRequest<ApiSalesAnalytics>(`/admin/analytics/sales${query ? `?${query}` : ""}`, undefined, token);
}

export async function getAdminMarketingCustomers(token: string) {
  return apiRequest<{ customers: ApiCustomerProfile[] }>("/admin/marketing/customers", undefined, token);
}

export async function getAdminCoupons(token: string) {
  return apiRequest<{ coupons: ApiCoupon[] }>("/admin/marketing/coupons", undefined, token);
}

export async function createAdminCoupon(token: string, payload: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  expiresAt?: string;
  usageLimit?: number;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; coupon: ApiCoupon }>("/admin/marketing/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminCoupon(token: string, id: number, payload: Partial<{
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  expiresAt?: string;
  usageLimit?: number;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; coupon: ApiCoupon }>(`/admin/marketing/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminFlashSales(token: string) {
  return apiRequest<{ flashSales: ApiFlashSale[] }>("/admin/marketing/flash-sales", undefined, token);
}

export async function createAdminFlashSale(token: string, payload: {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; flashSale: ApiFlashSale }>("/admin/marketing/flash-sales", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminFlashSale(token: string, id: number, payload: Partial<{
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; flashSale: ApiFlashSale }>(`/admin/marketing/flash-sales/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminMarketingNotifications(token: string) {
  return apiRequest<{ notifications: ApiMarketingNotification[] }>("/admin/marketing/notifications", undefined, token);
}

export async function createAdminMarketingNotification(token: string, payload: {
  title: string;
  message: string;
  kind: ApiMarketingNotification["kind"];
  ctaLabel?: string;
  ctaHref?: string;
  expiresAt?: string;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; notification: ApiMarketingNotification }>("/admin/marketing/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminMarketingNotification(token: string, id: number, payload: Partial<{
  title: string;
  message: string;
  kind: ApiMarketingNotification["kind"];
  ctaLabel?: string;
  ctaHref?: string;
  expiresAt?: string;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; notification: ApiMarketingNotification }>(`/admin/marketing/notifications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminMarketingReviews(token: string) {
  return apiRequest<{ reviews: ApiReview[] }>("/admin/marketing/reviews", undefined, token);
}

export async function updateAdminMarketingReviewStatus(token: string, id: number, status: ReviewStatus) {
  return apiRequest<{ message: string; review: ApiReview }>(`/admin/marketing/reviews/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);
}

export async function getAdminHeroBanners(token: string) {
  return apiRequest<{ banners: ApiHeroBanner[] }>("/admin/marketing/banners", undefined, token);
}

export async function createAdminHeroBanner(token: string, payload: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; banner: ApiHeroBanner }>("/admin/marketing/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminHeroBanner(token: string, id: number, payload: Partial<{
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder: number;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; banner: ApiHeroBanner }>(`/admin/marketing/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminAnnouncements(token: string) {
  return apiRequest<{ announcements: ApiAnnouncementBar[] }>("/admin/marketing/announcements", undefined, token);
}

export async function createAdminAnnouncement(token: string, payload: {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive?: boolean;
}) {
  return apiRequest<{ message: string; announcement: ApiAnnouncementBar }>("/admin/marketing/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminAnnouncement(token: string, id: number, payload: Partial<{
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive: boolean;
}>) {
  return apiRequest<{ message: string; announcement: ApiAnnouncementBar }>(`/admin/marketing/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminCoupon(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/marketing/coupons/${id}`, { method: "DELETE" }, token);
}

export async function deleteAdminMarketingNotification(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/marketing/notifications/${id}`, { method: "DELETE" }, token);
}

export async function deleteAdminHeroBanner(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/marketing/banners/${id}`, { method: "DELETE" }, token);
}

export async function deleteAdminAnnouncement(token: string, id: number) {
  return apiRequest<{ message: string }>(`/admin/marketing/announcements/${id}`, { method: "DELETE" }, token);
}

export const orderStatuses: ApiOrder["status"][] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

export interface AppSettings {
  id: number;
  // Store Operations & Timing
  storeStatus: "OPEN" | "CLOSED";
  businessHours?: Record<string, { open: string; close: string }>;
  enableAutoShutdown: boolean;
  maintenanceMode: boolean;

  // Financial & Tax Settings
  taxPercentage: number;
  deliveryChargeType: "FLAT" | "DISTANCE_BASED";
  deliveryFlatFee: number;
  deliveryPerKmCharge: number;
  currencySymbol: string;
  decimalRounding: number;

  // Payment & Integration
  paymentMethods: string[];
  mapApiKey: string;
  smsGatewayApiKey: string;
  paymentGatewayApiKey: string;

  // Branding & General Settings
  siteName: string;
  siteTitle: string;
  siteLogo?: string;
  siteFavicon?: string;
  sitePhone?: string;
  siteEmail?: string;
  siteAddress?: string;
  contactHours?: string;
  mapEmbedUrl?: string;
  footerTagline?: string;

  // SEO Meta Tags
  seoMetaTitle?: string;
  seoMetaDescription?: string;

  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;

  // Localization
  defaultLanguage?: "es" | "en" | "arn" | "ay";
  enabledLanguages?: Array<"es" | "en" | "arn" | "ay">;

  // Theme & Appearance Configuration
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: "inter" | "outfit" | "dm-sans" | "playfair" | "syne";
    borderRadius?: number;
    glassmorphIntensity?: number;
  };

  // Logo Suite (Multiple logos for different contexts)
  logoSuite?: {
    headerLogo?: string;
    footerLogo?: string;
    sidebarLogo?: string;
  };

  // Homepage CMS Configuration
  homepageCms?: {
    heroBanners?: Array<{
      id?: string;
      title: string;
      subtitle?: string;
      imageUrl: string;
      ctaLabel?: string;
      ctaHref?: string;
      isActive?: boolean;
      sortOrder?: number;
    }>;
    heroBadgeText?: string;
    heroStats?: Array<{ num: string; label: string }>;
    marqueeItems?: string[];
    enabledSections?: {
      hero?: boolean;
      marquee?: boolean;
      featured?: boolean;
      menu?: boolean;
      shop?: boolean;
      specialOffers?: boolean;
      testimonials?: boolean;
      contact?: boolean;
      newsletter?: boolean;
    };
  };

  // Global UI Preferences
  uiPreferences?: {
    defaultBorderRadius?: number;
    glassmorphOpacity?: number;
    animationEnabled?: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

export async function getAdminSettings(token: string) {
  return apiRequest<{ data: AppSettings }>("/admin/settings", undefined, token);
}

export async function updateAdminSettings(token: string, payload: Partial<AppSettings>) {
  return apiRequest<{ message: string; data: AppSettings }>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

/* ── POS ─────────────────────────────────────────────────────── */

export interface PosOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: "DINE_IN" | "WALK_IN" | "TAKEAWAY";
  tableNumber?: string;
  paymentMethod: "CASH" | "CARD" | "MOBILE_WALLET";
  notes?: string;
  couponCode?: string;
  items: Array<{ publicId: string; quantity: number }>;
}

export interface PosSummary {
  totalOrders: number;
  totalRevenue: number;
  dineIn: number;
  walkIn: number;
  takeaway: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export async function createPosOrder(token: string, payload: PosOrderPayload) {
  return apiRequest<{ message: string; order: ApiOrder }>("/admin/pos/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getPosOrders(token: string) {
  return apiRequest<{ orders: ApiOrder[]; summary: PosSummary }>("/admin/pos/orders", undefined, token);
}

/* ── CUSTOMER DASHBOARD ─────────────────────────────────── */

export interface CustomerAddress {
  id: number;
  userId: number;
  label: string; // "Home", "Office", "Hostel", etc.
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder extends ApiOrder {
  statusHistory?: ApiOrderStatusHistory[];
}

export interface DashboardStats {
  fullName: string;
  email: string;
  phone?: string;
  snowPoints: number;
  totalOrders: number;
  totalSpent: number;
}

export interface ReorderPayload {
  orderNumber: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

/* Customer Dashboard API Functions */
export async function getDashboardStats(token: string) {
  return apiRequest<{ data: DashboardStats }>("/customer/dashboard/stats", undefined, token);
}

export async function getCustomerOrders(token: string) {
  return apiRequest<{ data: CustomerOrder[] }>("/customer/orders", undefined, token);
}

export async function getOrderDetails(token: string, orderId: number) {
  return apiRequest<{ data: CustomerOrder }>(`/customer/orders/${orderId}`, undefined, token);
}

export async function getCurrentOrder(token: string) {
  return apiRequest<{ data: CustomerOrder | null }>("/customer/orders/current", undefined, token);
}

export async function getCustomerAddresses(token: string) {
  return apiRequest<{ data: CustomerAddress[] }>("/customer/addresses", undefined, token);
}

export async function createAddress(token: string, payload: Omit<CustomerAddress, "id" | "userId" | "createdAt" | "updatedAt">) {
  return apiRequest<{ message: string; data: CustomerAddress }>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAddress(token: string, addressId: number, payload: Partial<Omit<CustomerAddress, "id" | "userId" | "createdAt" | "updatedAt">>) {
  return apiRequest<{ message: string; data: CustomerAddress }>(`/customer/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAddress(token: string, addressId: number) {
  return apiRequest<{ message: string }>(`/customer/addresses/${addressId}`, {
    method: "DELETE",
  }, token);
}

export async function reorderFromOrder(token: string, orderId: number) {
  return apiRequest<{ data: ReorderPayload }>(`/customer/orders/${orderId}/reorder`, {
    method: "POST",
  }, token);
}