import { Zap, Circle } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const defaultItems = ['HALAL FOOD', 'BROASTER', 'SHAWARMA', 'BURGERS', "GRILL'S PAKISTANI", 'PIZZAS', 'AGREGADOS', 'ZOFRI · IQUIQUE'];

const Marquee = () => {
  const { settings } = useSiteSettings();
  const items = settings.homepageCms?.marqueeItems?.length
    ? settings.homepageCms.marqueeItems
    : defaultItems;

  return (
    <div className="py-5 border-t border-b border-border overflow-hidden bg-[#0B3D0B]/60">
      <div className="flex gap-12" style={{ animation: 'marquee-scroll 35s linear infinite', width: 'max-content' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="font-display text-base font-bold text-txt-2 whitespace-nowrap flex items-center gap-3.5 uppercase tracking-[2px]">
            {item}
            {i === items.length - 1 || i === items.length * 2 - 1 ? (
              <Zap className="text-primary" size={15} />
            ) : (
              <Circle className="text-accent" size={8} fill="currentColor" strokeWidth={0} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
