import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useMemo } from "react";
import CartDrawer from "@/components/CartDrawer";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { PartyPopper, CheckCircle2, MapPin, Clock, ArrowRight, Home } from "lucide-react";

const OrderSuccess = () => {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(true);
  const { t } = useLanguage();
  const { settings, formatPrice } = useSiteSettings();
  const brandName = settings.siteName || "Kabob Places";

  // Memoize state to prevent unnecessary rerenders
  const state = useMemo(
    () => location.state as { orderNumber?: string; total?: number } | null,
    [location.state]
  );

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />

      {/* Thank You Modal Popup - Rendered Last for Top Z-Index */}
      {showThanksModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)' }}>
          <div
            className="bg-bg-2 border border-border rounded-2xl p-8 md:p-12 text-center max-w-[420px] w-full relative overflow-hidden"
            style={{ animation: 'pop-in .6s cubic-bezier(.34,1.56,.64,1)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--glow3))_0%,transparent_60%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-6 inline-block">
                <PartyPopper size={56} className="text-primary animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
              <h2 className="font-display text-2xl md:text-[1.8rem] font-extrabold mb-3 tracking-[-0.5px]">
                {t('success.thankYou')}
              </h2>
              <p className="text-txt-3 text-sm leading-relaxed mb-2">
                {t('success.appreciate')} {brandName}.
              </p>
              <p className="text-txt-4 text-[.85rem] mb-7">
                {t('success.enjoy')} 🎉
              </p>
              <button
                onClick={() => setShowThanksModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-primary to-accent text-[#071F07] text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--glow))] shadow-[0_4px_15px_hsl(var(--glow))]"
              >
                {t('success.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-bg pt-20 pb-32 md:pb-16 flex items-center justify-center px-4">
        <div className="max-w-[520px] w-full text-center">
          {/* Glow background */}
          <div className="relative">
            <div className="absolute inset-0 -top-20 bg-[radial-gradient(circle_at_center,hsl(var(--glow3))_0%,transparent_60%)] pointer-events-none" />

            <div className="relative rounded-3xl border border-border bg-bg-3 p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

              {/* Success Icon */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>

              {/* Celebration */}
              <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                <PartyPopper size={20} />
                <span className="text-[.68rem] font-bold uppercase tracking-[4px]">{t('success.confirmed')}</span>
                <PartyPopper size={20} />
              </div>

              <h1 className="font-display text-[1.6rem] md:text-[2rem] font-extrabold tracking-[-1px] mb-3">
                {t('success.heading')}
              </h1>

              <p className="text-txt-3 text-sm leading-[1.7] mb-6 max-w-[380px] mx-auto">
                {t('success.body')}
              </p>

              {/* Order Details Card */}
              {state?.orderNumber && (
                <div className="rounded-2xl border border-border bg-glass p-5 mb-6 text-left">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[.72rem] font-semibold uppercase tracking-[1.5px] text-txt-3">{t('success.orderNumber')}</span>
                      <span className="font-display font-bold text-primary tracking-wide">{state.orderNumber}</span>
                    </div>
                    {state.total != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[.72rem] font-semibold uppercase tracking-[1.5px] text-txt-3">{t('success.totalPaid')}</span>
                        <span className="font-display font-bold text-accent">{formatPrice(Number(state.total))}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Steps */}
              <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                {[
                  { icon: CheckCircle2, label: "Confirmed", active: true },
                  { icon: Clock, label: "Preparing", active: false },
                  { icon: MapPin, label: "On the Way", active: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[.66rem] font-semibold border ${step.active ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-border bg-glass text-txt-4"}`}>
                      <step.icon size={12} />
                      {step.label}
                    </div>
                    {i < 2 && <ArrowRight size={12} className="text-txt-4" />}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-primary to-accent text-[#071F07] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_hsl(var(--glow))] shadow-[0_4px_20px_hsl(var(--glow))]"
                >
                  <Home size={15} />
                  {t('success.backHome')}
                </Link>
                <Link
                  to="/#shop"
                  className="flex-1 py-3.5 rounded-xl border border-border bg-glass text-foreground text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-glass-2 hover:border-[hsl(var(--border2))]"
                >
                  {t('success.orderAgain')}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default OrderSuccess;
