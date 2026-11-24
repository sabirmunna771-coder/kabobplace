import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getCategories, getProducts } from '@/lib/api';
import { Utensils, Beef, Pizza, Soup, CookingPot, WrapText, Drumstick, Flame, Leaf, Award, CupSoda, type LucideIcon } from 'lucide-react';

const categoryIconBySlug: Record<string, LucideIcon> = {
  broaster: Drumstick,
  shawarma: WrapText,
  burgers: Beef,
  'grills-pakistani': Flame,
  pizzas: Pizza,
  pizza: Pizza,
  agregados: Utensils,
  chinese: Soup,
  noodles: CookingPot,
  sides: Drumstick,
  kabobs: Flame,
  balti: Utensils,
  drinks: CupSoda,
};

const MenuSection = () => {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { formatPrice } = useSiteSettings();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    refetchInterval: 30_000,
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    refetchInterval: 30_000,
  });
  const [activeTab, setActiveTab] = useState('');

  const normalizedCategories = useMemo(() => categories.map((category) => ({ id: category.slug, label: category.name })), [categories]);
  const currentTab = activeTab || normalizedCategories[0]?.id || '';
  const activeCat = normalizedCategories.find((category) => category.id === currentTab);
  const activeItems = products.filter((product) => product.category === currentTab);

  return (
    <section id="menu" className="py-[clamp(60px,10vw,120px)] px-4 md:px-16 max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
          <span className="w-5 h-px bg-primary" />{t('menu.eyebrow')}<span className="w-5 h-px bg-primary" />
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
          {t('menu.title')} <span className="text-primary">{t('menu.titleHighlight')}</span>
        </h2>
        <p className="text-txt-3 max-w-[520px] mx-auto text-sm">{t('menu.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 sm:flex-wrap sm:justify-center mb-10 scrollbar-hide px-1">
        {normalizedCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-5 py-2.5 rounded-full text-[.78rem] font-semibold whitespace-nowrap transition-all relative overflow-hidden border ${
              currentTab === cat.id
                ? 'bg-primary text-primary-foreground font-bold border-transparent shadow-[0_4px_20px_rgba(242,196,28,0.35)] -translate-y-0.5'
                : 'bg-bg-3 border-border text-txt-2 hover:text-foreground hover:bg-bg-4'
            }`}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              {(() => {
                const Icon = categoryIconBySlug[cat.id] ?? Utensils;
                return <Icon size={14} />;
              })()}
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeCat && (
        <div key={activeCat.id} style={{ animation: 'category-in .5s cubic-bezier(.16,1,.3,1)' }}>
          <div className="flex items-center gap-3.5 mb-5 pb-3.5 border-b border-border">
            <div className="w-11 h-11 bg-primary text-primary-foreground rounded-[13px] flex items-center justify-center text-xl shadow-[0_4px_14px_rgba(242,196,28,0.3)]">
              {(() => {
                const Icon = categoryIconBySlug[activeCat.id] ?? Utensils;
                return <Icon size={18} strokeWidth={2.2} />;
              })()}
            </div>
            <h3 className="text-lg font-display">{activeCat.label}</h3>
          </div>

          {activeItems.length === 0 ? (
            <div className="py-10 text-center bg-bg-3/40 border border-border/60 rounded-[14px] px-4">
              <p className="text-txt-3 text-sm font-medium">Platos próximamente disponibles en esta categoría.</p>
              <p className="text-txt-4 text-xs mt-1">Los administradores pueden agregar productos desde el panel de catálogo.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {activeItems.map((item) => (
                <div key={item.dbId} className="flex items-center py-3.5 px-3 sm:px-[18px] bg-bg-3 border border-border rounded-[10px] transition-all hover:bg-bg-4 hover:border-border2 hover:translate-x-1 gap-2 sm:gap-3">
                  <span className="flex-1 font-medium text-xs sm:text-sm">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    {item.isSpicy && <span className="inline-flex items-center gap-0.5 text-red-400" title={t('featured.spicy')}><Flame size={13} /></span>}
                    {item.isVegetarian && <span className="inline-flex items-center gap-0.5 text-emerald-400" title={t('featured.veg')}><Leaf size={13} /></span>}
                    {item.bestSeller && <span className="inline-flex items-center gap-0.5 text-primary" title={t('featured.bestseller')}><Award size={13} /></span>}
                  </div>
                  {item.badge ? <span className="hidden sm:inline text-[.65rem] uppercase tracking-[1px] text-accent font-semibold">{item.badge}</span> : null}
                  <span className="font-bold text-primary font-display text-sm min-w-[70px] text-right px-1 sm:px-2">{formatPrice(item.price)}</span>
                  <button
                    onClick={() => addItem(item)}
                    className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[.72rem] font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm shrink-0"
                  >
                    {t('menu.add')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MenuSection;
