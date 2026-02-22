
import React, { useEffect, useState } from 'react';
import { productService } from '../services/productService'; // Import Service
import { Product } from '../types';
import Logo from './Logo';
import { Language, translations } from '../translations';
import ComingSoonHero from './ComingSoonHero';
import { ShoppingBag, TrendingUp, Store } from 'lucide-react';

interface PublicWebsiteProps {
  lang: Language;
  toggleLang: () => void;
  onLoginClick: () => void;
  onJoinMerchant: () => void;
  onJoinBroker: () => void;
  onExploreProducts: () => void;
  onViewProduct?: (id: string) => void;
}

const PublicWebsite: React.FC<PublicWebsiteProps> = ({ 
  lang, toggleLang, onLoginClick, onJoinMerchant, onJoinBroker, onExploreProducts, onViewProduct 
}) => {
  const t = translations[lang];
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      // Use productService to get real data (from cloud if connected)
      const all = await productService.getAll();
      setProducts(all.slice(0, 4));
    };
    fetchFeatured();
  }, []);

  return (
    <div className="bg-palma-soft font-sans text-palma-text overflow-x-hidden min-h-screen flex flex-col" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Navbar - Fixed positioning to ensure it stays at the top */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white/90 backdrop-blur-xl z-[100] border-b border-slate-100 shadow-sm h-20 transition-all duration-300">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <Logo size="medium" />
            <div className="flex items-center gap-4 sm:gap-6">
               <button onClick={toggleLang} className="text-[10px] font-black uppercase text-palma-muted hover:text-palma-primary transition tracking-widest">{lang === 'en' ? 'العربية' : 'English'}</button>
               <div className="w-px h-5 bg-slate-200"></div>
               <button onClick={onLoginClick} className="text-sm font-bold text-palma-navy hover:text-palma-primary transition">{t.nav.login}</button>
               <button onClick={onJoinMerchant} className="bg-palma-navy text-white px-5 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black shadow-lg shadow-palma-navy/20 hover:bg-palma-primary transition-all hidden sm:block tracking-wide">{t.hero.join}</button>
            </div>
         </div>
      </nav>

      {/* Main Content - Added padding-top to account for fixed navbar height (h-20 = 5rem) */}
      <main className="flex-1 w-full pt-20">
        
        {/* Hero Section */}
        <ComingSoonHero 
          lang={lang} 
          onJoinMerchant={onJoinMerchant}
          onExploreProducts={onExploreProducts}
          onRegister={onLoginClick}
        />

        {/* Stats */}
        <section className="bg-white py-16 sm:py-24 border-y border-slate-100 relative z-10">
           <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                 <div className="text-center group cursor-default">
                    <div className="text-4xl sm:text-5xl font-black text-palma-navy mb-3 group-hover:scale-110 transition-transform duration-500 group-hover:text-palma-primary">500+</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-muted">{t.roles.merchant}</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl sm:text-5xl font-black text-palma-navy mb-3 group-hover:scale-110 transition-transform duration-500 group-hover:text-palma-primary">10k+</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-muted">Products</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl sm:text-5xl font-black text-palma-navy mb-3 group-hover:scale-110 transition-transform duration-500 group-hover:text-palma-primary">50k+</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-muted">{t.roles.customer}</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl sm:text-5xl font-black text-palma-navy mb-3 group-hover:scale-110 transition-transform duration-500 group-hover:text-palma-primary">1M+</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-muted">Visits</div>
                 </div>
              </div>
           </div>
        </section>

        {/* New About Section */}
        <section className="py-24 bg-white relative overflow-hidden border-b border-slate-100">
          <div className="absolute top-0 left-0 w-full h-full bg-palma-soft/50 -skew-y-3 transform origin-top-left z-0 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
               <span className="text-palma-primary font-black uppercase tracking-widest text-[10px] bg-palma-primary/5 px-4 py-2 rounded-full border border-palma-primary/10">
                 {t.landing.aboutSubtitle}
               </span>
               <h2 className="text-4xl md:text-5xl font-black text-palma-navy tracking-tight">
                 {t.landing.aboutTitle}
               </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Feature 1 - Merchant */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                  <div className="w-16 h-16 bg-palma-soft rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                     <Store className="w-8 h-8 text-palma-navy" />
                  </div>
                  <h3 className="text-xl font-black text-palma-navy mb-3">{t.landing.features.merchantTitle}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{t.landing.features.merchantDesc}</p>
               </div>

               {/* Feature 2 - Broker (Highlighted) */}
               <div className="bg-palma-navy p-8 rounded-[2.5rem] shadow-2xl hover:shadow-palma-navy/40 transition-all duration-300 group text-white relative overflow-hidden hover:-translate-y-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md relative z-10 group-hover:scale-110 transition-transform ring-1 ring-white/10">
                     <TrendingUp className="w-8 h-8 text-palma-green" />
                  </div>
                  <h3 className="text-xl font-black mb-3 relative z-10">{t.landing.features.brokerTitle}</h3>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed relative z-10">{t.landing.features.brokerDesc}</p>
               </div>

               {/* Feature 3 - Customer */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                  <div className="w-16 h-16 bg-palma-soft rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                     <ShoppingBag className="w-8 h-8 text-palma-navy" />
                  </div>
                  <h3 className="text-xl font-black text-palma-navy mb-3">{t.landing.features.customerTitle}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{t.landing.features.customerDesc}</p>
               </div>
            </div>
          </div>
        </section>

        {/* Featured Preview Section */}
        <section className="py-24 sm:py-32 bg-palma-soft">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-6">
              <h2 className="text-4xl lg:text-5xl font-black text-palma-navy tracking-tight">
                {t.common.featured}
              </h2>
              <div className="w-16 h-1.5 bg-palma-primary mx-auto rounded-full"></div>
              <p className="text-palma-muted font-bold uppercase text-xs tracking-[0.25em]">{t.common.featuredSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(p => {
                // Determine images
                const mainImage = p.images?.[0] || p.imageUrl || p.image_url || 'https://placehold.co/400x400?text=No+Image';
                const secondImage = p.images?.[1];

                return (
                  <div key={p.id} className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-50 mb-5 relative">
                      <img 
                        src={mainImage} 
                        className={`w-full h-full object-cover transition-all duration-700 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-110'}`} 
                        alt={p.name} 
                      />
                      {secondImage && (
                        <img 
                          src={secondImage} 
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                          alt={`${p.name} alternate`} 
                        />
                      )}
                      
                      <div className={`absolute top-4 ${lang === 'en' ? 'right-4' : 'left-4'} bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black shadow-lg text-palma-navy`}>
                        ₪{p.price || p.price_ils}
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <p className="text-[9px] font-black text-palma-primary uppercase tracking-widest mb-2 bg-palma-primary/5 px-2 py-1 rounded w-fit">{p.category}</p>
                      <h4 className="font-black text-palma-navy mb-6 text-lg tracking-tight truncate">{p.name}</h4>
                      <button onClick={() => onViewProduct && onViewProduct(p.id)} className="w-full py-3.5 bg-palma-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-palma-primary transition-all shadow-xl shadow-palma-navy/10 active:scale-95">
                        {t.common.details}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className={`space-y-6 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
            <Logo size="medium" />
            <p className="text-palma-muted text-sm font-medium leading-relaxed max-w-xs">
              {t.footer.about}
            </p>
          </div>
          <div className={`space-y-6 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-navy">{t.footer.links}</h5>
            <ul className="space-y-3 text-xs font-bold text-palma-muted">
              <li onClick={onJoinMerchant} className="hover:text-palma-primary cursor-pointer transition-colors hover:translate-x-1 duration-300 inline-block">{t.nav.merchant}</li>
              <li onClick={onJoinBroker} className="hover:text-palma-primary cursor-pointer transition-colors hover:translate-x-1 duration-300 block">{t.nav.broker}</li>
              <li className="hover:text-palma-primary cursor-pointer transition-colors hover:translate-x-1 duration-300 block">{t.nav.contact}</li>
            </ul>
          </div>
          <div className={`space-y-6 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-palma-navy">{t.nav.contact}</h5>
            <p className="text-sm font-bold text-palma-primary hover:underline cursor-pointer">office@palma.ps</p>
            <p className="text-sm font-bold text-palma-muted">Ramallah, Palestine</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-16 mt-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-palma-muted uppercase tracking-widest">© {new Date().getFullYear()} Palma Marketplace. All rights reserved.</p>
            <div className="flex gap-8 text-[9px] font-black uppercase text-palma-muted/60">
                <span className="hover:text-palma-navy cursor-pointer transition-colors">{t.footer.privacy}</span>
                <span className="hover:text-palma-navy cursor-pointer transition-colors">{t.footer.terms}</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
