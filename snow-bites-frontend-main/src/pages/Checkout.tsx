import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  createPublicOrder,
  validatePublicCoupon,
  getPublicMarketingContent,
  getPublicBranches,
  type DiscountType,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import {
  MapPin,
  Phone,
  CreditCard,
  Info,
  ShoppingBag,
  Truck,
  Store,
  User,
  FileText,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  BadgePercent,
  Loader2,
  ChevronLeft,
  ArrowRight,
  Banknote,
  Wallet,
  AlertTriangle,
} from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, totalItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const { settings, formatPrice } = useSiteSettings();
  const [cartOpen, setCartOpen] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [branchId, setBranchId] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");

  // Payment methods enabled via Admin Settings
  const enabledPaymentMethods = useMemo<Array<"CASH" | "CARD" | "MOBILE_WALLET">>(() => {
    const raw = Array.isArray(settings.paymentMethods) ? settings.paymentMethods : ["CASH"];
    const valid = raw.filter(
      (method): method is "CASH" | "CARD" | "MOBILE_WALLET" =>
        method === "CASH" || method === "CARD" || method === "MOBILE_WALLET",
    );
    return valid.length > 0 ? valid : ["CASH"];
  }, [settings.paymentMethods]);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_WALLET">("CASH");

  useEffect(() => {
    if (!enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0]);
    }
  }, [enabledPaymentMethods, paymentMethod]);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const marketingQuery = useQuery({
    queryKey: ["public-marketing-content"],
    queryFn: getPublicMarketingContent,
  });

  const branchesQuery = useQuery({
    queryKey: ["public-branches"],
    queryFn: getPublicBranches,
  });

  const branches = useMemo(() => {
    const apiBranches = (branchesQuery.data?.branches ?? []).filter((b) => b.status === "ACTIVE");
    if (apiBranches.length > 0) {
      return apiBranches.map((b) => ({
        id: String(b.id),
        name: b.name,
        address: b.address || settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique",
      }));
    }
    return [
      {
        id: "iquique-main",
        name: `${settings.siteName || "Kabob Places"} — Iquique`,
        address: settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique",
      },
    ];
  }, [branchesQuery.data, settings.siteName, settings.siteAddress]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? branches[0],
    [branches, branchId],
  );

  const flashSale = marketingQuery.data?.flashSale;

  const calculateDiscount = (discountType: DiscountType, discountValue: number, baseAmount: number) => {
    const discount = discountType === "PERCENTAGE" ? (baseAmount * discountValue) / 100 : discountValue;
    return Math.max(0, Math.min(baseAmount, Number(discount.toFixed(2))));
  };

  const taxRatePercent = Number(settings.taxPercentage ?? 19);
  const deliveryFeeAmount =
    settings.deliveryChargeType === "FLAT"
      ? Number(settings.deliveryFlatFee ?? 2000)
      : Number(settings.deliveryPerKmCharge ?? 500);

  const flashSaleDiscount = flashSale?.isLive ? calculateDiscount(flashSale.discountType, flashSale.discountValue, subtotal) : 0;
  const gst = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
  const deliveryCharge = orderType === "delivery" ? deliveryFeeAmount : 0;
  const grandTotal = Math.max(0, Number((subtotal + gst + deliveryCharge - couponDiscount - flashSaleDiscount).toFixed(2)));
  const storeClosed = settings.storeStatus === "CLOSED";

  useEffect(() => {
    setCustomerName(user?.fullName ?? "");
    setCustomerPhone(user?.phone ?? "");
  }, [user]);

  useEffect(() => {
    setCouponDiscount(0);
    setAppliedCouponCode("");
  }, [subtotal]);

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate("/", { replace: true });
    }
  }, [items.length, submitting, navigate]);

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = "Full name is required";
    if (!customerPhone.trim()) e.customerPhone = "Phone number is required";
    else if (customerPhone.trim().length < 7) e.customerPhone = "Enter a valid phone number";
    if (orderType === "delivery" && !deliveryAddress.trim()) e.deliveryAddress = "Delivery address is required";
    return e;
  }, [customerName, customerPhone, deliveryAddress, orderType]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setError("");
    try {
      const response = await validatePublicCoupon({ code: couponCode.trim().toUpperCase(), subtotal });
      setCouponDiscount(response.discountAmount);
      setAppliedCouponCode(response.coupon.code);
    } catch (couponError) {
      setCouponDiscount(0);
      setAppliedCouponCode("");
      setError(couponError instanceof Error ? couponError.message : "Coupon validation failed.");
    } finally {
      setValidatingCoupon(false);
    }
  }, [couponCode, subtotal]);

  const handlePlaceOrder = useCallback(async () => {
    setTouched({ customerName: true, customerPhone: true, deliveryAddress: true });
    if (!isFormValid || items.length === 0 || submitting || storeClosed) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await createPublicOrder(
        {
          customerName: customerName.trim(),
          customerEmail: user?.email || undefined,
          customerPhone: customerPhone.trim(),
          deliveryAddress:
            orderType === "delivery"
              ? deliveryAddress.trim()
              : `${t("checkout.pickup")} — ${selectedBranch?.name ?? settings.siteName}`,
          notes: specialInstructions.trim() || undefined,
          couponCode: appliedCouponCode || undefined,
          orderType: orderType === "delivery" ? "DELIVERY" : "TAKEAWAY",
          paymentMethod,
          items: items.map((item) => ({ publicId: item.id, quantity: item.quantity })),
        },
        token,
      );
      clearCart();
      requestAnimationFrame(() => {
        navigate("/order-success", { replace: true, state: { orderNumber: res.order.orderNumber, total: res.order.total } });
      });
    } catch (submitError) {
      setSubmitting(false);
      setError(submitError instanceof Error ? submitError.message : "Order submission failed.");
    }
  }, [
    isFormValid,
    items,
    submitting,
    storeClosed,
    customerName,
    user?.email,
    customerPhone,
    orderType,
    deliveryAddress,
    selectedBranch,
    settings.siteName,
    specialInstructions,
    appliedCouponCode,
    paymentMethod,
    token,
    t,
    clearCart,
    navigate,
  ]);

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />

      <main className="min-h-screen bg-bg pt-20 pb-32 md:pb-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-16">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-txt-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-txt-3 hover:text-primary transition-colors">
              <ChevronLeft size={14} /> {t("checkout.back")}
            </Link>
            <span className="text-txt-4">/</span>
            <span className="text-foreground font-medium">Checkout</span>
          </div>

          {/* Page Title */}
          <div className="mb-10">
            <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3 inline-flex items-center gap-3">
              <span className="w-5 h-px bg-primary" />
              {t("checkout.eyebrow")}
              <span className="w-5 h-px bg-primary" />
            </div>
            <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-[-1px]">
              {t("checkout.title")} <span className="text-primary">{t("checkout.titleHighlight")}</span>
            </h1>
          </div>

          {storeClosed ? (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <AlertTriangle size={18} className="text-amber-300 flex-shrink-0" />
              <span>{t("store.closedBanner")}</span>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            {/* ─── LEFT COLUMN ─── */}
            <div className="space-y-6">
              {/* Order Type Toggle */}
              <section className="rounded-2xl border border-border bg-bg-3 p-5 md:p-7">
                <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 mb-5 flex items-center gap-2">
                  <Truck size={16} className="text-primary" /> {t("checkout.orderType")}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType("delivery")}
                    className={`relative rounded-xl border p-4 text-center transition-all ${
                      orderType === "delivery"
                        ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_24px_hsl(var(--glow3))]"
                        : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                    }`}
                  >
                    <Truck size={22} className={`mx-auto mb-2 ${orderType === "delivery" ? "text-primary" : "text-txt-3"}`} />
                    <span className={`font-semibold text-sm ${orderType === "delivery" ? "text-foreground" : "text-txt-2"}`}>{t("checkout.delivery")}</span>
                    <p className="text-[.68rem] text-txt-3 mt-1">{formatPrice(deliveryFeeAmount)} {t("checkout.deliveryFee")}</p>
                    {orderType === "delivery" && <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("pickup")}
                    className={`relative rounded-xl border p-4 text-center transition-all ${
                      orderType === "pickup"
                        ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_24px_hsl(var(--glow3))]"
                        : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                    }`}
                  >
                    <Store size={22} className={`mx-auto mb-2 ${orderType === "pickup" ? "text-primary" : "text-txt-3"}`} />
                    <span className={`font-semibold text-sm ${orderType === "pickup" ? "text-foreground" : "text-txt-2"}`}>{t("checkout.pickup")}</span>
                    <p className="text-[.68rem] text-txt-3 mt-1">{t("checkout.pickupFree")}</p>
                    {orderType === "pickup" && <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
                  </button>
                </div>
              </section>

              {/* Customer Info */}
              <section className="rounded-2xl border border-border bg-bg-3 p-5 md:p-7">
                <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 mb-5 flex items-center gap-2">
                  <User size={16} className="text-primary" /> {t("checkout.customerDetails")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">{t("checkout.fullName")}</label>
                    <div className="relative">
                      <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, customerName: true }))}
                        placeholder="Camila Rojas"
                        className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.customerName && fieldErrors.customerName ? "border-destructive" : "border-border"}`}
                      />
                    </div>
                    {touched.customerName && fieldErrors.customerName && <p className="mt-1 text-[.68rem] text-destructive">{fieldErrors.customerName}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">{t("checkout.phone")}</label>
                    <div className="relative">
                      <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, customerPhone: true }))}
                        placeholder={settings.sitePhone || "+569 9103 0440"}
                        className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.customerPhone && fieldErrors.customerPhone ? "border-destructive" : "border-border"}`}
                      />
                    </div>
                    {touched.customerPhone && fieldErrors.customerPhone && <p className="mt-1 text-[.68rem] text-destructive">{fieldErrors.customerPhone}</p>}
                  </div>
                </div>
              </section>

              {/* Delivery / Pickup Section */}
              {orderType === "delivery" ? (
                <section className="rounded-2xl border border-border bg-bg-3 p-5 md:p-7">
                  <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 mb-5 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" /> {t("checkout.deliveryAddress")}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">{t("checkout.addressLabel")}</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, deliveryAddress: true }))}
                        placeholder={t("checkout.addressPlaceholder")}
                        rows={3}
                        className={`w-full rounded-xl border bg-glass py-3.5 px-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] resize-none ${touched.deliveryAddress && fieldErrors.deliveryAddress ? "border-destructive" : "border-border"}`}
                      />
                      {touched.deliveryAddress && fieldErrors.deliveryAddress && <p className="mt-1 text-[.68rem] text-destructive">{fieldErrors.deliveryAddress}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                        <span className="inline-flex items-center gap-1.5"><FileText size={12} /> {t("checkout.notes")}</span>
                      </label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder={t("checkout.notesPlaceholder")}
                        rows={2}
                        className="w-full rounded-xl border border-border bg-glass py-3.5 px-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] resize-none"
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-border bg-bg-3 p-5 md:p-7">
                  <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 mb-5 flex items-center gap-2">
                    <Store size={16} className="text-primary" /> {t("checkout.pickupBranch")}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {branches.map((b) => {
                      const isSelected = selectedBranch?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBranchId(b.id)}
                          className={`rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_20px_hsl(var(--glow3))]"
                              : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-1">
                            <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-txt-4"}`} />
                            <span className={`font-semibold text-sm ${isSelected ? "text-foreground" : "text-txt-2"}`}>{b.name}</span>
                          </div>
                          <p className="text-[.68rem] text-txt-3 pl-[22px]">{b.address}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                      <span className="inline-flex items-center gap-1.5"><FileText size={12} /> {t("checkout.notes")}</span>
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder={t("checkout.notesPlaceholder")}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-glass py-3.5 px-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] resize-none"
                    />
                  </div>
                </section>
              )}

              {/* Payment Method */}
              <section className="rounded-2xl border border-border bg-bg-3 p-5 md:p-7">
                <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 mb-5 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" /> {t("checkout.paymentMethod")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {enabledPaymentMethods.includes("CASH") && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        paymentMethod === "CASH"
                          ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_20px_hsl(var(--glow3))]"
                          : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                      }`}
                    >
                      <Banknote size={22} className={`mb-2 ${paymentMethod === "CASH" ? "text-primary" : "text-txt-3"}`} />
                      <span className={`font-semibold text-sm block ${paymentMethod === "CASH" ? "text-foreground" : "text-txt-2"}`}>{t("checkout.cash")}</span>
                      <p className="text-[.68rem] text-txt-3 mt-1">{t("checkout.cashDesc")}</p>
                      {paymentMethod === "CASH" && <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
                    </button>
                  )}
                  {enabledPaymentMethods.includes("CARD") && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        paymentMethod === "CARD"
                          ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_20px_hsl(var(--glow3))]"
                          : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                      }`}
                    >
                      <CreditCard size={22} className={`mb-2 ${paymentMethod === "CARD" ? "text-primary" : "text-txt-3"}`} />
                      <span className={`font-semibold text-sm block ${paymentMethod === "CARD" ? "text-foreground" : "text-txt-2"}`}>{t("checkout.card")}</span>
                      <p className="text-[.68rem] text-txt-3 mt-1">{t("checkout.cardDesc")}</p>
                      {paymentMethod === "CARD" && <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
                    </button>
                  )}
                  {enabledPaymentMethods.includes("MOBILE_WALLET") && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("MOBILE_WALLET")}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        paymentMethod === "MOBILE_WALLET"
                          ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_4px_20px_hsl(var(--glow3))]"
                          : "border-border bg-glass hover:border-[hsl(var(--border2))]"
                      }`}
                    >
                      <Wallet size={22} className={`mb-2 ${paymentMethod === "MOBILE_WALLET" ? "text-primary" : "text-txt-3"}`} />
                      <span className={`font-semibold text-sm block ${paymentMethod === "MOBILE_WALLET" ? "text-foreground" : "text-txt-2"}`}>{t("checkout.wallet")}</span>
                      <p className="text-[.68rem] text-txt-3 mt-1">{t("checkout.walletDesc")}</p>
                      {paymentMethod === "MOBILE_WALLET" && <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3.5">
                  {paymentMethod === "CARD" ? (
                    <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-[.76rem] text-emerald-200 leading-[1.6]">
                    {paymentMethod === "CASH"
                      ? t("checkout.cashDesc")
                      : paymentMethod === "CARD"
                        ? t("checkout.cardDesc")
                        : t("checkout.walletDesc")}
                  </p>
                </div>
              </section>
            </div>

            {/* ─── RIGHT COLUMN (Sticky Order Summary) ─── */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
              {/* Cart Items */}
              <section className="rounded-2xl border border-border bg-bg-3 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-bold uppercase tracking-[2px] text-txt-2 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-primary" /> {t("checkout.orderSummary")}
                  </h2>
                  <span className="text-[.66rem] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-full">{totalItems} {t("checkout.items")}</span>
                </div>

                <div className="max-h-[320px] overflow-y-auto px-5 py-3" style={{ scrollbarWidth: "thin" }}>
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                        <p className="text-[.72rem] text-txt-3 mt-0.5">{item.category}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-md bg-glass-2 border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-md bg-glass-2 border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                            >
                              <Plus size={10} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-1 w-6 h-6 rounded-md text-txt-4 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-accent font-display">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Promo Code */}
              <section className="rounded-2xl border border-border bg-bg-3 p-5">
                <div className="flex items-center gap-2 mb-3 text-[.72rem] font-semibold uppercase tracking-[2px] text-txt-2">
                  <BadgePercent size={14} className="text-primary" /> {t("checkout.promoCode")}
                </div>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="KABOB10"
                    className="flex-1 rounded-xl border border-border bg-glass py-3 px-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-xs font-bold transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {validatingCoupon ? "..." : t("checkout.apply")}
                  </button>
                </div>
                {appliedCouponCode && <p className="mt-2 text-[.72rem] text-emerald-300 font-medium">✓ {appliedCouponCode}</p>}
                {flashSale?.isLive && <p className="mt-1.5 text-[.72rem] text-accent font-medium">⚡ {flashSale.name}</p>}
              </section>

              {/* Price Breakdown */}
              <section className="rounded-2xl border border-border bg-bg-3 p-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-txt-3">
                    <span>{t("cart.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-txt-3">
                    <span>{t("checkout.tax")} ({taxRatePercent}%)</span>
                    <span>{formatPrice(gst)}</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-txt-3">
                      <span>{t("checkout.deliveryFee")}</span>
                      <span>{formatPrice(deliveryCharge)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <span>{t("checkout.couponDiscount")}</span>
                      <span>- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {flashSaleDiscount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>{t("checkout.flashSale")}</span>
                      <span>- {formatPrice(flashSaleDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold">{t("checkout.grandTotal")}</span>
                    <span className="text-xl font-extrabold text-primary font-display">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !isFormValid || items.length === 0 || storeClosed}
                className="w-full py-[18px] rounded-xl bg-primary text-primary-foreground text-[.95rem] font-bold transition-all hover:brightness-105 active:scale-[.99] disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_6px_24px_rgba(242,196,28,0.35)] relative overflow-hidden group"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("checkout.processing")}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    {t("checkout.confirmOrder")} — {formatPrice(grandTotal)}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-[.66rem] text-txt-4">
                {settings.siteName || "Kabob Place"} · {settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique"}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Checkout;
