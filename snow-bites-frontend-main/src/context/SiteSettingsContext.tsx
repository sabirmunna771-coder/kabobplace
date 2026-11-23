import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiAssetUrl, getPublicSettings, type AppSettings } from "@/lib/api";
import defaultLogo from "@/assets/logo.webp";
import defaultFavicon from "@/assets/favicon.png";

export const DEFAULT_SITE_SETTINGS: AppSettings = {
  id: 1,
  storeStatus: "OPEN",
  enableAutoShutdown: false,
  maintenanceMode: false,
  taxPercentage: 19,
  deliveryChargeType: "FLAT",
  deliveryFlatFee: 1500,
  deliveryPerKmCharge: 500,
  currencySymbol: "$",
  decimalRounding: 0,
  paymentMethods: ["CASH", "CARD", "MOBILE_WALLET"],
  mapApiKey: "",
  smsGatewayApiKey: "",
  paymentGatewayApiKey: "",
  siteName: "Kabob Place",
  siteTitle: "Kabob Place — Kabobs & Comida Rápida en Iquique",
  siteLogo: defaultLogo,
  siteFavicon: defaultFavicon,
  sitePhone: "+569 9103 0440",
  siteEmail: "contacto@kabobplaces.cl",
  siteAddress: "Dirección santa rosa de huara manzana D sitio 29 iquique",
  contactHours: "11:00 AM - 11:00 PM",
  mapEmbedUrl: "https://www.google.com/maps?q=Santa+Rosa+de+Huara+Manzana+D+Sitio+29+Iquique+Chile&output=embed",
  footerTagline: "Auténticos kabobs y comida rápida premium en el corazón de Iquique. Ingredientes frescos, sabor intenso y entrega veloz.",
  seoMetaTitle: "Kabob Place | Kabobs y Comida Rápida en Iquique",
  seoMetaDescription: "Disfruta los mejores kabobs, shawarmas, hamburguesas y pizzas en Iquique.",
  whatsappNumber: "+569 9103 0440",
  defaultLanguage: "es",
  enabledLanguages: ["es", "en", "arn", "ay"],
  themeConfig: {
    primaryColor: "#F2C41C",
    secondaryColor: "#A0D000",
    fontFamily: "dm-sans",
    borderRadius: 16,
    glassmorphIntensity: 40,
  },
  logoSuite: {
    headerLogo: defaultLogo,
    footerLogo: defaultLogo,
    sidebarLogo: defaultLogo,
  },
  homepageCms: {
    heroBanners: [],
    heroBadgeText: "Ahora entregando en Iquique",
    heroStats: [
      { num: "50+", label: "Platos y Kabobs" },
      { num: "2K+", label: "Clientes Felices" },
      { num: "30m", label: "Entrega Rápida" },
    ],
    marqueeItems: ["HALAL FOOD", "BROASTER", "SHAWARMA", "BURGERS", "GRILL'S PAKISTANI", "PIZZAS", "AGREGADOS", "ZOFRI · IQUIQUE"],
    enabledSections: {
      hero: true,
      marquee: true,
      featured: true,
      menu: true,
      shop: true,
      specialOffers: true,
      testimonials: true,
      contact: true,
      newsletter: true,
    },
  },
  uiPreferences: {
    defaultBorderRadius: 16,
    glassmorphOpacity: 0.1,
    animationEnabled: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface SiteSettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  formatPrice: (amount: number) => string;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function hexToHslTuple(hex: string): string | null {
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const FONT_STACK_MAP: Record<string, { body: string; head: string }> = {
  inter: { body: "'Inter', sans-serif", head: "'Inter', sans-serif" },
  outfit: { body: "'Outfit', sans-serif", head: "'Outfit', sans-serif" },
  "dm-sans": { body: "'DM Sans', sans-serif", head: "'Outfit', sans-serif" },
  playfair: { body: "'DM Sans', sans-serif", head: "'Playfair Display', serif" },
  syne: { body: "'DM Sans', sans-serif", head: "'Syne', sans-serif" },
};

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const settings = useMemo<AppSettings>(() => {
    if (!data?.data) {
      return DEFAULT_SITE_SETTINGS;
    }
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...data.data,
      themeConfig: {
        ...DEFAULT_SITE_SETTINGS.themeConfig,
        ...data.data.themeConfig,
      },
      logoSuite: {
        ...DEFAULT_SITE_SETTINGS.logoSuite,
        ...data.data.logoSuite,
      },
      homepageCms: {
        ...DEFAULT_SITE_SETTINGS.homepageCms,
        ...data.data.homepageCms,
        enabledSections: {
          ...DEFAULT_SITE_SETTINGS.homepageCms?.enabledSections,
          ...data.data.homepageCms?.enabledSections,
        },
      },
    };
  }, [data]);

  // Apply dynamic theme CSS variables + SEO metadata + favicon
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.themeConfig;

    if (theme?.primaryColor) {
      const hsl = hexToHslTuple(theme.primaryColor);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--primary-foreground", "120 63% 7.5%");
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--glow", `${hsl} / 0.4`);
        root.style.setProperty("--glow2", `${hsl} / 0.15`);
        root.style.setProperty("--glow3", `${hsl} / 0.08`);
      }
    }

    if (theme?.secondaryColor) {
      const hsl = hexToHslTuple(theme.secondaryColor);
      if (hsl) {
        root.style.setProperty("--accent", hsl);
        root.style.setProperty("--accent-foreground", "120 63% 7.5%");
      }
    }

    if (typeof theme?.borderRadius === "number") {
      root.style.setProperty("--radius", `${theme.borderRadius}px`);
    }

    if (typeof theme?.glassmorphIntensity === "number") {
      const ratio = Math.max(0, Math.min(100, theme.glassmorphIntensity)) / 100;
      root.style.setProperty("--glass", `0 0% 100% / ${(0.015 + ratio * 0.05).toFixed(3)}`);
      root.style.setProperty("--glass2", `0 0% 100% / ${(0.03 + ratio * 0.08).toFixed(3)}`);
      root.style.setProperty("--glass3", `0 0% 100% / ${(0.05 + ratio * 0.12).toFixed(3)}`);
    }

    if (theme?.fontFamily && FONT_STACK_MAP[theme.fontFamily]) {
      const stack = FONT_STACK_MAP[theme.fontFamily];
      root.style.setProperty("--font-body", stack.body);
      root.style.setProperty("--font-head", stack.head);
    }

    const title = settings.seoMetaTitle?.trim() || settings.siteTitle?.trim() || settings.siteName;
    if (title) {
      document.title = title;
    }

    if (settings.seoMetaDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", settings.seoMetaDescription);
    }

    const resolvedFavicon = getApiAssetUrl(settings.siteFavicon) || settings.siteFavicon || defaultFavicon;
    if (resolvedFavicon) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = resolvedFavicon;

      let shortcutLink = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
      if (!shortcutLink) {
        shortcutLink = document.createElement("link");
        shortcutLink.rel = "shortcut icon";
        document.head.appendChild(shortcutLink);
      }
      shortcutLink.href = resolvedFavicon;
    }
  }, [settings]);

  const formatPrice = useCallback(
    (amount: number): string => {
      const symbol = settings.currencySymbol || "$";
      const decimals = typeof settings.decimalRounding === "number" ? settings.decimalRounding : 0;
      const num = Number.isFinite(amount) ? amount : 0;
      const formatted = num.toLocaleString("es-CL", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${symbol} ${formatted}`;
    },
    [settings.currencySymbol, settings.decimalRounding],
  );

  const refreshSettings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["public-settings"] });
  }, [queryClient]);

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      settings,
      isLoading,
      formatPrice,
      refreshSettings,
    }),
    [settings, isLoading, formatPrice, refreshSettings],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}

