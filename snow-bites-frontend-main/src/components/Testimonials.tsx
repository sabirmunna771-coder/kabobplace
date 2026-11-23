import { useEffect, useState } from 'react';
import { testimonials } from '@/data/menu';
import { submitPublicReview, type ApiReview } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { MessageSquarePlus, Star } from 'lucide-react';

interface TestimonialsProps {
  reviews?: ApiReview[];
}

const Testimonials = ({ reviews }: TestimonialsProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setCustomerName(user?.fullName ?? '');
    setCustomerEmail(user?.email ?? '');
  }, [user]);

  const displayReviews = (reviews && reviews.length > 0)
    ? reviews.map((review) => ({
      name: review.customerName,
      initials: review.customerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      text: review.comment,
      rating: review.rating,
    }))
    : testimonials;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await submitPublicReview({
        customerName,
        customerEmail: customerEmail || undefined,
        rating,
        comment,
      });
      setMessage(response.message);
      setComment('');
      setRating(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Review submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-[clamp(60px,10vw,120px)] px-4 md:px-16 max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3.5 inline-flex items-center gap-3">
          <span className="w-5 h-px bg-primary" />{t('reviews.eyebrow')}<span className="w-5 h-px bg-primary" />
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold tracking-[-1px] mb-3.5">
          {t('reviews.title')} <span className="text-primary">{t('reviews.titleHighlight')}</span>
        </h2>
        <p className="text-txt-3 max-w-[520px] mx-auto text-sm">{t('reviews.subtitle')}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {displayReviews.map((review, i) => (
            <div key={`${review.name}-${i}`} className="bg-bg-3 border border-border rounded-xl p-7 relative transition-all hover:-translate-y-1 hover:border-primary/15 group">
              <span className="absolute top-3.5 right-5 font-display text-[4rem] text-primary opacity-[.12] leading-none">"</span>
              <div className="flex gap-[3px] mb-3.5 text-sm">
                {Array.from({ length: review.rating }).map((_, j) => <Star key={j} size={14} className="text-yellow-400" fill="currentColor" />)}
              </div>
              <p className="text-sm text-txt-2 leading-[1.7] mb-[18px] italic">{review.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-sm text-foreground">{review.initials}</div>
                <div>
                  <div className="font-semibold text-[.83rem]">{review.name}</div>
                  <div className="text-[.68rem] text-txt-3">{t('reviews.verified')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-bg-3 p-6 h-fit">
          <div className="mb-4 inline-flex items-center gap-2 text-primary">
            <MessageSquarePlus size={16} />
            <span className="text-sm font-semibold uppercase tracking-[3px]">{t('reviews.leaveReview')}</span>
          </div>
          <div className="space-y-3">
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder={t('reviews.namePlaceholder')} className="w-full rounded-lg bg-glass border border-border px-3 py-2 text-sm outline-none" />
            <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder={t('reviews.emailPlaceholder')} className="w-full rounded-lg bg-glass border border-border px-3 py-2 text-sm outline-none" />
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="w-full rounded-lg bg-glass border border-border px-3 py-2 text-sm outline-none">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value > 1 ? t('reviews.stars') : t('reviews.star')}</option>)}
            </select>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={`${t('reviews.commentPlaceholder')} (${settings.siteName || 'Kabob Places'})`} className="min-h-[130px] w-full rounded-lg bg-glass border border-border px-3 py-2 text-sm outline-none" />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            <button onClick={handleSubmit} disabled={submitting || !customerName || comment.trim().length < 10} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-50">
              <MessageSquarePlus size={15} />
              {submitting ? t('reviews.submitting') : t('reviews.submit')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
