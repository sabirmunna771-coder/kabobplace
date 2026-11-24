import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { usePalette, PALETTES, type PaletteId } from "@/context/PaletteContext";
import { useLanguage } from "@/context/LanguageContext";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n/translations";
import { getAdminSettings, updateAdminSettings, type AppSettings } from "@/lib/api";
import {
  Settings as LuSettings,
  Palette,
  Globe,
  Languages,
  ShieldCheck,
  Layout,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  MessageSquare,
  CreditCardIcon,
  Lock,
  Upload,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { id: "general", label: "General & Branding", icon: Globe, description: "Logo, favicon, SEO & social" },
  { id: "theme", label: "Theme & Appearance", icon: Palette, description: "Colors, fonts & UI style" },
  { id: "cms", label: "Homepage CMS", icon: Layout, description: "Hero sliders & section toggles" },
  { id: "localization", label: "Languages", icon: Languages, description: "Default & Chilean languages" },
  { id: "business", label: "Business Logic", icon: ShieldCheck, description: "Financial & operations" },
  { id: "advanced", label: "Advanced/API", icon: LuSettings, description: "API keys & integrations" },
] as const;

type TabId = typeof TABS[number]["id"];

type HeroBannerItem = NonNullable<NonNullable<AppSettings["homepageCms"]>["heroBanners"]>[number];

type UpdateSettingProp = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
type UpdateNestedSettingProp = (parent: keyof AppSettings, key: string, value: unknown) => void;

const FONT_FAMILIES = [
  { value: "dm-sans", label: "DM Sans (Modern, Geometric)" },
  { value: "outfit", label: "Outfit (Tech-Forward)" },
  { value: "inter", label: "Inter (Clean, Minimal)" },
  { value: "syne", label: "Syne (Bold, Display)" },
  { value: "playfair", label: "Playfair (Elegant, Serif)" },
];

export default function SettingsPage() {
  const { token } = useAuth();
  const { refreshSettings } = useSiteSettings();
  const { setLanguage } = useLanguage();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [token]);

  const loadSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getAdminSettings(token);
      setSettings(response.data);
      setOriginalSettings(response.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!token || !settings) return;
    setSaving(true);
    try {
      const response = await updateAdminSettings(token, settings);
      setSettings(response.data);
      setOriginalSettings(response.data);
      if (response.data.defaultLanguage) {
        setLanguage(response.data.defaultLanguage);
      }
      await refreshSettings();
      toast.success("Settings saved and applied live across the website!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      toast.info("Changes discarded");
    }
  };

  const updateSetting: UpdateSettingProp = (key, value) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const updateNestedSetting: UpdateNestedSettingProp = (parent, key, value) => {
    if (settings) {
      const current = settings[parent];
      const base =
        current !== null && typeof current === "object" && !Array.isArray(current)
          ? { ...(current as Record<string, unknown>) }
          : {};
      setSettings({
        ...settings,
        [parent]: { ...base, [key]: value } as AppSettings[typeof parent],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-transparent border-t-primary mx-auto mb-4" />
          <p className="text-txt-3">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center max-w-md">
          <AlertCircle size={32} className="mx-auto mb-3 text-destructive" />
          <p className="text-destructive font-semibold">Failed to load settings</p>
          <button
            onClick={loadSettings}
            className="mt-4 px-4 py-2 rounded-lg bg-destructive text-foreground font-semibold hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl border border-white/10 bg-[#0B3D0B]/40 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Global Settings & CMS</h1>
            <p className="mt-3 text-txt-3 max-w-2xl text-sm sm:text-base">
              Complete control center for {settings.siteName || "Kabob Place"}. Manage branding, appearance, languages, homepage content, and business operations live.
            </p>
          </div>
          <div className="flex size-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex-shrink-0">
            <LuSettings size={28} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Tab Navigation - Horizontal Scroll */}
      <div className="rounded-xl border border-white/10 bg-[#0B3D0B]/30 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max lg:min-w-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-lg"
                    : "text-txt-3 hover:text-foreground hover:bg-white/[0.05]"
                )}
              >
                <Icon size={18} />
                <span className="hidden lg:block text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-white/10 bg-[#0B3D0B]/20 p-4 sm:p-8">
        {/* TAB 1: General & Branding */}
        {activeTab === "general" && (
          <GeneralBrandingTab settings={settings} updateSetting={updateSetting} updateNestedSetting={updateNestedSetting} />
        )}

        {/* TAB 2: Theme & Appearance */}
        {activeTab === "theme" && (
          <ThemeAppearanceTab settings={settings} updateNestedSetting={updateNestedSetting} />
        )}

        {/* TAB 3: Homepage CMS */}
        {activeTab === "cms" && (
          <HomepageCmsTab settings={settings} updateNestedSetting={updateNestedSetting} />
        )}

        {/* TAB 4: Localization */}
        {activeTab === "localization" && (
          <LocalizationTab settings={settings} updateSetting={updateSetting} />
        )}

        {/* TAB 5: Business Logic */}
        {activeTab === "business" && (
          <BusinessLogicTab settings={settings} updateSetting={updateSetting} updateNestedSetting={updateNestedSetting} />
        )}

        {/* TAB 6: Advanced/API */}
        {activeTab === "advanced" && (
          <AdvancedApiTab settings={settings} updateSetting={updateSetting} showApiKeys={showApiKeys} setShowApiKeys={setShowApiKeys} />
        )}
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 justify-end p-4 rounded-lg border border-white/[0.04] bg-white/[0.02]">
          <button
            onClick={handleResetChanges}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.04] hover:bg-white/[0.05] font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Discard
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-105 shadow-md transition-all disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 1: GENERAL & BRANDING */
/* ──────────────────────────────────────────────────────── */

