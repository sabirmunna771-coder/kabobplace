import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopComponent from "@/components/Shop";
import CartDrawer from "@/components/CartDrawer";
import { useLanguage } from "@/context/LanguageContext";

const Shop = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />

      <main className="min-h-screen bg-bg pt-20 pb-32 md:pb-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-16">
          {/* Page Title */}
          <div className="mb-10">
            <div className="text-[.68rem] uppercase tracking-[6px] text-primary font-semibold mb-3 inline-flex items-center gap-3">
              <span className="w-5 h-px bg-primary" />
              {t('shop.eyebrow')}
              <span className="w-5 h-px bg-primary" />
            </div>
            <h1 className="font-display text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold tracking-[-1px]">
              {t('shop.title')} <span className="text-primary">{t('shop.titleHighlight')}</span>
            </h1>
            <p className="text-txt-3 mt-3 max-w-[600px] leading-[1.7]">
              {t('shop.subtitle')}
            </p>
          </div>

          {/* Shop Section */}
          <ShopComponent />
        </div>
      </main>

      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Shop;
