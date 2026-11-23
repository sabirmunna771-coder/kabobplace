import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAdminAnnouncement,
	createAdminCoupon,
	createAdminHeroBanner,
	createAdminMarketingNotification,
	deleteAdminAnnouncement,
	deleteAdminCoupon,
	deleteAdminHeroBanner,
	deleteAdminMarketingNotification,
	getAdminAnnouncements,
	getAdminCoupons,
	getAdminHeroBanners,
	getAdminMarketingCustomers,
	getAdminMarketingNotifications,
	updateAdminAnnouncement,
	updateAdminCoupon,
	updateAdminHeroBanner,
	updateAdminMarketingNotification,
	type ApiMarketingNotification,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { toast } from "sonner";
import ModuleScaffold from "./ModuleScaffold";
import StatTile from "./StatTile";
import { Megaphone, Tag, Users, Gift, Plus, X, Loader2, ToggleRight, Target, TrendingUp, AlertCircle, CheckCircle2, Trash2, Image, Bell } from "lucide-react";

const MarketingPage = () => {
	const { token } = useAuth();
	const { formatPrice } = useSiteSettings();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<"coupons" | "campaigns" | "banners" | "announcements">("coupons");
	const [showCouponModal, setShowCouponModal] = useState(false);
	const [showCampaignModal, setShowCampaignModal] = useState(false);
	const [newCouponCode, setNewCouponCode] = useState("");
	const [newCouponDiscount, setNewCouponDiscount] = useState("10");
	const [newNotificationTitle, setNewNotificationTitle] = useState("");
	const [newNotificationMessage, setNewNotificationMessage] = useState("");
	const [newNotificationKind, setNewNotificationKind] = useState<ApiMarketingNotification["kind"]>("GENERAL");
	const [newBannerTitle, setNewBannerTitle] = useState("");
	const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
	const [newBannerImageUrl, setNewBannerImageUrl] = useState("");
	const [newAnnouncementText, setNewAnnouncementText] = useState("");
	const [newAnnouncementCta, setNewAnnouncementCta] = useState("");
	const [newAnnouncementHref, setNewAnnouncementHref] = useState("#shop");
	
	const customersQuery = useQuery({ queryKey: ["admin-marketing-customers-page"], queryFn: () => getAdminMarketingCustomers(token!), enabled: Boolean(token), refetchInterval: 30000 });
	const couponsQuery = useQuery({ queryKey: ["admin-marketing-coupons-page"], queryFn: () => getAdminCoupons(token!), enabled: Boolean(token), refetchInterval: 30000 });
	const notificationsQuery = useQuery({ queryKey: ["admin-marketing-notifications-page"], queryFn: () => getAdminMarketingNotifications(token!), enabled: Boolean(token), refetchInterval: 30000 });
	const bannersQuery = useQuery({ queryKey: ["admin-marketing-banners-page"], queryFn: () => getAdminHeroBanners(token!), enabled: Boolean(token), refetchInterval: 30000 });
	const announcementsQuery = useQuery({ queryKey: ["admin-marketing-announcements-page"], queryFn: () => getAdminAnnouncements(token!), enabled: Boolean(token), refetchInterval: 30000 });
	
	const couponMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateAdminCoupon(token!, id, { isActive }),
		onSuccess: () => {
			toast.success("Coupon updated");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-coupons-page"] });
		},
	});
	const deleteCouponMutation = useMutation({
		mutationFn: (id: number) => deleteAdminCoupon(token!, id),
		onSuccess: () => {
			toast.success("Coupon deleted");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-coupons-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to delete coupon"),
	});
	const notificationMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateAdminMarketingNotification(token!, id, { isActive }),
		onSuccess: () => {
			toast.success("Notification updated");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-notifications-page"] });
		},
	});
	const deleteNotificationMutation = useMutation({
		mutationFn: (id: number) => deleteAdminMarketingNotification(token!, id),
		onSuccess: () => {
			toast.success("Campaign deleted");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-notifications-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to delete campaign"),
	});
	const createCouponMutation = useMutation({
		mutationFn: () => {
			const code = newCouponCode.trim().toUpperCase();
			if (!code) throw new Error("Coupon code is required");
			return createAdminCoupon(token!, {
				code,
				discountType: "PERCENTAGE",
				discountValue: Number(newCouponDiscount) || 0,
				minOrderValue: 0,
				isActive: true,
			});
		},
		onSuccess: () => {
			toast.success("Coupon created successfully");
			setNewCouponCode("");
			setNewCouponDiscount("10");
			setShowCouponModal(false);
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-coupons-page"] });
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to create coupon"),
	});
	const createNotificationMutation = useMutation({
		mutationFn: () => {
			const title = newNotificationTitle.trim();
			const message = newNotificationMessage.trim();
			if (!title || !message) throw new Error("Notification title and message are required");
			return createAdminMarketingNotification(token!, { title, message, kind: newNotificationKind, isActive: true });
		},
		onSuccess: () => {
			toast.success("Campaign created successfully");
			setNewNotificationTitle("");
			setNewNotificationMessage("");
			setShowCampaignModal(false);
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-notifications-page"] });
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to create campaign"),
	});
	const createBannerMutation = useMutation({
		mutationFn: () => {
			if (!newBannerTitle.trim() || !newBannerImageUrl.trim()) throw new Error("Title and Image URL are required");
			return createAdminHeroBanner(token!, {
				title: newBannerTitle.trim(),
				subtitle: newBannerSubtitle.trim() || undefined,
				imageUrl: newBannerImageUrl.trim(),
				isActive: true,
			});
		},
		onSuccess: () => {
			toast.success("Hero banner added");
			setNewBannerTitle("");
			setNewBannerSubtitle("");
			setNewBannerImageUrl("");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-banners-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to add banner"),
	});
	const toggleBannerMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateAdminHeroBanner(token!, id, { isActive }),
		onSuccess: () => {
			toast.success("Banner updated");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-banners-page"] });
		},
	});
	const deleteBannerMutation = useMutation({
		mutationFn: (id: number) => deleteAdminHeroBanner(token!, id),
		onSuccess: () => {
			toast.success("Banner deleted");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-banners-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to delete banner"),
	});
	const createAnnouncementMutation = useMutation({
		mutationFn: () => {
			if (!newAnnouncementText.trim()) throw new Error("Announcement text is required");
			return createAdminAnnouncement(token!, {
				text: newAnnouncementText.trim(),
				ctaLabel: newAnnouncementCta.trim() || undefined,
				ctaHref: newAnnouncementHref.trim() || undefined,
				isActive: true,
			});
		},
		onSuccess: () => {
			toast.success("Announcement created");
			setNewAnnouncementText("");
			setNewAnnouncementCta("");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-announcements-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to create announcement"),
	});
	const toggleAnnouncementMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateAdminAnnouncement(token!, id, { isActive }),
		onSuccess: () => {
			toast.success("Announcement updated");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-announcements-page"] });
		},
	});
	const deleteAnnouncementMutation = useMutation({
		mutationFn: (id: number) => deleteAdminAnnouncement(token!, id),
		onSuccess: () => {
			toast.success("Announcement deleted");
			void queryClient.invalidateQueries({ queryKey: ["admin-marketing-announcements-page"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to delete announcement"),
	});

	const customers = customersQuery.data?.customers ?? [];
	const coupons = couponsQuery.data?.coupons ?? [];
	const notifications = notificationsQuery.data?.notifications ?? [];
	const heroBanners = bannersQuery.data?.banners ?? [];
	const announcements = announcementsQuery.data?.announcements ?? [];

	const handleResetCoupon = useCallback(() => {
		setNewCouponCode("");
		setNewCouponDiscount("10");
	}, []);

	const handleResetCampaign = useCallback(() => {
		setNewNotificationTitle("");
		setNewNotificationMessage("");
		setNewNotificationKind("GENERAL");
	}, []);

	return (
		<ModuleScaffold
			title="Marketing & Promotions"
			subtitle="Manage coupons, promotional campaigns, hero banners, and announcement bars."
		>
			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
				<StatTile label="Total Customers" value={customers.length} hint="Active buyer profiles" />
				<StatTile label="Active Coupons" value={coupons.filter(c => c.isActive).length} hint="Redeemable codes" />
				<StatTile label="Campaigns" value={notifications.filter(n => n.isActive).length} hint="Live notifications" />
				<StatTile label="Active Banners" value={heroBanners.filter(b => b.isActive).length} hint="Homepage sliders" />
			</div>

			{/* Main Content */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left: Customers */}
				<div className="lg:col-span-1">
					<div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 overflow-hidden">
						{/* Card Header */}
						<div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border px-6 py-4 flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
								<Users size={20} className="text-[#071F07]" />
							</div>
							<div>
								<h3 className="font-bold text-sm">Top Customers</h3>
								<p className="text-[0.7rem] text-txt-4">By spending & loyalty</p>
							</div>
						</div>

						{/* Content */}
						<div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
							{customersQuery.isLoading ? (
								<div className="text-center py-8">
									<Loader2 size={20} className="mx-auto animate-spin text-txt-4" />
									<p className="text-xs text-txt-4 mt-2">Loading...</p>
								</div>
							) : customers.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border bg-glass-2 p-4 text-center">
									<Users size={24} className="mx-auto text-txt-4 mb-2 opacity-50" />
									<p className="text-xs text-txt-4">No customers yet</p>
								</div>
							) : (
								customers.slice(0, 10).map((customer, idx) => (
									<div key={customer.id} className="rounded-lg border border-border bg-glass-2 p-3.5 hover:bg-glass-3 transition-colors">
										<div className="flex items-start justify-between gap-2 mb-1.5">
											<div className="flex items-center gap-2 min-w-0">
												<span className="text-[0.65rem] font-bold text-primary bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center">#{idx + 1}</span>
												<div className="min-w-0">
													<div className="text-xs font-bold truncate">{customer.fullName}</div>
													<div className="text-[0.65rem] text-txt-4 truncate">{customer.loyaltyTag}</div>
												</div>
											</div>
										</div>
										<div className="text-[0.7rem] font-semibold text-accent">{formatPrice(customer.totalSpent)}</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Right: Coupons & Campaigns */}
				<div className="lg:col-span-2 space-y-6">
					{/* Tab Navigation */}
					<div className="flex flex-wrap gap-2 rounded-xl border border-border bg-glass-2 p-1">
						<button
							onClick={() => setActiveTab("coupons")}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
								activeTab === "coupons"
									? "bg-gradient-to-br from-primary to-accent text-[#071F07] shadow-lg"
									: "text-txt-3 hover:text-foreground"
							}`}
						>
							<Tag size={15} />
							Coupons
						</button>
						<button
							onClick={() => setActiveTab("campaigns")}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
								activeTab === "campaigns"
									? "bg-gradient-to-br from-primary to-accent text-[#071F07] shadow-lg"
									: "text-txt-3 hover:text-foreground"
							}`}
						>
							<Megaphone size={15} />
							Campaigns
						</button>
						<button
							onClick={() => setActiveTab("banners")}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
								activeTab === "banners"
									? "bg-gradient-to-br from-primary to-accent text-[#071F07] shadow-lg"
									: "text-txt-3 hover:text-foreground"
							}`}
						>
							<Image size={15} />
							Hero Banners
						</button>
						<button
							onClick={() => setActiveTab("announcements")}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
								activeTab === "announcements"
									? "bg-gradient-to-br from-primary to-accent text-[#071F07] shadow-lg"
									: "text-txt-3 hover:text-foreground"
							}`}
						>
							<Bell size={15} />
							Announcement Bar
						</button>
					</div>

					{/* Coupons Tab */}
					{activeTab === "coupons" && (
						<div className="space-y-4">
							{/* Create Coupon Card */}
							<div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-bold text-sm">Create New Coupon</h3>
									<button
										onClick={() => setShowCouponModal(!showCouponModal)}
										className="text-txt-4 hover:text-primary transition-colors"
									>
										{showCouponModal ? <X size={18} /> : <Plus size={18} />}
									</button>
								</div>

								{showCouponModal && (
									<div className="space-y-3 mb-4 pt-4 border-t border-border">
										<div>
											<label className="block text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1.5">Coupon Code</label>
											<input
												type="text"
												value={newCouponCode}
												onChange={(e) => setNewCouponCode(e.target.value)}
												placeholder="e.g., KABOB10"
												className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
											/>
										</div>
										<div>
											<label className="block text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1.5">Discount %</label>
											<input
												type="number"
												value={newCouponDiscount}
												onChange={(e) => setNewCouponDiscount(e.target.value)}
												placeholder="10"
												min="1"
												max="100"
												className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
											/>
										</div>
										<div className="flex gap-2 pt-2">
											<button
												onClick={() => createCouponMutation.mutate()}
												disabled={createCouponMutation.isPending || !newCouponCode.trim()}
												className="flex-1 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent text-[#071F07] font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
											>
												{createCouponMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
												Create
											</button>
											<button
												onClick={() => {
													setShowCouponModal(false);
													handleResetCoupon();
												}}
												className="flex-1 py-2.5 rounded-lg border border-border bg-glass-2 text-foreground font-semibold text-sm hover:bg-glass-3 transition-all"
											>
												Cancel
											</button>
										</div>
									</div>
								)}
							</div>

							{/* Coupons List */}
							<div className="space-y-3">
								{couponsQuery.isLoading ? (
									<div className="text-center py-8">
										<Loader2 size={20} className="mx-auto animate-spin text-txt-4" />
									</div>
								) : coupons.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border bg-glass-2 p-6 text-center">
										<Gift size={24} className="mx-auto mb-2 text-txt-4 opacity-50" />
										<p className="text-sm text-txt-3">No coupons created yet</p>
										<p className="text-xs text-txt-4 mt-1">Create one to boost customer spending</p>
									</div>
								) : (
									coupons.map((coupon) => (
										<div key={coupon.id} className="rounded-lg border border-border bg-glass-2 p-4 hover:bg-glass-3 transition-colors">
											<div className="flex items-center justify-between gap-3 mb-2">
												<div className="flex items-center gap-3 min-w-0">
													<div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
														<Tag size={18} className="text-primary" />
													</div>
													<div className="min-w-0">
														<div className="font-bold text-sm">{coupon.code}</div>
														<div className="text-[0.7rem] text-txt-4">{coupon.discountValue}% discount</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${coupon.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
														{coupon.isActive ? "Active" : "Inactive"}
													</span>
												</div>
											</div>
											<div className="flex gap-2">
												<button
													onClick={() => couponMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
													disabled={couponMutation.isPending}
													className="flex-1 py-2 rounded-lg border border-border bg-glass-2 text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all flex items-center justify-center gap-1.5"
												>
													<ToggleRight size={14} />
													{coupon.isActive ? "Disable" : "Enable"}
												</button>
												<button
													onClick={() => deleteCouponMutation.mutate(coupon.id)}
													disabled={deleteCouponMutation.isPending}
													className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-1"
												>
													<Trash2 size={14} />
													Delete
												</button>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

					{/* Campaigns Tab */}
					{activeTab === "campaigns" && (
						<div className="space-y-4">
							{/* Create Campaign Card */}
							<div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-bold text-sm">Launch Campaign</h3>
									<button
										onClick={() => setShowCampaignModal(!showCampaignModal)}
										className="text-txt-4 hover:text-primary transition-colors"
									>
										{showCampaignModal ? <X size={18} /> : <Plus size={18} />}
									</button>
								</div>

								{showCampaignModal && (
									<div className="space-y-3 mb-4 pt-4 border-t border-border">
										<div>
											<label className="block text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1.5">Campaign Type</label>
											<select
												value={newNotificationKind}
												onChange={(e) => setNewNotificationKind(e.target.value as ApiMarketingNotification["kind"])}
												className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
											>
												<option value="GENERAL">General Update</option>
												<option value="DEAL_OF_DAY">Deal of the Day</option>
												<option value="WE_MISS_YOU">We Miss You</option>
												<option value="URGENT">Urgent Alert</option>
											</select>
										</div>
										<div>
											<label className="block text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1.5">Title</label>
											<input
												type="text"
												value={newNotificationTitle}
												onChange={(e) => setNewNotificationTitle(e.target.value)}
												placeholder="Campaign title"
												className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
											/>
										</div>
										<div>
											<label className="block text-[0.7rem] font-bold text-txt-4 uppercase tracking-wider mb-1.5">Message</label>
											<textarea
												value={newNotificationMessage}
												onChange={(e) => setNewNotificationMessage(e.target.value)}
												placeholder="Campaign message"
												rows={3}
												className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none"
											/>
										</div>
										<div className="flex gap-2 pt-2">
											<button
												onClick={() => createNotificationMutation.mutate()}
												disabled={createNotificationMutation.isPending || !newNotificationTitle.trim() || !newNotificationMessage.trim()}
												className="flex-1 py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent text-[#071F07] font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
											>
												{createNotificationMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
												Launch
											</button>
											<button
												onClick={() => {
													setShowCampaignModal(false);
													handleResetCampaign();
												}}
												className="flex-1 py-2.5 rounded-lg border border-border bg-glass-2 text-foreground font-semibold text-sm hover:bg-glass-3 transition-all"
											>
												Cancel
											</button>
										</div>
									</div>
								)}
							</div>

							{/* Campaigns List */}
							<div className="space-y-3">
								{notificationsQuery.isLoading ? (
									<div className="text-center py-8">
										<Loader2 size={20} className="mx-auto animate-spin text-txt-4" />
									</div>
								) : notifications.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border bg-glass-2 p-6 text-center">
										<Megaphone size={24} className="mx-auto mb-2 text-txt-4 opacity-50" />
										<p className="text-sm text-txt-3">No campaigns yet</p>
										<p className="text-xs text-txt-4 mt-1">Launch a campaign to engage customers</p>
									</div>
								) : (
									notifications.map((notification) => (
										<div key={`n-${notification.id}`} className="rounded-lg border border-border bg-glass-2 p-4 hover:bg-glass-3 transition-colors">
											<div className="flex items-start justify-between gap-3 mb-2">
												<div className="flex items-start gap-3 min-w-0 flex-1">
													<div className={`flex size-10 items-center justify-center rounded-lg mt-0.5 flex-shrink-0 ${
														notification.kind === "URGENT" ? "bg-red-500/20 border border-red-500/30" :
														notification.kind === "DEAL_OF_DAY" ? "bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30" :
														"bg-blue-500/20 border border-blue-500/30"
													}`}>
														{notification.kind === "URGENT" ? <AlertCircle size={18} className="text-red-400" /> : <Megaphone size={18} className="text-primary" />}
													</div>
													<div className="min-w-0 flex-1">
														<div className="font-bold text-sm">{notification.title}</div>
														<div className="text-[0.7rem] text-txt-4 line-clamp-2">{notification.message}</div>
														<div className="text-[0.65rem] text-txt-4 mt-1">Type: {notification.kind}</div>
													</div>
												</div>
												<span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${notification.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
													{notification.isActive ? "Active" : "Inactive"}
												</span>
											</div>
											<div className="flex gap-2">
												<button
													onClick={() => notificationMutation.mutate({ id: notification.id, isActive: !notification.isActive })}
													disabled={notificationMutation.isPending}
													className="flex-1 py-2 rounded-lg border border-border bg-glass-2 text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all flex items-center justify-center gap-1.5"
												>
													<ToggleRight size={14} />
													{notification.isActive ? "Disable" : "Enable"}
												</button>
												<button
													onClick={() => deleteNotificationMutation.mutate(notification.id)}
													disabled={deleteNotificationMutation.isPending}
													className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-1"
												>
													<Trash2 size={14} />
													Delete
												</button>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

					{/* Hero Banners Tab */}
					{activeTab === "banners" && (
						<div className="space-y-4">
							<div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6 space-y-3">
								<h3 className="font-bold text-sm">Add Hero Banner</h3>
								<input
									type="text"
									value={newBannerTitle}
									onChange={(e) => setNewBannerTitle(e.target.value)}
									placeholder="Banner Title"
									className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
								/>
								<input
									type="text"
									value={newBannerSubtitle}
									onChange={(e) => setNewBannerSubtitle(e.target.value)}
									placeholder="Subtitle (optional)"
									className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
								/>
								<input
									type="text"
									value={newBannerImageUrl}
									onChange={(e) => setNewBannerImageUrl(e.target.value)}
									placeholder="Image URL (/assets/... or https://...)"
									className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
								/>
								<button
									onClick={() => createBannerMutation.mutate()}
									disabled={createBannerMutation.isPending || !newBannerTitle.trim() || !newBannerImageUrl.trim()}
									className="w-full py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent text-[#071F07] font-bold text-sm disabled:opacity-50"
								>
									{createBannerMutation.isPending ? "Adding..." : "Create Hero Banner"}
								</button>
							</div>

							<div className="space-y-3">
								{heroBanners.map((banner) => (
									<div key={banner.id} className="rounded-lg border border-border bg-glass-2 p-4 space-y-3">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="font-bold text-sm">{banner.title}</div>
												{banner.subtitle ? <div className="text-xs text-txt-3">{banner.subtitle}</div> : null}
												<div className="text-[0.65rem] text-txt-4 truncate mt-1">{banner.imageUrl}</div>
											</div>
											<span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${banner.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
												{banner.isActive ? "Active" : "Hidden"}
											</span>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => toggleBannerMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
												disabled={toggleBannerMutation.isPending}
												className="flex-1 py-2 rounded-lg border border-border bg-glass-2 text-xs font-semibold text-txt-2 hover:text-foreground transition-all flex items-center justify-center gap-1.5"
											>
												<ToggleRight size={14} />
												{banner.isActive ? "Disable" : "Enable"}
											</button>
											<button
												onClick={() => deleteBannerMutation.mutate(banner.id)}
												disabled={deleteBannerMutation.isPending}
												className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
											>
												<Trash2 size={14} />
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Announcement Bar Tab */}
					{activeTab === "announcements" && (
						<div className="space-y-4">
							<div className="rounded-2xl border border-border bg-gradient-to-br from-bg-3 to-bg-2 p-6 space-y-3">
								<h3 className="font-bold text-sm">Add Top Announcement Bar</h3>
								<input
									type="text"
									value={newAnnouncementText}
									onChange={(e) => setNewAnnouncementText(e.target.value)}
									placeholder="Announcement message (e.g. Envío gratis en Iquique hoy)"
									className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
								/>
								<div className="grid grid-cols-2 gap-3">
									<input
										type="text"
										value={newAnnouncementCta}
										onChange={(e) => setNewAnnouncementCta(e.target.value)}
										placeholder="CTA Label (optional)"
										className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
									/>
									<input
										type="text"
										value={newAnnouncementHref}
										onChange={(e) => setNewAnnouncementHref(e.target.value)}
										placeholder="Link (#shop)"
										className="w-full rounded-lg border border-border bg-glass-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
									/>
								</div>
								<button
									onClick={() => createAnnouncementMutation.mutate()}
									disabled={createAnnouncementMutation.isPending || !newAnnouncementText.trim()}
									className="w-full py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent text-[#071F07] font-bold text-sm disabled:opacity-50"
								>
									{createAnnouncementMutation.isPending ? "Publishing..." : "Publish Announcement"}
								</button>
							</div>

							<div className="space-y-3">
								{announcements.map((announcement) => (
									<div key={announcement.id} className="rounded-lg border border-border bg-glass-2 p-4 space-y-3">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="font-semibold text-sm">{announcement.text}</div>
												{announcement.ctaLabel ? (
													<div className="text-xs text-txt-4 mt-1">CTA: {announcement.ctaLabel} ({announcement.ctaHref || "#"})</div>
												) : null}
											</div>
											<span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${announcement.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
												{announcement.isActive ? "Active" : "Hidden"}
											</span>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => toggleAnnouncementMutation.mutate({ id: announcement.id, isActive: !announcement.isActive })}
												disabled={toggleAnnouncementMutation.isPending}
												className="flex-1 py-2 rounded-lg border border-border bg-glass-2 text-xs font-semibold text-txt-2 hover:text-foreground transition-all flex items-center justify-center gap-1.5"
											>
												<ToggleRight size={14} />
												{announcement.isActive ? "Disable" : "Enable"}
											</button>
											<button
												onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
												disabled={deleteAnnouncementMutation.isPending}
												className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
											>
												<Trash2 size={14} />
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</ModuleScaffold>
	);
};

export default MarketingPage;