function GeneralBrandingTab({
  settings,
  updateSetting,
  updateNestedSetting,
}: {
  settings: AppSettings;
  updateSetting: UpdateSettingProp;
  updateNestedSetting: UpdateNestedSettingProp;
}) {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={Globe}
        title="Website Information"
        description="Configure your brand identity and contact details across the storefront"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FormInput
          label="Site Name"
          value={settings.siteName}
          onChange={(v) => updateSetting("siteName", v)}
          placeholder="Kabob Places"
        />
        <FormInput
          label="Site Title"
          value={settings.siteTitle}
          onChange={(v) => updateSetting("siteTitle", v)}
          placeholder="Kabob Places - Auténticos Kabobs en Iquique"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormInput
          label="Site Phone"
          type="tel"
          value={settings.sitePhone || ""}
          onChange={(v) => updateSetting("sitePhone", v)}
          placeholder="+569 9103 0440"
        />
        <FormInput
          label="Site Email"
          type="email"
          value={settings.siteEmail || ""}
          onChange={(v) => updateSetting("siteEmail", v)}
          placeholder="hola@kabobplaces.cl"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormInput
          label="Site Address"
          type="textarea"
          value={settings.siteAddress || ""}
          onChange={(v) => updateSetting("siteAddress", v)}
          placeholder="Dirección santa rosa de huara manzana D sitio 29 iquique"
        />
        <div className="space-y-4">
          <FormInput
            label="Opening Hours Text"
            value={settings.contactHours || ""}
            onChange={(v) => updateSetting("contactHours", v)}
            placeholder="Lun – Dom · 12:00 PM – 11:30 PM"
          />
          <FormInput
            label="Footer Brand Tagline"
            value={settings.footerTagline || ""}
            onChange={(v) => updateSetting("footerTagline", v)}
            placeholder="Auténtico sabor a la parrilla y delivery rápido en Iquique, Chile."
          />
        </div>
      </div>

      <FormInput
        label="Google Maps Embed URL"
        value={settings.mapEmbedUrl || ""}
        onChange={(v) => updateSetting("mapEmbedUrl", v)}
        placeholder="https://maps.google.com/maps?q=Iquique,Chile&output=embed"
      />

      {/* Logo Suite */}
      <div className="border-t border-white/[0.04] pt-8">
        <SectionHeader
          icon={Upload}
          title="Logo Suite"
          description="Manage multiple logo instances for different contexts"
        />

        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          <LogoUploadField
            label="Header Logo"
            value={settings.logoSuite?.headerLogo || ""}
            onChange={(v) => updateNestedSetting("logoSuite", "headerLogo", v)}
            description="Displayed in navigation header"
          />
          <LogoUploadField
            label="Footer Logo"
            value={settings.logoSuite?.footerLogo || ""}
            onChange={(v) => updateNestedSetting("logoSuite", "footerLogo", v)}
            description="Displayed in website footer"
          />
          <LogoUploadField
            label="Sidebar Logo"
            value={settings.logoSuite?.sidebarLogo || ""}
            onChange={(v) => updateNestedSetting("logoSuite", "sidebarLogo", v)}
            description="Admin dashboard sidebar"
          />
        </div>
      </div>

      {/* Favicon & Meta */}
      <div className="border-t border-white/[0.04] pt-8">
        <SectionHeader
          icon={Lock}
          title="Favicon & Meta Tags"
          description="Browser tab icon and search engine metadata"
        />

        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <LogoUploadField
            label="Favicon"
            value={settings.siteFavicon || ""}
            onChange={(v) => updateSetting("siteFavicon", v)}
            description="Browser tab icon (.ico or .png)"
          />
        </div>

        <div className="space-y-4 mt-6">
          <FormInput
            label="SEO Meta Title (Max 160 chars)"
            value={settings.seoMetaTitle || ""}
            onChange={(v) => updateSetting("seoMetaTitle", v.slice(0, 160))}
            placeholder="Kabob Places — Iquique, Chile"
            maxLength={160}
          />
          <FormInput
            label="SEO Meta Description (Max 160 chars)"
            type="textarea"
            value={settings.seoMetaDescription || ""}
            onChange={(v) => updateSetting("seoMetaDescription", v.slice(0, 160))}
            placeholder="Auténticos kabobs, pizzas y delivery en Iquique, Chile."
            maxLength={160}
          />
        </div>
      </div>

      {/* Social Hub */}
      <div className="border-t border-white/[0.04] pt-8">
        <SectionHeader
          icon={Globe}
          title="Social Hub"
          description="Social media links that populate frontend footer"
        />

        <div className="space-y-4 mt-6">
          <FormInput
            label="Facebook URL"
            value={settings.facebookUrl || ""}
            onChange={(v) => updateSetting("facebookUrl", v)}
            placeholder="https://facebook.com/kabobplaces"
          />
          <FormInput
            label="Instagram URL"
            value={settings.instagramUrl || ""}
            onChange={(v) => updateSetting("instagramUrl", v)}
            placeholder="https://instagram.com/kabobplaces"
          />
          <FormInput
            label="WhatsApp Number"
            type="tel"
            value={settings.whatsappNumber || ""}
            onChange={(v) => updateSetting("whatsappNumber", v)}
            placeholder="+569 9103 0440"
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 2: THEME & APPEARANCE */
/* ──────────────────────────────────────────────────────── */

function ThemeAppearanceTab({
  settings,
  updateNestedSetting,
}: {
  settings: AppSettings;
  updateNestedSetting: UpdateNestedSettingProp;
}) {
  const { currentPalette, setPalette } = usePalette();
  const themeConfig = settings.themeConfig || {
    primaryColor: "#f97316",
    secondaryColor: "#ea580c",
    fontFamily: "dm-sans",
    borderRadius: 16,
    glassmorphIntensity: 40,
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={Palette}
        title="Design System"
        description="Control colors, typography, and UI style globally"
      />

      {/* Preset Contrast Palettes from Brand Logo */}
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent" />
            Brand & Contrast Color Palettes
          </h3>
          <p className="text-xs text-txt-4 mt-1">
            Choose from the brand-approved color schemes. Switches website and dashboard colors instantly and persists for all visitors.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PALETTES.map((p) => {
            const isSelected = currentPalette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPalette(p.id);
                  updateNestedSetting("themeConfig", "primaryColor", p.swatches.button);
                  updateNestedSetting("themeConfig", "secondaryColor", p.swatches.accent);
                  toast.success(`Theme switched to ${p.name}`);
                }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {p.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-txt-3 leading-relaxed mb-3">
                    {p.tagline}
                  </p>
                </div>

                {/* Swatches preview */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: p.swatches.bg }}
                      title={`Background: ${p.swatches.bg}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: p.swatches.card }}
                      title={`Cards: ${p.swatches.card}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: p.swatches.header }}
                      title={`Header/Footer: ${p.swatches.header}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: p.swatches.button }}
                      title={`Button: ${p.swatches.button}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: p.swatches.accent }}
                      title={`Accent: ${p.swatches.accent}`}
                    />
                  </div>
                  <div
                    className="p-2 rounded-md text-[10px] font-semibold flex items-center justify-between mt-2"
                    style={{
                      backgroundColor: p.swatches.header,
                      color: p.swatches.text,
                    }}
                  >
                    <span style={{ color: p.swatches.accent }}>$ 6.500</span>
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        backgroundColor: p.swatches.button,
                        color: "#ffffff",
                      }}
                    >
                      Pedir Ahora
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent" />
          Dynamic Color Palette
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">
              Primary Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={themeConfig.primaryColor || "#f97316"}
                onChange={(e) => updateNestedSetting("themeConfig", "primaryColor", e.target.value)}
                className="w-16 h-10 rounded-lg cursor-pointer border border-white/[0.1]"
              />
              <input
                type="text"
                value={themeConfig.primaryColor || "#f97316"}
                onChange={(e) => updateNestedSetting("themeConfig", "primaryColor", e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">
              Secondary Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={themeConfig.secondaryColor || "#ea580c"}
                onChange={(e) => updateNestedSetting("themeConfig", "secondaryColor", e.target.value)}
                className="w-16 h-10 rounded-lg cursor-pointer border border-white/[0.1]"
              />
              <input
                type="text"
                value={themeConfig.secondaryColor || "#ea580c"}
                onChange={(e) => updateNestedSetting("themeConfig", "secondaryColor", e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography Control */}
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6">
        <h3 className="font-semibold mb-4">Typography Control</h3>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">
            Font Family
          </label>
          <select
            value={themeConfig.fontFamily || "dm-sans"}
            onChange={(e) => updateNestedSetting("themeConfig", "fontFamily", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* UI Style Toggles */}
      <div className="space-y-4">
        <h3 className="font-semibold">UI Style Controls</h3>

        <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-txt-4 uppercase tracking-wider">
                  Border Radius
                </label>
                <span className="text-primary font-semibold">{themeConfig.borderRadius || 16}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={themeConfig.borderRadius || 16}
                onChange={(e) => updateNestedSetting("themeConfig", "borderRadius", parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-txt-4 mt-2 flex justify-between">
                <span>Sharp (0px)</span>
                <span>Rounded (32px)</span>
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-txt-4 uppercase tracking-wider">
                  Glassmorphism Intensity
                </label>
                <span className="text-primary font-semibold">{themeConfig.glassmorphIntensity || 40}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={themeConfig.glassmorphIntensity || 40}
                onChange={(e) => updateNestedSetting("themeConfig", "glassmorphIntensity", parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-txt-4 mt-2 flex justify-between">
                <span>Subtle (0%)</span>
                <span>Intense (100%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-blue-300 text-sm flex gap-3">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Live Theme Sync</p>
          <p className="text-xs mt-1 text-blue-400">Changes will apply globally across frontend and admin instantly after save</p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 3: HOMEPAGE CMS */
/* ──────────────────────────────────────────────────────── */

function HomepageCmsTab({
  settings,
  updateNestedSetting,
}: {
  settings: AppSettings;
  updateNestedSetting: UpdateNestedSettingProp;
}) {
  const cmsConfig = settings.homepageCms || {
    heroBanners: [],
    enabledSections: {
      testimonials: true,
      featured: true,
      specialOffers: true,
      newsletter: true,
    },
  };

  const addHeroBanner = () => {
    const heroBanners = cmsConfig.heroBanners || [];
    heroBanners.push({
      id: `hero-${Date.now()}`,
      title: "New Banner",
      subtitle: "",
      imageUrl: "",
      ctaLabel: "",
      ctaHref: "",
      isActive: true,
      sortOrder: heroBanners.length,
    });
    updateNestedSetting("homepageCms", "heroBanners", heroBanners);
  };

  const removeHeroBanner = (id: string) => {
    const heroBanners = (cmsConfig.heroBanners || []).filter((b) => b.id !== id);
    updateNestedSetting("homepageCms", "heroBanners", heroBanners);
  };

  const updateHeroBanner = (id: string, key: string, value: string | boolean | number) => {
    const heroBanners = (cmsConfig.heroBanners || []).map((b) =>
      b.id === id ? { ...b, [key]: value } : b
    );
    updateNestedSetting("homepageCms", "heroBanners", heroBanners);
  };

  const toggleSection = (section: string) => {
    const enabledSections = cmsConfig.enabledSections || {};
    updateNestedSetting("homepageCms", "enabledSections", {
      ...enabledSections,
      [section]: !enabledSections[section as keyof typeof enabledSections],
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={Layout}
        title="Homepage Content Manager"
        description="Manage hero sliders, banners, and page section visibility"
      />

      {/* Hero & Slider Manager */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            Hero Banners & Sliders
          </h3>
          <button
            onClick={addHeroBanner}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Add Banner
          </button>
        </div>

        <div className="space-y-4">
          {(cmsConfig.heroBanners || []).map((banner, idx) => (
            <HeroBannerCard
              key={banner.id}
              banner={banner}
              onUpdate={(key, value) => updateHeroBanner(banner.id || "", key, value)}
              onRemove={() => removeHeroBanner(banner.id || "")}
              index={idx}
            />
          ))}

          {(!cmsConfig.heroBanners || cmsConfig.heroBanners.length === 0) && (
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-8 text-center">
              <p className="text-txt-4 text-sm">No hero banners created yet</p>
              <button
                onClick={addHeroBanner}
                className="mt-3 text-sm text-primary font-semibold hover:underline"
              >
                Create your first banner →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Copy, Stats & Marquee */}
      <div className="border-t border-white/[0.04] pt-8 space-y-6">
        <SectionHeader
          icon={Layout}
          title="Hero Copy, Stats & Marquee"
          description="Control the hero badge, key highlights, and scrolling marquee items"
        />

        <FormInput
          label="Hero Badge Text"
          value={cmsConfig.heroBadgeText || ""}
          onChange={(v) => updateNestedSetting("homepageCms", "heroBadgeText", v)}
          placeholder="Ahora entregando en Iquique · +569 9103 0440"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">Hero Stats</label>
            <button
              type="button"
              onClick={() =>
                updateNestedSetting("homepageCms", "heroStats", [
                  ...(cmsConfig.heroStats || []),
                  { num: "100%", label: "Fresco" },
                ])
              }
              className="text-xs font-semibold text-primary hover:underline"
            >
              + Add Stat
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(cmsConfig.heroStats || []).map((stat, idx) => (
              <div key={idx} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <input
                  value={stat.num}
                  onChange={(e) => {
                    const next = [...(cmsConfig.heroStats || [])];
                    next[idx] = { ...next[idx], num: e.target.value };
                    updateNestedSetting("homepageCms", "heroStats", next);
                  }}
                  placeholder="24+"
                  className="w-full rounded bg-white/[0.04] px-2.5 py-1.5 text-sm font-bold outline-none"
                />
                <input
                  value={stat.label}
                  onChange={(e) => {
                    const next = [...(cmsConfig.heroStats || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    updateNestedSetting("homepageCms", "heroStats", next);
                  }}
                  placeholder="Platos"
                  className="w-full rounded bg-white/[0.04] px-2.5 py-1.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (cmsConfig.heroStats || []).filter((_, i) => i !== idx);
                    updateNestedSetting("homepageCms", "heroStats", next);
                  }}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <FormInput
          label="Marquee Items (comma separated)"
          type="textarea"
          value={(cmsConfig.marqueeItems || []).join(", ")}
          onChange={(v) =>
            updateNestedSetting(
              "homepageCms",
              "marqueeItems",
              v.split(",").map((item) => item.trim()).filter(Boolean),
            )
          }
          placeholder="Kabobs al Carbón, Shawarmas Artesanales, Delivery Iquique"
        />
      </div>

      {/* Section Orchestrator */}
      <div className="border-t border-white/[0.04] pt-8">
        <SectionHeader
          icon={Layout}
          title="Section Orchestrator"
          description="Enable or disable homepage sections with a single click"
        />

        <div className="grid gap-3 mt-6 lg:grid-cols-2">
          {[
            { key: "hero", label: "Hero Slider & Banner", icon: "🔥" },
            { key: "marquee", label: "Scrolling Marquee Ticker", icon: "✨" },
            { key: "featured", label: "Featured Products", icon: "⭐" },
            { key: "specialOffers", label: "Special Offers & Combos", icon: "🎁" },
            { key: "menu", label: "Complete Menu", icon: "🍽️" },
            { key: "shop", label: "Online Shop Grid", icon: "🛍️" },
            { key: "testimonials", label: "Customer Reviews", icon: "💬" },
            { key: "contact", label: "Contact & Map Section", icon: "📍" },
            { key: "newsletter", label: "Newsletter Signup", icon: "📧" },
          ].map(({ key, label, icon }) => (
            <SectionToggle
              key={key}
              label={label}
              icon={icon}
              enabled={cmsConfig.enabledSections?.[key as keyof typeof cmsConfig.enabledSections] ?? true}
              onChange={() => toggleSection(key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 4: LOCALIZATION */
/* ──────────────────────────────────────────────────────── */

function LocalizationTab({
  settings,
  updateSetting,
}: {
  settings: AppSettings;
  updateSetting: UpdateSettingProp;
}) {
  const defaultLang = settings.defaultLanguage || "es";
  const enabledLangs: LanguageCode[] =
    settings.enabledLanguages && settings.enabledLanguages.length > 0
      ? settings.enabledLanguages
      : ["es", "en", "arn", "ay"];

  const toggleLanguage = (code: LanguageCode) => {
    const exists = enabledLangs.includes(code);
    if (exists && enabledLangs.length <= 1) {
      toast.error("At least one language must remain active.");
      return;
    }
    const next = exists ? enabledLangs.filter((item) => item !== code) : [...enabledLangs, code];
    updateSetting("enabledLanguages", next);
    if (!next.includes(defaultLang)) {
      updateSetting("defaultLanguage", next[0]);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={Languages}
        title="Languages & Chilean Localization"
        description="Configure default storefront language and languages visible in the top-right switcher"
      />

      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6 space-y-4">
        <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">Default Website Language</label>
        <select
          value={defaultLang}
          onChange={(e) => {
            const nextDefault = e.target.value as LanguageCode;
            updateSetting("defaultLanguage", nextDefault);
            if (!enabledLangs.includes(nextDefault)) {
              updateSetting("enabledLanguages", [...enabledLangs, nextDefault]);
            }
          }}
          className="w-full max-w-md px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label} ({lang.shortLabel}) — {lang.region}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6 space-y-3">
        <h3 className="font-semibold">Enabled Top-Right Language Switcher Options</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = enabledLangs.includes(lang.code);
            return (
              <label
                key={lang.code}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleLanguage(lang.code)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold">{lang.label}</p>
                    <p className="text-xs text-txt-4">{lang.shortLabel} · {lang.region}</p>
                  </div>
                </div>
                {defaultLang === lang.code ? (
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">Default</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Hero Banner Card Component */
function HeroBannerCard({
  banner,
  onUpdate,
  onRemove,
  index,
}: {
  banner: HeroBannerItem;
  onUpdate: (key: string, value: string | boolean | number) => void;
  onRemove: () => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{banner.title || "Untitled Banner"}</p>
            <p className="text-xs text-txt-4 truncate">{banner.subtitle || "No subtitle"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {banner.isActive ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <X size={16} className="text-txt-4" />
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/[0.04] px-6 py-4 space-y-4 bg-white/[0.01]">
          <FormInput
            label="Banner Title"
            value={banner.title || ""}
            onChange={(v) => onUpdate("title", v)}
            placeholder="Enter banner title"
          />
          <FormInput
            label="Banner Subtitle"
            value={banner.subtitle || ""}
            onChange={(v) => onUpdate("subtitle", v)}
            placeholder="Optional subtitle"
          />
          <FormInput
            label="Image URL"
            value={banner.imageUrl || ""}
            onChange={(v) => onUpdate("imageUrl", v)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <FormInput
              label="CTA Label"
              value={banner.ctaLabel || ""}
              onChange={(v) => onUpdate("ctaLabel", v)}
              placeholder="Shop Now"
            />
            <FormInput
              label="CTA Link"
              value={banner.ctaHref || ""}
              onChange={(v) => onUpdate("ctaHref", v)}
              placeholder="/shop"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`banner-active-${banner.id}`}
              checked={banner.isActive ?? true}
              onChange={(e) => onUpdate("isActive", e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor={`banner-active-${banner.id}`} className="text-sm font-semibold cursor-pointer">
              Active (visible on homepage)
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onRemove}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive font-semibold text-sm transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Section Toggle Component */
function SectionToggle({
  label,
  icon,
  enabled,
  onChange,
}: {
  label: string;
  icon: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 p-4 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={enabled}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer"
      />
      <span className="text-lg">{icon}</span>
      <span className="font-semibold flex-1">{label}</span>
      {enabled ? (
        <Check size={16} className="text-green-500" />
      ) : (
        <X size={16} className="text-txt-4" />
      )}
    </label>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 4: BUSINESS LOGIC */
/* ──────────────────────────────────────────────────────── */

function BusinessLogicTab({
  settings,
  updateSetting,
  updateNestedSetting,
}: {
  settings: AppSettings;
  updateSetting: UpdateSettingProp;
  updateNestedSetting: UpdateNestedSettingProp;
}) {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={ShieldCheck}
        title="Business Configuration"
        description="Financial controls, delivery charges, and operational settings"
      />

      {/* Financial Controls */}
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6">
        <h3 className="font-semibold mb-4">Financial Controls</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <FormInput
            label="GST/Tax Percentage (%)"
            type="number"
            value={settings.taxPercentage.toString()}
            onChange={(v) => updateSetting("taxPercentage", parseFloat(v) || 0)}
            step="0.01"
            min="0"
            max="100"
          />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">Delivery Charge Type</label>
            <select
              value={settings.deliveryChargeType}
              onChange={(e) => updateSetting("deliveryChargeType", e.target.value as "FLAT" | "DISTANCE_BASED")}
              className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] outline-none focus:border-primary"
            >
              <option value="FLAT">Flat Fee</option>
              <option value="DISTANCE_BASED">Distance-Based</option>
            </select>
          </div>

          <FormInput
            label={`Flat Delivery Fee (${settings.currencySymbol || "$"})`}
            type="number"
            value={settings.deliveryFlatFee.toString()}
            onChange={(v) => updateSetting("deliveryFlatFee", parseFloat(v) || 0)}
            step="1"
            min="0"
          />
          <FormInput
            label={`Per Km Charge (${settings.currencySymbol || "$"})`}
            type="number"
            value={settings.deliveryPerKmCharge.toString()}
            onChange={(v) => updateSetting("deliveryPerKmCharge", parseFloat(v) || 0)}
            step="1"
            min="0"
          />

          <FormInput
            label="Currency Symbol"
            value={settings.currencySymbol}
            onChange={(v) => updateSetting("currencySymbol", v)}
            placeholder="CLP $"
          />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">Decimal Rounding</label>
            <select
              value={settings.decimalRounding.toString()}
              onChange={(e) => updateSetting("decimalRounding", parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] outline-none focus:border-primary"
            >
              <option value="0">No decimals</option>
              <option value="1">1 decimal</option>
              <option value="2">2 decimals</option>
              <option value="3">3 decimals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Store Operations */}
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.04] p-6">
        <h3 className="font-semibold mb-4">Store Operations</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
            <div>
              <p className="font-semibold">Store Status</p>
              <p className="text-xs text-txt-4">Current operational status</p>
            </div>
            <select
              value={settings.storeStatus}
              onChange={(e) => updateSetting("storeStatus", e.target.value as "OPEN" | "CLOSED")}
              className="px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="OPEN">✓ Open</option>
              <option value="CLOSED">✕ Closed</option>
            </select>
          </div>

          <ToggleSetting
            label="Maintenance Mode"
            description="Disable new orders while maintaining system"
            checked={settings.maintenanceMode}
            onChange={(v) => updateSetting("maintenanceMode", v)}
          />

          <ToggleSetting
            label="Auto-Shutdown"
            description="Automatically close store outside business hours"
            checked={settings.enableAutoShutdown}
            onChange={(v) => updateSetting("enableAutoShutdown", v)}
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* TAB 5: ADVANCED / API */
/* ──────────────────────────────────────────────────────── */

function AdvancedApiTab({
  settings,
  updateSetting,
  showApiKeys,
  setShowApiKeys,
}: {
  settings: AppSettings;
  updateSetting: UpdateSettingProp;
  showApiKeys: boolean;
  setShowApiKeys: (value: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={LuSettings}
        title="API & Integrations"
        description="Secure API keys for third-party services"
      />

      <div className="bg-yellow-500/5 rounded-lg border border-yellow-500/20 p-4 text-yellow-600 text-sm flex gap-3 mb-6">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Secure Storage</p>
          <p className="text-xs mt-1 text-yellow-600/70">All API keys are encrypted in the database and never exposed to the frontend</p>
        </div>
      </div>

      <div className="border border-white/[0.04] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">API Keys & Credentials</h3>
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] text-sm font-semibold transition-colors"
          >
            {showApiKeys ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showApiKeys ? "Hide" : "Show"}</span>
          </button>
        </div>

        <div className="space-y-4">
          <FormInputWithIcon
            label="Map Service API Key"
            type={showApiKeys ? "text" : "password"}
            value={settings.mapApiKey}
            onChange={(v) => updateSetting("mapApiKey", v)}
            placeholder="Enter API key"
            icon={<MapPin size={16} className="text-txt-4" />}
            description="For rider tracking and location services (Google Maps, Mapbox, etc.)"
          />
          <FormInputWithIcon
            label="SMS Gateway API Key"
            type={showApiKeys ? "text" : "password"}
            value={settings.smsGatewayApiKey}
            onChange={(v) => updateSetting("smsGatewayApiKey", v)}
            placeholder="Enter API key"
            icon={<MessageSquare size={16} className="text-txt-4" />}
            description="For sending order notifications and updates via SMS"
          />
          <FormInputWithIcon
            label="Payment Gateway API Key"
            type={showApiKeys ? "text" : "password"}
            value={settings.paymentGatewayApiKey}
            onChange={(v) => updateSetting("paymentGatewayApiKey", v)}
            placeholder="Enter API key"
            icon={<CreditCardIcon size={16} className="text-txt-4" />}
            description="For processing credit card and online payment transactions"
          />
        </div>
      </div>

      {/* Payment Methods Config */}
      <div className="border border-white/[0.04] rounded-lg p-6">
        <h3 className="font-semibold mb-4">Enabled Payment Methods</h3>
        <div className="space-y-2">
          {[
            { value: "CASH", label: "Cash on Delivery", icon: "💵" },
            { value: "CARD", label: "Credit Card", icon: "💳" },
            { value: "MOBILE_WALLET", label: "Mobile Wallet", icon: "📱" },
          ].map((method) => (
            <label
              key={method.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={settings.paymentMethods.includes(method.value)}
                onChange={(e) => {
                  const methods = new Set(settings.paymentMethods);
                  if (e.target.checked) {
                    methods.add(method.value);
                  } else {
                    methods.delete(method.value);
                  }
                  updateSetting("paymentMethods", Array.from(methods));
                }}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-lg">{method.icon}</span>
              <span className="font-semibold">{method.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* HELPER COMPONENTS */
/* ──────────────────────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
        <Icon size={20} className="text-primary" />
      </div>
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm text-txt-4">{description}</p>
      </div>
    </div>
  );
}

interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  step?: string;
  min?: string;
  max?: string;
}

function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  step,
  min,
  max,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          step={step}
          min={min}
          max={max}
          className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      )}
    </div>
  );
}

interface FormInputWithIconProps extends FormInputProps {
  icon?: React.ReactNode;
  description?: string;
}

function FormInputWithIcon({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  description,
  maxLength,
  step,
  min,
  max,
}: FormInputWithIconProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          step={step}
          min={min}
          max={max}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
            icon && "pl-10"
          )}
        />
      </div>
      {description && <p className="text-xs text-txt-4">{description}</p>}
    </div>
  );
}

function LogoUploadField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-txt-4 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-foreground outline-none focus:border-primary text-xs"
        />
      </div>
      {description && <p className="text-xs text-txt-4">{description}</p>}
      {value && (
        <div className="mt-2 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01]">
          <img src={value} alt="Preview" className="max-w-full max-h-24 rounded" onError={() => null} />
        </div>
      )}
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: ToggleSettingProps) {
  return (
    <label className="flex items-center gap-3 p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-white/[0.04] cursor-pointer"
      />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {description && <p className="text-xs text-txt-4">{description}</p>}
      </div>
    </label>
  );
}
