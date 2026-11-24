import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getProducts } from '@/lib/api';
import { Plus, Flame, Leaf, Award } from 'lucide-react';

const Featured = () => {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { formatPrice } = useSiteSettings();
  const { data: featuredItems = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => getProducts({ featured: true }),
    refetchInterval: 30_000,
  });

  if (featuredItems.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="py-[clamp(60px,10vw,120px)] px-4 md:px-16 max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
          <span className="w-5 h-px bg-primary" />{t('featured.eyebrow')}<span className="w-5 h-px bg-primary" />
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
          {t('featured.title')} <span className="text-primary">{t('featured.titleHighlight')}</span>
        </h2>
        <p className="text-txt-3 max-w-[520px] mx-auto text-sm">{t('featured.subtitle')}</p>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {featuredItems.map(item => (
          <div key={item.id} className="flex-shrink-0 w-[clamp(260px,30vw,300px)] snap-start bg-bg-3 border border-border rounded-xl overflow-hidden transition-all duration-[450ms] hover:-translate-y-2 hover:border-primary/20 hover:shadow-[0_20px_60px_rgba(0,0,0,.4)] group relative">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-glow-3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[1] pointer-events-none" />

            <div className="h-[200px] overflow-hidden relative">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-110" loading="lazy" width={512} height={512} />
              <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-bg-3 to-transparent" />
              {item.badge && (
                <span className="absolute top-3.5 left-3.5 bg-[rgba(7,31,7,.85)] backdrop-blur-[10px] text-accent py-1.5 px-3.5 rounded-full text-[.66rem] font-bold z-[2] border border-accent/20 tracking-[.5px] uppercase">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="p-5 relative z-[2]">
              <div className="text-[.68rem] text-txt-3 uppercase tracking-[2px] mb-1.5">{item.category}</div>
              <h3 className="font-head font-bold text-[1.08rem] mb-1">{item.name}</h3>
              {(item.isSpicy || item.isVegetarian || item.bestSeller) && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.isSpicy && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[.6rem] font-semibold text-red-300 uppercase tracking-[1px]"><Flame size={10} />{t('featured.spicy')}</span>}
                  {item.isVegetarian && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[.6rem] font-semibold text-emerald-300 uppercase tracking-[1px]"><Leaf size={10} />{t('featured.veg')}</span>}
                  {item.bestSeller && <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[.6rem] font-bold text-primary uppercase tracking-[1px]"><Award size={10} />{t('featured.bestseller')}</span>}
                </div>
              )}
              {item.description && <p className="text-[.76rem] text-txt-3 mb-3.5">{item.description}</p>}
              <div className="flex items-center justify-between">
                <span className="font-display text-[1.3rem] font-extrabold text-primary">{formatPrice(item.price)}</span>
                <button
                  onClick={() => addItem(item)}
                  aria-label={t('shop.addToCart')}
                  className="w-11 h-11 rounded-[14px] bg-primary text-primary-foreground flex items-center justify-center font-bold transition-all hover:scale-[1.1] hover:brightness-105 active:scale-90 shadow-[0_4px_16px_rgba(242,196,28,0.35)] relative overflow-hidden"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Featured;
