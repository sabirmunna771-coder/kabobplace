import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Home, Menu, ShoppingBag, ShoppingCart, ShieldCheck, LogIn } from 'lucide-react';

interface BottomNavProps {
  onCartOpen: () => void;
}

const BottomNav = ({ onCartOpen }: BottomNavProps) => {
  const { totalItems } = useCart();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const items = [
    { icon: Home, label: t('nav.home'), href: '#home' },
    { icon: Menu, label: t('nav.menu'), href: '#menu' },
    { icon: ShoppingBag, label: t('nav.shop'), href: '#shop' },
    { icon: ShoppingCart, label: t('nav.cart'), href: '#', onClick: onCartOpen, badge: totalItems },
    { icon: isAdmin ? ShieldCheck : LogIn, label: isAdmin ? t('nav.admin') : t('nav.login'), to: isAdmin ? '/admin' : '/login' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-[72px] z-[1000] flex justify-around items-center px-1"
      style={{ background: 'rgba(7,31,7,.95)', backdropFilter: 'blur(24px) saturate(180%)', borderTop: '1px solid hsl(var(--border))' }}
    >
      {items.map(item => {
        const Icon = item.icon;
        return item.to ? (
        <Link
          key={item.label}
          to={item.to}
          className="flex flex-col items-center gap-1 text-txt-2 text-[.58rem] font-semibold tracking-[.5px] uppercase py-2 px-3 relative transition-all hover:text-primary no-underline active:scale-95"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Icon size={18} strokeWidth={1.9} />
          {item.label}
        </Link>
      ) : (
        <a
          key={item.label}
          href={item.onClick ? undefined : item.href}
          onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
          className="flex flex-col items-center gap-1 text-txt-2 text-[.58rem] font-semibold tracking-[.5px] uppercase py-2 px-3 relative transition-all hover:text-primary no-underline active:scale-95"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Icon size={18} strokeWidth={1.9} />
          {item.label}
          {item.badge ? (
            <span className="absolute top-[2px] right-1 bg-primary text-primary-foreground text-[.5rem] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold px-1 border border-bg">
              {item.badge}
            </span>
          ) : null}
        </a>
      );})}
    </nav>
  );
};

export default BottomNav;
