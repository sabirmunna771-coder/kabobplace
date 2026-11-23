import heroBg from '@/assets/hero-bg.jpg';
import { useEffect, useMemo, useState } from 'react';
import { Flame, Menu, ShoppingBag } from 'lucide-react';
import type { ApiFlashSale, ApiHeroBanner } from '@/lib/api';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  banners?: ApiHeroBanner[];
  flashSale?: ApiFlashSale | null;
}

const Hero = ({ banners, flashSale }: HeroProps) => {
  const { settings } = useSiteSettings();
  const { t, language } = useLanguage();

  const brandName = settings.siteName?.trim() || 'KABOB PLACE';
  const cmsBanners = useMemo<ApiHeroBanner[]>(() => {
    const raw = settings.homepageCms?.heroBanners ?? [];
    return raw
      .filter((b) => b.isActive !== false && (b.title || b.imageUrl))
      .map((b, idx) => ({
        id: 10000 + idx,
        title: b.title || brandName,
        subtitle: b.subtitle || '',
        imageUrl: b.imageUrl || heroBg,
        ctaLabel: b.ctaLabel || t('hero.orderNow'),
        ctaHref: b.ctaHref || '#shop',
        isActive: true,
        sortOrder: b.sortOrder ?? idx,
        createdAt: settings.updatedAt,
        updatedAt: settings.updatedAt,
      }));
  }, [settings.homepageCms?.heroBanners, settings.updatedAt, brandName, t]);

  const fallbackBanner: ApiHeroBanner = useMemo(() => ({
    id: 0,
    title: brandName.toUpperCase(),
    subtitle: settings.footerTagline || t('hero.subtitle', 'Auténticos kabobs y comida rápida preparada al momento con ingredientes frescos — entrega veloz en Iquique.'),
    imageUrl: heroBg,
    ctaLabel: t('hero.orderNow'),
    ctaHref: '#shop',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [brandName, settings.footerTagline, t]);

  const slides = useMemo(() => {
    if (banners && banners.length > 0) return banners;
    if (cmsBanners.length > 0) return cmsBanners;
    return [fallbackBanner];
  }, [banners, cmsBanners, fallbackBanner]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlide = slides[activeIndex] ?? fallbackBanner;
  const titleWords = activeSlide.title.trim().split(/\s+/);
  const firstPart = titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') : activeSlide.title;
  const lastPart = titleWords.length > 1 ? titleWords[titleWords.length - 1] : '';

  const badgeText = language === 'es'
    ? (settings.homepageCms?.heroBadgeText || t('hero.delivering'))
    : t('hero.delivering');

  const stats = settings.homepageCms?.heroStats?.length
    ? settings.homepageCms.heroStats
    : [
        { num: '50+', label: t('hero.stat1Label') },
        { num: '2K+', label: t('hero.stat2Label') },
        { num: '30m', label: t('hero.stat3Label') },
      ];

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={activeSlide.imageUrl || heroBg} alt={activeSlide.title} className="w-full h-full object-cover transition-transform duration-700" style={{ filter: 'brightness(.28) saturate(1.3)', transform: 'scale(1.04)' }} width={1920} height={1080} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(7,31,7,.96) 0%, rgba(7,31,7,.65) 50%, rgba(7,31,7,.92) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 md:px-20 max-w-[780px] w-full">
        {/* Tag */}
        <div className="inline-flex items-center gap-2.5 bg-glass-2 border border-[hsl(var(--border2))] px-5 py-2 rounded-full text-xs text-txt-2 mb-8 backdrop-blur-[10px] relative overflow-hidden">
          <span className={`w-2 h-2 rounded-full relative flex-shrink-0 ${settings.storeStatus === 'CLOSED' ? 'bg-red-500' : 'bg-[#A0D000]'}`}>
            <span className={`absolute -inset-[3px] rounded-full border-[1.5px] animate-ping ${settings.storeStatus === 'CLOSED' ? 'border-red-500' : 'border-[#A0D000]'}`} />
          </span>
          {badgeText}
          <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent" style={{ animation: 'shimmer 4s ease infinite' }} />
        </div>

        {flashSale?.isLive ? (
          <div className="mb-5 ml-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur-md">
            <Flame size={14} className="text-primary" />
            {flashSale.name}: {flashSale.discountValue}{flashSale.discountType === 'PERCENTAGE' ? '%' : ` ${settings.currencySymbol}`} {t('hero.flashSale')}
          </div>
        ) : null}

        {/* Title */}
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold tracking-[-2px] leading-[.95] mb-2">
          <span className="block overflow-hidden">
            <span className="inline-block text-foreground" style={{ animation: 'title-reveal .9s cubic-bezier(.16,1,.3,1) .4s forwards', transform: 'translateY(115%)' }}>
              {firstPart}
            </span>
          </span>
          {lastPart && (
            <span className="block overflow-hidden">
              <span className="inline-block bg-gradient-to-r from-primary via-[#F6D34B] to-accent bg-clip-text text-transparent" style={{ animation: 'title-reveal .9s cubic-bezier(.16,1,.3,1) .65s forwards', transform: 'translateY(115%)' }}>
                {lastPart}
              </span>
            </span>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(.95rem,2.2vw,1.2rem)] text-txt-2 mt-5 mb-9 font-light max-w-[520px] opacity-0" style={{ animation: 'fade-up .8s cubic-bezier(.16,1,.3,1) .8s forwards', transform: 'translateY(24px)' }}>
          {activeSlide.subtitle || fallbackBanner.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3.5 opacity-0" style={{ animation: 'fade-up .8s cubic-bezier(.16,1,.3,1) 1s forwards', transform: 'translateY(24px)' }}>
          <a
            href={activeSlide.ctaHref || '#shop'}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(242,196,28,0.35)] hover:-translate-y-[2px] hover:scale-[1.02] active:translate-y-0 active:scale-[.98] transition-all relative overflow-hidden"
          >
            <ShoppingBag size={16} />
            {activeSlide.ctaLabel || t('hero.orderNow')}
          </a>
          <a
            href="#menu"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold bg-bg-3/90 text-foreground border border-border backdrop-blur-[10px] hover:bg-bg-4 hover:-translate-y-[2px] transition-all"
          >
            <Menu size={16} />
            {t('hero.exploreMenu')}
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-[clamp(24px,4vw,52px)] mt-14 pt-8 border-t border-border opacity-0" style={{ animation: 'fade-up .8s cubic-bezier(.16,1,.3,1) 1.2s forwards', transform: 'translateY(24px)' }}>
          {stats.map((s, idx) => (
            <div key={`${s.label}-${idx}`}>
              <div className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold bg-gradient-to-br from-foreground to-txt-2 bg-clip-text text-transparent">{s.num}</div>
              <div className="text-[.68rem] text-txt-3 uppercase tracking-[2px] mt-1">
                {language === 'es' ? s.label : t(`hero.stat${idx + 1}Label`, s.label)}
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 ? (
          <div className="mt-8 flex gap-2 opacity-0" style={{ animation: 'fade-up .8s cubic-bezier(.16,1,.3,1) 1.3s forwards', transform: 'translateY(24px)' }}>
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-10 bg-primary' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
