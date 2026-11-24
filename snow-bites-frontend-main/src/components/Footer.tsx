import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Facebook, Instagram, MessageCircle, Heart } from 'lucide-react';
import { getApiAssetUrl, getCategories } from '@/lib/api';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import kabobLogo from '@/assets/logo.webp';

const Footer = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 60_000,
  });

  const brandName = settings.siteName?.trim() || 'Kabob Place';
  const brandParts = brandName.split(/\s+/);
  const brandFirst = brandParts.slice(0, -1).join(' ') || brandName;
  const brandLast = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';
  const footerLogoUrl = getApiAssetUrl(settings.logoSuite?.footerLogo || settings.siteLogo) || kabobLogo;
  const phone = settings.sitePhone || '+569 9103 0440';
  const address = settings.siteAddress || 'Dirección santa rosa de huara manzana D sitio 29 iquique';
  const hours = settings.contactHours || '11:00 AM - 11:00 PM';
  const whatsappDigits = (settings.whatsappNumber || phone).replace(/\D/g, '');
  const tagline = settings.footerTagline || 'Auténticos kabobs y comida rápida premium en el corazón de Iquique. Ingredientes frescos, sabor intenso y entrega veloz.';

  return (
    <footer className="bg-[#0B3D0B]/80 border-t border-border relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="max-w-[1280px] mx-auto px-4 md:px-16 pt-16 pb-24 grid grid-cols-1 md:grid-cols-[1.5fr_repeat(3,1fr)] gap-10">
        <div>
          <Link to="/" className="font-display text-2xl font-extrabold tracking-[-1px] inline-flex items-center gap-3 hover:opacity-85 transition-opacity uppercase">
            <img
              src={footerLogoUrl}
              alt={brandName}
              onError={(e) => {
                e.currentTarget.src = kabobLogo;
              }}
              className="h-10 w-auto object-contain drop-shadow"
            />
            <span>
              {brandFirst} {brandLast && <span className="text-primary">{brandLast}</span>}
            </span>
          </Link>
          <p className="text-txt-2 text-sm mt-3 max-w-[290px] leading-[1.7]">{tagline}</p>
          <div className="flex gap-2 mt-5">
            {settings.facebookUrl ? (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-[38px] h-[38px] rounded-[10px] bg-glass-2 border border-border flex items-center justify-center text-txt-3 hover:bg-primary hover:text-foreground hover:border-primary hover:-translate-y-[3px] transition-all text-sm">
                <Facebook size={16} strokeWidth={1.9} />
              </a>
            ) : null}
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-[38px] h-[38px] rounded-[10px] bg-glass-2 border border-border flex items-center justify-center text-txt-3 hover:bg-primary hover:text-foreground hover:border-primary hover:-translate-y-[3px] transition-all text-sm">
                <Instagram size={16} strokeWidth={1.9} />
              </a>
            ) : null}
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-[38px] h-[38px] rounded-[10px] bg-glass-2 border border-border flex items-center justify-center text-txt-3 hover:bg-[#25D366] hover:text-foreground hover:border-[#25D366] hover:-translate-y-[3px] transition-all text-sm">
              <MessageCircle size={16} strokeWidth={1.9} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[.72rem] uppercase tracking-[3px] text-txt-3 mb-[18px]">{t('footer.navigation')}</h4>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: t('nav.home'), href: '/' },
              { label: t('nav.featured'), href: '/featured' },
              { label: t('nav.menu'), href: '/menu' },
              { label: t('nav.shop'), href: '/shop' },
              { label: t('nav.contact'), href: '/contact' },
            ].map((link, j) => (
              <li key={j}><Link to={link.href} className="text-txt-3 text-sm hover:text-primary hover:translate-x-1 transition-all inline-block">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[.72rem] uppercase tracking-[3px] text-txt-3 mb-[18px]">{t('footer.categories')}</h4>
          <ul className="flex flex-col gap-2.5">
            {(categories.length > 0 ? categories.slice(0, 6) : [{ id: 1, name: 'Burgers', slug: 'burgers' }, { id: 2, name: 'Pizza', slug: 'pizza' }, { id: 3, name: 'Shawarma', slug: 'shawarma' }]).map((cat) => (
              <li key={cat.id}>
                <Link to="/menu" className="text-txt-3 text-sm hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[.72rem] uppercase tracking-[3px] text-txt-3 mb-[18px]">{t('footer.contact')}</h4>
          <ul className="flex flex-col gap-2.5">
            <li>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-txt-3 text-sm hover:text-primary transition-all inline-block">{phone}</a>
            </li>
            <li>
              <span className="text-txt-3 text-sm inline-block leading-relaxed">{address}</span>
            </li>
            <li>
              <span className="text-txt-3 text-sm inline-block">{hours}</span>
            </li>
            <li>
              <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="text-txt-3 text-sm hover:text-primary hover:translate-x-1 transition-all inline-block">{t('footer.whatsappUs')}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center py-5 border-t border-border text-txt-4 text-[.73rem]">
        © {new Date().getFullYear()} {brandName}. {t('footer.rights')} <span className="text-primary inline-flex align-middle mx-1"><Heart size={12} fill="currentColor" /></span> {t('footer.madeIn')}
      </div>
    </footer>
  );
};

export default Footer;
