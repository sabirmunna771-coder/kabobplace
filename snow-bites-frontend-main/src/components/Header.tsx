import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getApiAssetUrl } from '@/lib/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ShoppingCart } from 'lucide-react';
import kabobLogo from '@/assets/logo.webp';

interface HeaderProps {
  onCartOpen: () => void;
}

const Header = ({ onCartOpen }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/featured', label: t('nav.featured') },
    { href: '/menu', label: t('nav.menu') },
    { href: '/shop', label: t('nav.shop') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const brandName = settings.siteName?.trim() || 'Kabob Place';
  const brandParts = brandName.split(/\s+/);
  const brandFirst = brandParts.slice(0, -1).join(' ') || brandName;
  const brandLast = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';
  const headerLogoUrl = getApiAssetUrl(settings.logoSuite?.headerLogo || settings.siteLogo) || kabobLogo;

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-[1000] flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all duration-400"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 border-b border-border transition-opacity duration-400 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(7,31,7,.88)', backdropFilter: 'blur(24px) saturate(180%)' }}
      />

      {/* Logo */}
      <Link to="/" className="relative z-10 flex items-center gap-3 font-display font-extrabold text-lg md:text-xl tracking-tight hover:opacity-85 transition-opacity uppercase">
        <img
          src={headerLogoUrl}
          alt={brandName}
          onError={(e) => {
            e.currentTarget.src = kabobLogo;
          }}
          className="h-10 w-auto max-w-[48px] object-contain drop-shadow"
        />
        <span>
          {brandFirst} {brandLast && <span className="text-primary">{brandLast}</span>}
        </span>
      </Link>

      {/* Nav Links - desktop */}
      <nav className="hidden md:flex gap-1 bg-glass-2 border border-border rounded-full p-1 relative z-10">
        {navItems.map(item => (
          <Link
            key={item.href}
            to={item.href}
            className="text-xs font-medium text-txt-3 hover:text-foreground transition-all px-[16px] py-2 rounded-full whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Actions + Top-Right Language Switcher */}
      <div className="flex items-center gap-2 relative z-10">
        {isAuthenticated ? (
          <>
            <Link to="/account/dashboard" className="hidden md:inline-flex bg-glass-2 border border-border px-3.5 h-[42px] rounded-xl items-center text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all">
              {t('nav.account')}
            </Link>
            <button onClick={logout} className="hidden lg:inline-flex bg-glass-2 border border-border px-3.5 h-[42px] rounded-xl items-center text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all">
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <Link to="/login" className="hidden md:inline-flex bg-glass-2 border border-border px-3.5 h-[42px] rounded-xl items-center text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all">
            {t('nav.login')}
          </Link>
        )}

        <button
          onClick={onCartOpen}
          aria-label={t('nav.cart')}
          className="relative bg-glass-2 border border-border w-[42px] h-[42px] rounded-xl flex items-center justify-center text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all"
        >
          <ShoppingCart size={16} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[0.6rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-bg px-1">
              {totalItems}
            </span>
          )}
        </button>

        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Header;
