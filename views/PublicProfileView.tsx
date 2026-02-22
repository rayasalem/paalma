
import React, { useState, useEffect } from 'react';
import { marketStore } from '../store';
import { User, Role, Product } from '../types';
import Logo from '../components/Logo';
import { Language, translations } from '../translations';
import { ArrowLeft, UserPlus, Check, MapPin, Store, TrendingUp } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

interface PublicProfileViewProps {
  lang: Language;
  currentUser: User | null;
  profileId: string;
  onBack: () => void;
  onProductClick: (id: string) => void;
  onLoginClick: () => void;
  toggleLang: () => void;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ lang, currentUser, profileId, onBack, onProductClick, onLoginClick, toggleLang }) => {
  const t = translations[lang];
  const { showToast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const profileUser = marketStore.getUserById(profileId);
  const merchantProfile = profileUser?.role === Role.MERCHANT ? marketStore.getMerchantProfileByUserId(profileId) : null;
  
  const products = marketStore.getProducts().filter(p => p.merchant_id === profileId || p.merchantId === profileId);
  const sharedProducts = marketStore.getSharedProducts(profileId); // For Brokers

  useEffect(() => {
    if (profileUser) {
      setFollowerCount(marketStore.getFollowersCount(profileUser.id));
      if (currentUser) {
        setIsFollowing(marketStore.isFollowing(currentUser.id, profileUser.id));
      }
    }
  }, [profileUser, currentUser]);

  const handleFollowToggle = () => {
    if (!currentUser) return onLoginClick();
    if (currentUser.role !== Role.CUSTOMER) {
      showToast(lang === 'en' ? 'Only customers can follow.' : 'فقط الزبائن يمكنهم المتابعة.', 'warning');
      return;
    }
    if (currentUser.id === profileId) return;

    if (isFollowing) {
      marketStore.unfollowUser(currentUser.id, profileId);
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
      showToast(lang === 'en' ? 'Unfollowed' : 'تم إلغاء المتابعة', 'info');
    } else {
      const success = marketStore.followUser(currentUser.id, profileId);
      if (success) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        showToast(lang === 'en' ? 'Following!' : 'تمت المتابعة!', 'success');
      }
    }
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-xl text-center max-w-md w-full">
           <span className="text-4xl block mb-4">🔍</span>
           <h3 className="text-xl font-black text-slate-900 mb-2">User Not Found</h3>
           <button onClick={onBack} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  const profileImg = profileUser.profile_image || profileUser.logoUrl || `https://ui-avatars.com/api/?name=${profileUser.name}&background=1F5D42&color=fff&size=200`;
  const bannerColor = profileUser.role === Role.MERCHANT ? 'bg-palma-primary' : 'bg-slate-900';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Navbar (Only if not logged in or in public view mode) */}
      {!currentUser && (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div onClick={onBack} className="cursor-pointer"><Logo size="small" /></div>
            <div className="flex items-center gap-4">
               <button onClick={toggleLang} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">{lang === 'en' ? 'العربية' : 'English'}</button>
               <button onClick={onLoginClick} className="bg-palma-navy text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-palma-primary transition-all shadow-lg shadow-palma-navy/20">{t.auth.login}</button>
            </div>
          </div>
        </nav>
      )}

      {currentUser && (
         <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-palma-navy mb-4">
               <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.common.back}
            </button>
         </div>
      )}

      <main className="pb-32 px-4 sm:px-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-card border border-slate-100 mb-10">
           <div className={`h-40 ${bannerColor} relative`}>
              <div className="absolute inset-0 bg-black/10"></div>
           </div>
           
           <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row gap-6 items-start -mt-16">
                 <div className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-lg overflow-hidden bg-slate-100 shrink-0">
                    <img src={profileImg} className="w-full h-full object-cover" alt={profileUser.name} />
                 </div>
                 
                 <div className="flex-1 pt-2 md:pt-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <h1 className="text-3xl font-black text-slate-900 leading-tight">{profileUser.name}</h1>
                             {profileUser.isApproved && <span className="text-blue-500 text-lg" title="Verified">✓</span>}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                             <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> {profileUser.role === Role.MERCHANT ? 'Merchant Store' : 'Broker Portfolio'}</span>
                             {profileUser.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {profileUser.city}</span>}
                             <span className="text-palma-primary">{followerCount} {lang === 'en' ? 'Followers' : 'متابع'}</span>
                          </div>
                       </div>

                       <button 
                         onClick={handleFollowToggle}
                         className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${isFollowing ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-palma-primary text-white hover:bg-emerald-800'}`}
                       >
                          {isFollowing ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          {isFollowing ? (lang === 'en' ? 'Following' : 'تتابع') : (lang === 'en' ? 'Follow' : 'متابعة')}
                       </button>
                    </div>

                    {(profileUser.bio || merchantProfile?.business_description) && (
                       <p className="mt-6 text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                          {profileUser.bio || merchantProfile?.business_description}
                       </p>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Content Section */}
        {profileUser.role === Role.MERCHANT && (
           <div className="space-y-8">
              <h2 className="text-2xl font-black text-slate-900 px-2">{t.common.products} ({products.length})</h2>
              {products.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                    <p className="text-slate-400 font-bold">{t.common.noProducts}</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(p => (
                       <div key={p.id} onClick={() => onProductClick(p.id)} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
                          <div className="aspect-square rounded-[1.5rem] bg-slate-50 overflow-hidden mb-4 relative">
                             <img src={p.images?.[0] || p.imageUrl || p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm">₪{p.price || p.price_ils}</div>
                          </div>
                          <div className="px-2 pb-2">
                             <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{p.name}</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.categories[p.category as keyof typeof t.categories] || p.category}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

        {profileUser.role === Role.BROKER && (
           <div className="space-y-8">
              <h2 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-2"><TrendingUp className="w-6 h-6" /> {lang === 'en' ? 'Endorsed Products' : 'المنتجات الموصى بها'}</h2>
              {sharedProducts.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                    <p className="text-slate-400 font-bold">No endorsements yet.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-6">
                    {sharedProducts.map(s => {
                       const p = marketStore.getProducts().find(prod => prod.id === s.product_id);
                       if (!p) return null;
                       return (
                          <div key={s.id} onClick={() => onProductClick(p.id)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer flex gap-6 items-center">
                             <div className="w-24 h-24 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                                <img src={p.images?.[0] || p.imageUrl || p.image_url} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-lg mb-1">{p.name}</h4>
                                {s.marketing_title && <p className="text-sm font-medium text-palma-primary italic">"{s.marketing_title}"</p>}
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.marketing_description}</p>
                             </div>
                             <div className="hidden sm:block">
                                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-palma-green transition-all">{t.common.viewDetails}</button>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>
        )}

      </main>
    </div>
  );
};

export default PublicProfileView;
