import { MapPin, Phone, Clock3, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLanguage } from '@/context/LanguageContext';

const Contact = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();

  const address = settings.siteAddress || 'Dirección santa rosa de huara manzana D sitio 29 iquique';
  const phone = settings.sitePhone || '+569 9103 0440';
  const whatsappDigits = (settings.whatsappNumber || phone).replace(/\D/g, '');
  const hours = settings.contactHours || '11:00 AM - 11:00 PM';
  const mapUrl = settings.mapEmbedUrl || 'https://www.google.com/maps?q=Santa+Rosa+de+Huara+Manzana+D+Sitio+29+Iquique+Chile&output=embed';

  return (
    <section id="contact" className="py-[clamp(60px,10vw,120px)] px-4 md:px-16 max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
          <span className="w-5 h-px bg-primary" />{t('contact.eyebrow')}<span className="w-5 h-px bg-primary" />
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
          {t('contact.title')} <span className="text-primary">{t('contact.titleHighlight')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {[
          { icon: MapPin, title: t('contact.addressTitle'), lines: [address] },
          { icon: Phone, title: t('contact.phoneTitle'), lines: [phone] },
          { icon: Clock3, title: t('contact.hoursTitle'), lines: [hours, t('contact.hoursSubtitle')] },
        ].map((c, i) => (
          <div key={i} className="bg-bg-3 border border-border rounded-xl p-8 text-center transition-all hover:-translate-y-1.5 hover:border-primary/15 hover:shadow-[0_12px_40px_rgba(0,0,0,.3)] relative overflow-hidden group">
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform" />
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-[18px] shadow-[0_8px_24px_hsl(var(--glow2))]">
              <c.icon size={24} strokeWidth={2} />
            </div>
            <h4 className="text-base mb-1.5 font-display">{c.title}</h4>
            {c.lines.map((l, j) => <p key={j} className="text-txt-3 text-sm leading-relaxed">{l}</p>)}
          </div>
        ))}
      </div>

      <div className="flex gap-3.5 justify-center flex-wrap mt-10">
        <a href={`tel:${phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold bg-gradient-to-br from-primary to-accent text-foreground shadow-[0_4px_20px_hsl(var(--glow))] hover:-translate-y-[3px] transition-all relative overflow-hidden">
          <Phone size={16} />
          {t('contact.callNow')}
        </a>
        <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold bg-[#25D366] text-foreground shadow-[0_4px_20px_rgba(37,211,102,.3)] hover:-translate-y-[3px] transition-all relative overflow-hidden">
          <MessageCircle size={16} />
          {t('contact.whatsappOrder')}
        </a>
      </div>

      <div className="mt-12 rounded-xl overflow-hidden border border-border h-[280px]">
        <iframe
          src={mapUrl}
          className="w-full h-full border-none"
          style={{ filter: 'grayscale(.7) brightness(.75) contrast(1.2)' }}
          loading="lazy"
          title={`${settings.siteName} Location`}
        />
      </div>
    </section>
  );
};

export default Contact;
