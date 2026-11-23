import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Featured from '@/components/Featured';
import MenuSection from '@/components/MenuSection';
import Shop from '@/components/Shop';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';
import { getPublicDeals, getPublicMarketingContent } from '@/lib/api';
import { AlertTriangle, BellRing, Flame, Megaphone, Sparkles } from 'lucide-react';

const Index = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { settings, formatPrice } = useSiteSettings();
  const { t } = useLanguage();
  const marketingQuery = useQuery({
    queryKey: ['public-marketing-content'],
    queryFn: getPublicMarketingContent,
  });
  const dealsQuery = useQuery({
    queryKey: ['public-deals'],
    queryFn: getPublicDeals,
  });

  const marketing = marketingQuery.data;
  const activeDeals = (dealsQuery.data?.deals ?? []).filter((deal) => deal.isActive && !deal.isExpired);
  const enabledSections = settings.homepageCms?.enabledSections ?? {};
  const showHero = enabledSections.hero !== false;
  const showMarquee = enabledSections.marquee !== false;
  const showFeatured = enabledSections.featured !== false;
  const showMenu = enabledSections.menu !== false;
  const showShop = enabledSections.shop !== false;
  const showSpecialOffers = enabledSections.specialOffers !== false;
  const showTestimonials = enabledSections.testimonials !== false;
  const showContact = enabledSections.contact !== false;

  return (
    <>
      <div className="min-h-screen">
        <Header onCartOpen={() => setCartOpen(true)} />
        {settings.storeStatus === 'CLOSED' ? (
          <div className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-center text-xs md:text-sm text-amber-100 mt-16">
            <span className="inline-flex items-center gap-2 font-medium">
              <AlertTriangle size={14} className="text-amber-300" />
              {t('store.closedBanner')}
            </span>
          </div>
        ) : null}

        {marketing?.announcement ? (
          <div className={`sticky ${settings.storeStatus === 'CLOSED' ? 'top-0' : 'top-16'} z-[950] border-b border-primary/20 bg-gradient-to-r from-primary/15 via-[#0B3D0B]/90 to-primary/15 px-4 py-3 backdrop-blur-xl`}>
            <div className="mx-auto flex max-w-[1280px] flex-col gap-2 text-sm text-foreground md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2">
                <Megaphone size={14} className="text-primary" />
                <span>{marketing.announcement.text}</span>
              </div>
              {marketing.announcement.ctaLabel && marketing.announcement.ctaHref ? (
                <a href={marketing.announcement.ctaHref} className="text-xs font-semibold uppercase tracking-[2px] text-primary hover:text-accent">
                  {marketing.announcement.ctaLabel}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {marketing?.notifications?.length ? (
          <section className="px-4 pt-20 md:px-16">
            <div className="mx-auto grid max-w-[1280px] gap-3 md:grid-cols-2 xl:grid-cols-3">
              {marketing.notifications.slice(0, 3).map((notification) => (
                <article key={notification.id} className="rounded-2xl border border-border bg-bg-3/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,.18)] backdrop-blur-md">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[3px] text-primary">
                    {notification.kind === 'DEAL_OF_DAY' ? <Flame size={13} /> : <BellRing size={13} />}
                    {notification.kind.replace(/_/g, ' ')}
                  </div>
                  <h3 className="font-display text-lg">{notification.title}</h3>
                  <p className="mt-1 text-sm text-txt-2">{notification.message}</p>
                  {notification.ctaLabel && notification.ctaHref ? <a href={notification.ctaHref} className="mt-3 inline-flex text-sm font-semibold text-primary hover:text-accent">{notification.ctaLabel}</a> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showHero ? <Hero banners={marketing?.banners} flashSale={marketing?.flashSale} /> : null}
        {showMarquee ? <Marquee /> : null}
        {showFeatured ? <Featured /> : null}

        {showSpecialOffers && activeDeals.length > 0 ? (
          <section id="deals" className="py-[clamp(48px,8vw,96px)] px-4 md:px-16 max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
                <span className="w-5 h-px bg-primary" />{t('deals.eyebrow')}<span className="w-5 h-px bg-primary" />
              </div>
              <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
                {t('deals.title')} <span className="text-primary">{t('deals.titleHighlight')}</span>
              </h2>
              <p className="text-txt-3 max-w-[520px] mx-auto text-sm">{t('deals.subtitle')}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activeDeals.map((deal) => (
                <div key={deal.id} className="rounded-2xl border border-primary/25 bg-gradient-to-br from-bg-3 via-bg-3 to-primary/5 p-6 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[.68rem] font-semibold uppercase tracking-[2px] text-primary mb-3">
                      <Sparkles size={12} /> {t('deals.eyebrow')}
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{deal.name}</h3>
                    {deal.description ? <p className="text-sm text-txt-3 mb-4">{deal.description}</p> : null}
                    {deal.items?.length ? (
                      <div className="mb-4 text-xs text-txt-2 space-y-1">
                        <div className="uppercase tracking-[2px] text-[.62rem] text-txt-4 font-semibold">{t('deals.includes')}</div>
                        {deal.items.map((item) => (
                          <div key={item.id}>• {item.quantity}x {item.productName}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="font-display text-2xl font-extrabold text-primary">{formatPrice(deal.price)}</span>
                    <a href="#shop" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:brightness-105 active:scale-95 shadow-sm transition-all">
                      {t('deals.orderCombo')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {showMenu ? <MenuSection /> : null}
        {showShop ? <Shop /> : null}
        {showTestimonials ? <Testimonials reviews={marketing?.reviews} /> : null}
        {showContact ? <Contact /> : null}
        <Footer />
        <BottomNav onCartOpen={() => setCartOpen(true)} />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </>
  );
};

export default Index;
