import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Wrench, Phone, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getApiAssetUrl } from "@/lib/api";
import kabobLogo from "@/assets/logo.webp";

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  if (!settings.maintenanceMode || isAdmin) {
    return <>{children}</>;
  }

  const phone = settings.sitePhone || "+569 9103 0440";
  const whatsappDigits = (settings.whatsappNumber || phone).replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-bg text-foreground flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-5 right-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--glow3))_0%,transparent_60%)]" />

      <div className="relative z-10 max-w-lg w-full rounded-3xl border border-border bg-bg-3 p-8 md:p-10 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex justify-center">
          <img
            src={getApiAssetUrl(settings.logoSuite?.headerLogo || settings.siteLogo) || kabobLogo}
            alt={settings.siteName}
            className="h-16 w-auto object-contain drop-shadow"
          />
        </div>
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[3px] text-primary mb-4">
          {t("maintenance.badge")}
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-3">
          {settings.siteName}
        </h1>
        <p className="text-lg font-semibold text-foreground mb-2">{t("maintenance.title")}</p>
        <p className="text-sm text-txt-3 mb-7 leading-relaxed">{t("maintenance.subtitle")}</p>

        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-accent px-5 py-2.5 text-xs font-bold text-foreground shadow-lg"
          >
            <Phone size={14} /> {phone}
          </a>
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold text-foreground shadow-lg"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-txt-3 hover:text-primary transition-colors"
        >
          <ShieldCheck size={14} /> {t("maintenance.adminLogin")}
        </Link>
      </div>
    </div>
  );
}

