
import React, { useState, useEffect, useCallback } from 'react';
import { marketStore } from '../store';
import { productService } from '../services/productService'; // Import Service
import { Product } from '../types';
import Logo from '../components/Logo';
import { translations } from '../translations';
import { ArrowRight, ShoppingCart, Search, Filter } from 'lucide-react';

interface PublicCatalogProps {
  onBack: () => void;
  onProductClick: (id: string) => void;
  onLoginClick: () => void;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({ onBack, onProductClick, onLoginClick }) => {
  const lang = document.documentElement.dir === 'ltr' ? 'en' : 'ar';
  const t = translations[lang];

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [merchantId, setMerchantId] = useState<string>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  
  // List States
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Load auxiliary static data
  const categories = marketStore.getAllUniqueCategories();
  const merchants = marketStore.getAllApprovedMerchants();

  // Sync with URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setSearchTerm(params.get('q')!);
    if (params.get('minP')) setMinPrice(params.get('minP')!);
    if (params.get('maxP')) setMaxPrice(params.get('maxP')!);
    if (params.get('minR')) setMinRating(parseInt(params.get('minR')!));
    if (params.get('sort')) setSortBy(params.get('sort')!);
    if (params.get('merchant')) setMerchantId(params.get('merchant')!);
    if (params.get('category')) setCategoryId(params.get('category')!);
  }, []);

  // Fetch and Filter
  const fetchAndFilterProducts = useCallback(async () => {
    setIsLoading(true);
    
    try {
        // Ensure we have the latest data from cloud/db
        await productService.getAll();
        
        // Filter locally (now that local cache is synced via productService.getAll())
        const data = marketStore.getFilteredProducts({
            searchTerm,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            minRating,
            sortBy,
            merchantId,
            categoryId
        });
        
        setFilteredProducts(data);
    } catch (e) {
        console.error("Error fetching catalog", e);
    } finally {
        setIsLoading(false);
    }
  }, [searchTerm, minPrice, maxPrice, minRating, sortBy, merchantId, categoryId]);

  // Execute fetch on state change
  useEffect(() => {
    fetchAndFilterProducts();
  }, [fetchAndFilterProducts]);

  const resetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSortBy('newest');
    setMerchantId('all');
    setCategoryId('all');
  };

  const removeFilter = (key: string) => {
    switch (key) {
      case 'merchant': setMerchantId('all'); break;
      case 'category': setCategoryId('all'); break;
      case 'rating': setMinRating(0); break;
      case 'price': setMinPrice(''); setMaxPrice(''); break;
      case 'search': setSearchTerm(''); break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-palma-text" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400 group">
               <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rtl:group-hover:translate-x-1" />
            </button>
            <div onClick={onBack} className="cursor-pointer"><Logo size="small" /></div>
          </div>
          <button onClick={onLoginClick} className="bg-palma-navy text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-palma-primary transition shadow-md shadow-palma-navy/10 uppercase tracking-wider">
             {t.auth.login}
          </button>
        </div>
      </nav>

      <main className="pt-8 pb-20 px-4 sm:px-8 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-8 sticky top-28 h-fit animate-slide-up">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-palma-navy">{t.common.filters}</h3>
              <button onClick={resetFilters} className="text-[10px] font-black uppercase text-palma-primary hover:underline tracking-widest">
                {t.common.resetFilters}
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.common.merchantName}</p>
              <select 
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-palma-primary focus:bg-white transition-all cursor-pointer"
              >
                <option value="all">{t.common.allMerchants}</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{marketStore.getMerchantNameByUserId(m.id)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.common.category}</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setCategoryId('all')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${categoryId === 'all' ? 'bg-palma-navy text-white border-palma-navy shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-palma-primary'}`}
                >
                  {t.common.allCategories}
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategoryId(cat)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${categoryId === cat ? 'bg-palma-navy text-white border-palma-navy shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-palma-primary'}`}
                  >
                    {t.categories[cat as keyof typeof t.categories] || cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.common.priceRange}</p>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder={t.common.minPrice}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-palma-primary focus:bg-white transition-all"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder={t.common.maxPrice}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-palma-primary focus:bg-white transition-all"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.common.minRating}</p>
              <div className="space-y-2">
                {[4, 3, 2].map(stars => (
                  <button 
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${minRating === stars ? 'bg-palma-accent text-white border-palma-accent shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xs ${s <= stars ? (minRating === stars ? 'text-white' : 'text-palma-accent') : (minRating === stars ? 'text-white/40' : 'text-slate-200')}`}>★</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase">{stars} {t.common.starsAndAbove}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Catalog Content */}
        <div className="flex-1 space-y-8 min-w-0 animate-fade-in">
          
          {/* Top Bar (Search + Sort) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-card flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className={`absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
              <input 
                type="text" 
                placeholder={t.common.search}
                className={`w-full pr-14 pl-6 py-4 rounded-2xl border border-transparent bg-slate-50 focus:bg-white focus:ring-2 focus:ring-palma-primary outline-none text-sm font-bold text-palma-navy transition-all`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
               <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 md:w-56 bg-slate-50 border border-transparent rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-palma-primary cursor-pointer text-palma-navy appearance-none"
              >
                <option value="newest">{t.common.newest}</option>
                <option value="most_sold">{t.common.mostSold}</option>
                <option value="popularity">{t.common.mostPopular}</option>
                <option value="rating_desc">{t.common.topRated}</option>
                <option value="price_asc">{t.common.priceLowHigh}</option>
                <option value="price_desc">{t.common.priceHighLow}</option>
              </select>
              
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden p-4 bg-palma-navy rounded-2xl text-white shadow-md"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-2">
            {(merchantId !== 'all' || categoryId !== 'all' || minRating > 0 || (minPrice || maxPrice) || searchTerm) && (
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">{t.common.activeFilters}:</span>
            )}
            {merchantId !== 'all' && (
              <button onClick={() => removeFilter('merchant')} className="flex items-center gap-2 bg-palma-primary/10 text-palma-primary px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-palma-primary/20 transition-all">
                {marketStore.getMerchantNameByUserId(merchantId)} ✕
              </button>
            )}
            {categoryId !== 'all' && (
              <button onClick={() => removeFilter('category')} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                {t.categories[categoryId as keyof typeof t.categories] || categoryId} ✕
              </button>
            )}
            {minRating > 0 && (
              <button onClick={() => removeFilter('rating')} className="flex items-center gap-2 bg-palma-accent/10 text-palma-accent px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-palma-accent/20 transition-all">
                {minRating}★+ ✕
              </button>
            )}
            {(minPrice || maxPrice) && (
              <button onClick={() => removeFilter('price')} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                {minPrice || '0'} - {maxPrice || '∞'} ₪ ✕
              </button>
            )}
            {searchTerm && (
              <button onClick={() => removeFilter('search')} className="flex items-center gap-2 bg-palma-navy text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                "{searchTerm}" ✕
              </button>
            )}
          </div>

          <div className="flex justify-between items-center px-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              {t.common.showingResults.replace('{count}', filteredProducts.length.toString())}
            </p>
            {isLoading && (
               <div className="flex items-center gap-3">
                 <div className="w-3.5 h-3.5 border-2 border-palma-primary border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-[9px] font-black text-palma-primary uppercase tracking-widest">Updating...</span>
               </div>
            )}
          </div>

          <div className="relative min-h-[400px]">
            {isLoading && filteredProducts.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center rounded-3xl z-10">
                  <div className="w-10 h-10 border-4 border-palma-primary border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-32 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                <span className="text-6xl block mb-6 grayscale opacity-50">🏜️</span>
                <h3 className="text-2xl font-black text-palma-navy mb-3">{t.common.noProducts}</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-8">{t.common.tryAdjusting}</p>
                <button onClick={resetFilters} className="px-10 py-4 bg-palma-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-palma-primary/20 hover:scale-105 transition-all">{t.common.clearFilters}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {filteredProducts.map(p => {
                  const mName = marketStore.getMerchantNameByUserId(p.merchant_id || '');
                  const { average, count } = marketStore.getProductRating(p.id);
                  const displayImage = p.images?.[0] || p.imageUrl || p.image_url || 'https://placehold.co/400x400?text=No+Image';
                  
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => onProductClick(p.id)}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-hover transition-all duration-500 group cursor-pointer flex flex-col h-full hover:-translate-y-2"
                    >
                      <div className="aspect-square overflow-hidden bg-slate-50 relative m-4 rounded-2xl">
                        <img src={displayImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                        
                        <div className={`absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-sm font-black shadow-lg text-palma-navy`}>
                          ₪{p.price || p.price_ils}
                        </div>

                        {average >= 4.5 && count >= 1 && (
                          <div className={`absolute top-4 right-4 bg-palma-accent text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg`}>
                            ⭐ {t.common.topRated}
                          </div>
                        )}
                        
                        <div className={`absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg border border-slate-100`}>
                          <span className="text-[10px] font-black text-palma-navy">{count > 0 ? average.toFixed(1) : '0.0'}</span>
                          <span className={`text-xs ${count > 0 ? 'text-palma-accent' : 'text-slate-200'}`}>★</span>
                          <span className="text-[8px] font-bold text-slate-400 opacity-60">({count})</span>
                        </div>
                      </div>
                      
                      <div className="px-6 pb-6 pt-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-slate-50 px-2.5 py-1 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                            {t.categories[p.category as keyof typeof t.categories] || p.category}
                          </span>
                        </div>
                        <h4 className="font-black text-palma-navy mb-2 text-lg tracking-tight group-hover:text-palma-primary transition-colors leading-tight line-clamp-2">{p.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                          {t.common.merchantName}: <span className="text-palma-navy">{mName}</span>
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-palma-soft flex items-center justify-center text-xs font-black text-palma-navy shadow-sm border border-slate-100">
                                {mName.charAt(0)}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{t.common.verified}</span>
                           </div>
                           <div className="w-9 h-9 rounded-full bg-palma-navy text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 shadow-lg">
                              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md lg:hidden animate-fade-in">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 space-y-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight text-palma-navy">{t.common.filters}</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-palma-navy hover:bg-slate-200 transition">✕</button>
            </div>
            {/* Filter Content */}
            <div className="space-y-8">
              {/* ... Same content as sidebar ... */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.common.category}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCategoryId('all')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${categoryId === 'all' ? 'bg-palma-navy text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>{t.common.allCategories}</button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryId(cat)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${categoryId === cat ? 'bg-palma-navy text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>{t.categories[cat as keyof typeof t.categories] || cat}</button>
                  ))}
                </div>
              </div>
              {/* Other filters... similar structure to desktop sidebar */}
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={resetFilters} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest">
                {t.common.resetFilters}
              </button>
              <button onClick={() => setIsMobileFilterOpen(false)} className="flex-[2] py-5 bg-palma-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-palma-primary/20">
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
