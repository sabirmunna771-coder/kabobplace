import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  LogOut,
  Loader2,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  X,
  Home,
} from "lucide-react";
import kabobLogo from "@/assets/logo.webp";
import type { DashboardStats, CustomerOrder, CustomerAddress } from "@/lib/api";
import {
  getApiAssetUrl,
  getDashboardStats,
  getCustomerOrders,
  getCurrentOrder,
  getCustomerAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrderDetails,
  reorderFromOrder,
  getProducts,
  updateMyProfile,
  changeMyPassword,
} from "@/lib/api";

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const { token, user, logout, setAuthenticatedUser, isReady } = useAuth();
  const { addItem, clearCart } = useCart();
  const { settings, formatPrice } = useSiteSettings();
  const brandName = settings.siteName || "Kabob Places";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null);
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Address form
  const [addrLabel, setAddrLabel] = useState("Casa");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("Iquique");
  const [addrState, setAddrState] = useState("Tarapacá");
  const [addrPostalCode, setAddrPostalCode] = useState("1100000");
  const [addrCountry, setAddrCountry] = useState("Chile");
  const [addrSaving, setAddrSaving] = useState(false);

  // Profile & password forms
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    void fetchDashboardData(token);
  }, [token, isReady]);

  useEffect(() => {
    if (user || stats) {
      setFullName(stats?.fullName ?? user?.fullName ?? "");
      setEmail(stats?.email ?? user?.email ?? "");
      setPhone(stats?.phone ?? user?.phone ?? "");
    }
  }, [user, stats]);

  async function fetchDashboardData(authToken: string) {
    try {
      setLoading(true);
      setError("");

      const [statsRes, currentRes, historyRes, addressesRes] = await Promise.all([
        getDashboardStats(authToken),
        getCurrentOrder(authToken),
        getCustomerOrders(authToken),
        getCustomerAddresses(authToken),
      ]);

      setStats(statsRes?.data || null);
      setCurrentOrder(currentRes?.data || null);
      setOrderHistory(historyRes?.data || []);
      setAddresses(addressesRes?.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleInspectOrder(orderId: number) {
    if (!token) return;
    try {
      const res = await getOrderDetails(token, orderId);
      setSelectedOrder(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load order details.");
    }
  }

  async function handleReorder(orderId: number) {
    if (!token) return;
    try {
      const [reorderRes, allProducts] = await Promise.all([reorderFromOrder(token, orderId), getProducts()]);
      const productByDbId = new Map(allProducts.map((p) => [p.dbId, p]));
      clearCart();
      let addedCount = 0;
      for (const item of reorderRes.data.items) {
        const matched = productByDbId.get(item.productId);
        if (matched) {
          for (let q = 0; q < item.quantity; q += 1) {
            addItem(matched);
            addedCount += 1;
          }
        }
      }
      if (addedCount > 0) {
        navigate("/checkout");
      } else {
        setFeedback("Items from this order are no longer in the catalog.");
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Reorder failed.");
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !addrStreet.trim()) return;
    setAddrSaving(true);
    setFeedback("");
    try {
      await createAddress(token, {
        label: addrLabel.trim() || "Casa",
        street: addrStreet.trim(),
        city: addrCity.trim() || "Iquique",
        state: addrState.trim() || "Tarapacá",
        postalCode: addrPostalCode.trim() || "1100000",
        country: addrCountry.trim() || "Chile",
        isDefault: addresses.length === 0,
      });
      setAddrStreet("");
      const refreshed = await getCustomerAddresses(token);
      setAddresses(refreshed.data || []);
      setFeedback("Address saved successfully.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleSetDefaultAddress(address: CustomerAddress) {
    if (!token) return;
    try {
      await updateAddress(token, address.id, { isDefault: true });
      const refreshed = await getCustomerAddresses(token);
      setAddresses(refreshed.data || []);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to update default address.");
    }
  }

  async function handleDeleteAddress(addressId: number) {
    if (!token) return;
    try {
      await deleteAddress(token, addressId);
      setAddresses((prev) => prev.filter((item) => item.id !== addressId));
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to delete address.");
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setFeedback("");
    try {
      const res = await updateMyProfile(token, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      setAuthenticatedUser(res.user);
      setStats((prev) => (prev ? { ...prev, fullName: res.user.fullName, email: res.user.email, phone: res.user.phone } : prev));
      setFeedback("Profile updated successfully.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordSaving(true);
    setFeedback("");
    try {
      const res = await changeMyPassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback(res.message || "Password updated.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Alert className="max-w-md bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400 mt-2">
            <p className="font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-sm mb-4">{error}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => token && void fetchDashboardData(token)} className="bg-red-500 hover:bg-red-600">
                Retry
              </Button>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                Login Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const orderStatusConfig: Record<string, { icon: typeof Clock; color: string; label: string; progress: number }> = {
    PENDING: { icon: Clock, color: "text-primary", label: "Pending", progress: 25 },
    CONFIRMED: { icon: CheckCircle2, color: "text-accent", label: "Confirmed", progress: 50 },
    PREPARING: { icon: TrendingUp, color: "text-primary", label: "Preparing", progress: 75 },
    OUT_FOR_DELIVERY: { icon: Truck, color: "text-accent", label: "Out for Delivery", progress: 90 },
    COMPLETED: { icon: CheckCircle2, color: "text-emerald-400", label: "Completed", progress: 100 },
    CANCELLED: { icon: AlertTriangle, color: "text-red-400", label: "Cancelled", progress: 0 },
  };

  return (
    <div className="min-h-screen bg-bg text-foreground">
      {/* Header */}
      <div className="relative border-b border-white/10 bg-[#0B3D0B]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Link to="/" className="shrink-0 hover:opacity-85 transition-opacity">
              <img
                src={getApiAssetUrl(settings.logoSuite?.headerLogo || settings.siteLogo) || kabobLogo}
                alt={brandName}
                className="h-10 w-auto max-w-[48px] object-contain drop-shadow"
              />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Welcome back, {stats?.fullName ? stats.fullName.split(" ")[0] : "Guest"}!
              </h1>
              <p className="text-txt-2 text-sm mt-0.5">
                {brandName} · {stats?.email || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-white/10 text-txt-2 hover:bg-white/5">
              <Home className="w-4 h-4 mr-2" />
              Storefront
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/10 text-txt-2 hover:bg-white/5">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {feedback}
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#0B3D0B]/50 border-white/10 backdrop-blur-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-txt-2 text-sm font-medium">Loyalty Points</p>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-primary">{stats?.snowPoints || 0}</p>
              <p className="text-xs text-txt-3 mt-2">Earn points with every {brandName} order</p>
            </div>
          </Card>

          <Card className="bg-[#0B3D0B]/50 border-white/10 backdrop-blur-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-txt-2 text-sm font-medium">Total Orders</p>
                <ShoppingBag className="w-4 h-4 text-accent" />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-txt-3 mt-2">All-time orders</p>
            </div>
          </Card>

          <Card className="bg-[#0B3D0B]/50 border-white/10 backdrop-blur-xl sm:col-span-2 md:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-txt-2 text-sm font-medium">Total Spent</p>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-primary">{formatPrice(stats?.totalSpent || 0)}</p>
              <p className="text-xs text-txt-3 mt-2">Cumulative spending</p>
            </div>
          </Card>
        </div>

        {/* Current Order Tracking */}
        {currentOrder && (
          <Card className="mb-8 bg-[#0B3D0B]/50 border-white/10 backdrop-blur-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Current Order Tracking</h2>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-txt-2">Order #{currentOrder.orderNumber}</p>
                  <span className={`text-sm font-semibold ${orderStatusConfig[currentOrder.status]?.color}`}>
                    {orderStatusConfig[currentOrder.status]?.label}
                  </span>
                </div>
                <Progress value={orderStatusConfig[currentOrder.status]?.progress || 0} className="h-2 bg-[#071F07]" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-txt-2 text-sm">Delivery Address</p>
                  <p className="text-foreground font-semibold mt-1">{currentOrder.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-txt-2 text-sm">Payment Method</p>
                  <p className="text-foreground font-semibold mt-1">{currentOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-txt-2 text-sm">Total Amount</p>
                  <p className="text-primary font-bold text-lg mt-1">{formatPrice(currentOrder.total)}</p>
                </div>
                <div>
                  <p className="text-txt-2 text-sm">Items</p>
                  <p className="text-foreground font-semibold mt-1">{currentOrder.items.length} item(s)</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="bg-[#0B3D0B]/60 border-b border-white/10 w-full justify-start rounded-none p-0 h-auto overflow-x-auto">
            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-6 py-3 font-semibold text-txt-2">
              Order History
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-6 py-3 font-semibold text-txt-2">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-6 py-3 font-semibold text-txt-2">
              Profile & Password
            </TabsTrigger>
          </TabsList>

          {/* Order History Tab */}
          <TabsContent value="history" className="mt-6">
            {orderHistory.length === 0 ? (
              <Card className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-txt-3 mx-auto mb-4" />
                <p className="text-txt-2">No orders yet. Start ordering from {brandName} today!</p>
                <Button className="mt-4 bg-primary text-primary-foreground font-bold hover:brightness-105" onClick={() => navigate("/")}>
                  Browse Menu
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <Card key={order.id} className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-foreground font-semibold">Order #{order.orderNumber}</p>
                          <p className="text-txt-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${orderStatusConfig[order.status]?.color} bg-[#071F07]`}>
                          {orderStatusConfig[order.status]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-txt-2 text-sm">{order.items.length} item(s) · <span className="text-primary font-bold">{formatPrice(order.total)}</span></p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => void handleInspectOrder(order.id)} className="border-white/10 text-txt-2 hover:bg-white/5">
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Details
                          </Button>
                          <Button size="sm" className="bg-primary text-primary-foreground font-bold hover:brightness-105 active:scale-95" onClick={() => void handleReorder(order.id)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reorder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="mt-6 space-y-6">
            <Card className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Saved Address
              </h3>
              <form onSubmit={handleAddAddress} className="grid gap-3 md:grid-cols-2">
                <input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="Label (Casa, Trabajo)" className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} placeholder="Dirección santa rosa de huara manzana D sitio 29" required className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} placeholder="Iquique" className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={addrState} onChange={(e) => setAddrState(e.target.value)} placeholder="Tarapacá" className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={addrPostalCode} onChange={(e) => setAddrPostalCode(e.target.value)} placeholder="1100000" className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} placeholder="Chile" className="rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={addrSaving} className="bg-primary text-primary-foreground font-bold hover:brightness-105">
                    {addrSaving ? "Saving..." : "Save Address"}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <Card key={address.id} className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{address.label}</span>
                      {address.isDefault ? <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs text-accent font-semibold">Default</span> : null}
                    </div>
                    <p className="text-sm text-txt-2">{address.street}</p>
                    <p className="text-xs text-txt-3 mt-1">{address.city}, {address.state} · {address.country}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {!address.isDefault ? (
                      <Button size="sm" variant="outline" onClick={() => void handleSetDefaultAddress(address)} className="border-white/10 text-txt-2 hover:bg-white/5">
                        Set Default
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => void handleDeleteAddress(address.id)} className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 grid gap-6 md:grid-cols-2">
            <Card className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Profile Details</h3>
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+569 9103 0440" className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <Button type="submit" disabled={profileSaving} className="bg-primary text-primary-foreground font-bold hover:brightness-105">
                  {profileSaving ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </Card>

            <Card className="bg-[#0B3D0B]/40 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Change Password</h3>
              <form onSubmit={handleSavePassword} className="space-y-3">
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" required className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" required className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="w-full rounded-lg bg-[#071F07] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-txt-4 focus:border-primary outline-none" />
                <Button type="submit" disabled={passwordSaving} className="bg-primary text-primary-foreground font-bold hover:brightness-105">
                  {passwordSaving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Modal */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0B3D0B] p-6 text-foreground shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-txt-3 hover:text-foreground"><X size={18} /></button>
            </div>
            <p className="text-sm text-txt-2 mb-4">{selectedOrder.deliveryAddress}</p>
            <div className="space-y-2 border-y border-white/10 py-3 mb-4 max-h-60 overflow-y-auto">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.productName}</span>
                  <span className="font-semibold text-primary">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary font-display font-extrabold text-xl">{formatPrice(selectedOrder.total)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
