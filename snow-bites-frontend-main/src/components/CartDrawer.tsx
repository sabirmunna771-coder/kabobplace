import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { Plus, Minus, ShoppingCart, X, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const { t } = useLanguage();
  const { formatPrice } = useSiteSettings();
  const navigate = useNavigate();

  const handleProceedToCheckout = useCallback(() => {
    onClose();
    navigate('/checkout');
  }, [navigate, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[2000] transition-all duration-[400ms] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-[min(420px,100vw)] sm:w-[min(420px,92vw)] bg-bg-2 z-[2001] transition-transform duration-500 flex flex-col border-l border-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(.16,1,.3,1)' }}
      >
        {/* Header */}
        <div className="px-6 py-[22px] flex items-center justify-between border-b border-border flex-shrink-0">
          <h3 className="font-display text-[1.1rem] flex items-center gap-2.5">
            {t('cart.title')}
            <span className="bg-primary text-primary-foreground text-[.62rem] py-[3px] px-2.5 rounded-full font-bold">{totalItems}</span>
          </h3>
          <button onClick={onClose} className="w-[38px] h-[38px] rounded-xl bg-glass-2 border border-border text-txt-2 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground hover:rotate-90 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="mb-4 opacity-20 inline-flex"><ShoppingCart size={52} /></div>
              <p className="text-txt-3 text-sm">{t('cart.empty')}</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3.5 p-4 bg-bg-3 border border-border rounded-lg mb-2.5 transition-all hover:bg-bg-4 hover:border-border2" style={{ animation: 'fade-up .4s cubic-bezier(.16,1,.3,1)' }}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</div>
                  <div className="text-primary font-bold text-[.88rem] mt-[3px] font-display">{formatPrice(item.price * item.quantity)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-[26px] h-[26px] bg-bg-4 border border-border text-foreground flex items-center justify-center text-xs font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"><Minus size={12} /></button>
                    <span className="w-[22px] text-center font-bold text-[.78rem] font-head">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-[26px] h-[26px] bg-bg-4 border border-border text-foreground flex items-center justify-center text-xs font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"><Plus size={12} /></button>
                    <button onClick={() => removeItem(item.id)} className="text-txt-4 text-[.68rem] ml-auto px-2 py-1 font-semibold tracking-[.5px] uppercase hover:text-destructive transition-colors">{t('cart.remove')}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-[22px] border-t border-border flex-shrink-0 bg-bg-2">
          <div className="flex justify-between mb-2 text-[.83rem] text-txt-2">
            <span>{t('cart.subtotal')}</span><span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-[18px] text-lg font-bold">
            <span>{t('cart.total')}</span><span className="text-primary font-display font-extrabold text-xl">{formatPrice(subtotal)}</span>
          </div>
          <button
            onClick={handleProceedToCheckout}
            disabled={items.length === 0}
            className="w-full py-[17px] rounded-lg bg-primary text-primary-foreground text-sm font-bold transition-all hover:brightness-105 active:scale-[.98] disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(242,196,28,0.35)] relative overflow-hidden"
          >
            <ArrowRight size={15} />
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
