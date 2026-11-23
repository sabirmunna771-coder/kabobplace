import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getCategories, getProducts } from '@/lib/api';
import { Search, ShoppingCart, Flame, Leaf, Award } from 'lucide-react';

const Shop = () => {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { formatPrice } = useSiteSettings();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('default');
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
  const filterCategories = [{ id: 'all', name: t('shop.allItems') }, ...categories.map((item) => ({ id: item.slug, name: item.name }))];

  const filtered = useMemo(() => {
    let items = products.filter(i => {
      const matchCat = activeCategory === 'all' || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    if (sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
    if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [products, search, activeCategory, sort]);

  return (
    <section id="shop" className="py-[clamp(60px,10vw,120px)] px-4 md:px-16 max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
          <span className="w-5 h-px bg-primary" />{t('shop.eyebrow')}<span className="w-5 h-px bg-primary" />
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
          {t('shop.title')} <span className="text-primary">{t('shop.titleHighlight')}</span>
        </h2>
        <p className="text-txt-3 max-w-[520px] mx-auto text-sm">{t('shop.subtitle')}</p>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-3 flex-wrap mb-6 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            placeholder={t('shop.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-3.5 px-[18px] pl-12 rounded-lg bg-bg-3 border border-border text-foreground text-sm font-body transition-all focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] outline-none placeholder:text-txt-4"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-3"><Search size={16} /></span>
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="py-3.5 px-[18px] pr-10 rounded-lg bg-bg-3 border border-border text-txt-2 text-sm font-body cursor-pointer transition-all outline-none appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E6E80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 14px) center' }}
        >
          <option value="default">{t('shop.sortDefault')}</option>
          <option value="price-asc">{t('shop.sortPriceAsc')}</option>
          <option value="price-desc">{t('shop.sortPriceDesc')}</option>
          <option value="name">{t('shop.sortName')}</option>
        </select>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 sm:flex-wrap mb-6 scrollbar-hide px-1">
        {filterCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-2 px-5 rounded-full text-[.74rem] font-semibold whitespace-nowrap transition-all uppercase tracking-[.5px] border ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground font-bold border-transparent shadow-[0_4px_16px_rgba(242,196,28,0.35)]'
                : 'bg-bg-3 border-border text-txt-2 hover:text-foreground hover:bg-bg-4'
            }`}
          >
            <span className="relative z-[1]">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 max-md:gap-3">
        {filtered.map(item => (
          <div key={item.id} className="bg-bg-3 border border-border rounded-xl overflow-hidden transition-all duration-[400ms] hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_16px_48px_rgba(0,0,0,.45)] group relative flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left z-[2]" />

            <div className="h-[170px] max-md:h-[130px] overflow-hidden relative">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.08]" loading="lazy" width={512} height={512} />
              <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-bg-3 to-transparent" />
            </div>

            <div className="p-3.5 sm:p-[18px] flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[.93rem] mb-1 leading-snug">{item.name}</h3>
                <div className="text-[.66rem] text-accent uppercase tracking-[1.5px] font-semibold mb-2">{item.category}</div>
                {(item.isSpicy || item.isVegetarian || item.bestSeller) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.isSpicy && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[.6rem] font-semibold text-red-300 uppercase tracking-[1px]"><Flame size={10} />{t('featured.spicy')}</span>}
                    {item.isVegetarian && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[.6rem] font-semibold text-emerald-300 uppercase tracking-[1px]"><Leaf size={10} />{t('featured.veg')}</span>}
                    {item.bestSeller && <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[.6rem] font-bold text-primary uppercase tracking-[1px]"><Award size={10} />{t('featured.bestseller')}</span>}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-lg font-extrabold text-primary">{formatPrice(item.price)}</span>
                </div>
                <button
                  onClick={() => addItem(item)}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all hover:brightness-105 active:scale-[.97] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(242,196,28,0.3)]"
                >
                  <ShoppingCart size={14} />
                  <span>{t('shop.addToCart')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Shop;
