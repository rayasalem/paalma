
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, Role, MerchantProfile, Product, PRODUCT_CATEGORIES } from '../types';
import { marketStore } from '../store';
import { productService } from '../services/productService'; // Import Service
import { Language, translations } from '../translations';
import { getInternalCities, getInternalVillages } from '../services/flashlineService';
import { useToast } from '../components/ToastProvider';
import { userService } from '../services/userService';

interface ProfileViewProps {
  lang: Language;
  user: User;
  onRefresh: () => void;
  onViewProduct: (id: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ lang, user, onRefresh, onViewProduct }) => {
  const t = translations[lang];
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  
  const handleConfirmEmail = async () => {
    setIsVerifyingEmail(true);
    try {
        const res = await userService.confirmEmailManually(user.id);
        if (res.success) {
            showToast(lang === 'ar' ? 'تم تأكيد البريد الإلكتروني بنجاح' : 'Email confirmed successfully', 'success');
            onRefresh();
        } else {
            showToast(res.error || 'Failed to confirm email', 'error');
        }
    } catch (e) {
        showToast('Error confirming email', 'error');
    } finally {
        setIsVerifyingEmail(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProductUploading, setIsProductUploading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_ils: '',
    stock: '',
    category: '',
    image_url: '',
    is_bestseller: false
  });
  const [productFormError, setProductFormError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  // Products State
  const [myProducts, setMyProducts] = useState<Product[]>([]);

  const merchantProfile = user.role === Role.MERCHANT ? marketStore.getMerchantProfileByUserId(user.id) : null;
  
  // Hierarchical Location Data
  const cities = useMemo(() => getInternalCities(), []);
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(merchantProfile?.city_id);
  const availableVillages = useMemo(() => selectedCityId ? getInternalVillages(selectedCityId) : [], [selectedCityId]);

  // Fetch products on mount or update
  useEffect(() => {
    const fetchProducts = async () => {
        if (user.role === Role.MERCHANT) {
            const prods = await productService.getByMerchantId(user.id);
            setMyProducts(prods);
        }
    };
    fetchProducts();
  }, [user.id, user.role, marketStore.getProducts().length]); // Depend on store length for optimistic updates

  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    phone2: user.phone2 || '',
    city: user.city || '',
    bio: user.bio || '',
    profile_image: user.profile_image || '',
    business_name: merchantProfile?.business_name || '',
    business_description: merchantProfile?.business_description || '',
    business_address: merchantProfile?.business_address || '',
    village_id: merchantProfile?.village_id,
    city_id: merchantProfile?.city_id,
    region_id: merchantProfile?.region_id
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = parseInt(e.target.value);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setSelectedCityId(cityId);
      setFormData({
        ...formData,
        city_id: city.id,
        region_id: city.regionId,
        city: lang === 'en' ? city.nameEn : city.nameAr,
        village_id: undefined
      });
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = parseInt(e.target.value);
    setFormData({ ...formData, village_id: vId });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { url, error } = await marketStore.uploadImage(file, 'profiles');
    if (error) {
      showToast(error, 'info');
    } else if (url) {
      setFormData(prev => ({ ...prev, profile_image: url }));
    }
    setIsUploading(false);
  };

  const handleSave = () => {
    marketStore.updateUserProfile(user.id, {
      name: formData.name,
      phone: formData.phone,
      phone2: formData.phone2,
      city: formData.city,
      bio: formData.bio,
      profile_image: formData.profile_image
    });

    if (user.role === Role.MERCHANT && merchantProfile) {
      marketStore.updateMerchantProfile(user.id, {
        business_name: formData.business_name,
        business_description: formData.business_description,
        business_address: formData.business_address,
        logo_url: formData.profile_image || merchantProfile.logo_url,
        city_id: formData.city_id,
        village_id: formData.village_id,
        region_id: formData.region_id
      });
    }

    showToast(t.common.success, 'success');
    setIsEditing(false);
    onRefresh();
  };

  const handleProductImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProductUploading(true);
    const { url, error } = await marketStore.uploadImage(file, 'products');
    if (error) {
      setProductFormError(error);
    } else if (url) {
      setProductForm(prev => ({ ...prev, image_url: url }));
    }
    setIsProductUploading(false);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');

    if (!productForm.name || !productForm.description || !productForm.price_ils || !productForm.stock || !productForm.category || !productForm.image_url) {
      setProductFormError(t.common.validationError);
      return;
    }

    const priceNum = parseFloat(productForm.price_ils);
    const stockNum = parseInt(productForm.stock);

    const res = await marketStore.addProduct(user.id, {
      name: productForm.name,
      description: productForm.description,
      price_ils: priceNum,
      stock: stockNum,
      category: productForm.category,
      image_url: productForm.image_url,
      is_bestseller: productForm.is_bestseller
    });

    if (res.success) {
      showToast(t.common.productAdded, 'success');
      setIsAddingProduct(false);
      setProductForm({ name: '', description: '', price_ils: '', stock: '', category: '', image_url: '', is_bestseller: false });
      // Refresh local list
      if (res.data) setMyProducts(prev => [res.data!, ...prev]);
      onRefresh();
    } else {
      setProductFormError(res.error || 'Failed to add product');
    }
  };

  const filteredProducts = useMemo<Product[]>(() => {
    // If merchant, filter myProducts. If customer looking at their profile (unlikely scenario here but robust), filter store.
    let base = user.role === Role.MERCHANT ? myProducts : marketStore.getFilteredProducts({ searchTerm }) as Product[];
    
    // Apply local filter if needed
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        base = base.filter(p => p.name.toLowerCase().includes(term));
    }
    return base;
  }, [user.id, user.role, searchTerm, myProducts]);

  const groupedProducts = useMemo<Record<string, Product[]>>(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((p: Product) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const userImg = formData.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=1F5D42&color=fff&size=200`;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 overflow-x-hidden">
      
      {isAddingProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" onClick={() => setIsAddingProduct(false)}>
          <div className="bg-white rounded-3xl lg:rounded-[3rem] p-6 sm:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-10 animate-in zoom-in-95 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingProduct(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center transition-all">✕</button>
            <div className="text-center md:text-left rtl:md:text-right pt-4 sm:pt-0">
               <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.common.addProduct}</h3>
            </div>
            <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
               <div className="space-y-6">
                  {productFormError && <p className="bg-rose-50 text-rose-600 p-4 rounded-xl text-[10px] font-black uppercase text-center">{productFormError}</p>}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.common.productName} *</label>
                    <input required className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Premium Wireless Speaker" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.common.category || 'Category'} *</label>
                    <select 
                      required 
                      className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-bold outline-none appearance-none cursor-pointer"
                      value={productForm.category} 
                      onChange={e => setProductForm({...productForm, category: e.target.value})}
                    >
                      <option value="" disabled>Select Category...</option>
                      {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.common.description} *</label>
                    <textarea required className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-medium h-32 outline-none resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-black outline-none" value={productForm.price_ils} onChange={e => setProductForm({...productForm, price_ils: e.target.value})} placeholder="Price" />
                    <input required type="number" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 font-black outline-none" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} placeholder="Stock" />
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">{lang === 'en' ? 'Product Media' : 'صور المنتج'} *</label>
                    <div onClick={() => !isProductUploading && productImgInputRef.current?.click()} className={`aspect-square rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all ${isProductUploading ? 'opacity-50' : 'hover:border-palma-green'}`}>
                      {productForm.image_url ? <img src={productForm.image_url} className="w-full h-full object-cover" /> : 
                        <div className="text-center p-8">
                           <span className="text-4xl block mb-2">{isProductUploading ? '⌛' : '📸'}</span>
                           <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{isProductUploading ? 'Cloud Sync...' : 'Product Image'}</p>
                        </div>
                      }
                      <input type="file" ref={productImgInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleProductImgChange} />
                    </div>
                  </div>
                  <button type="submit" disabled={isProductUploading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-palma-green transition-all active:scale-95 disabled:opacity-50">
                    Launch Product Live →
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Verification Section */}
      {!user.emailVerified && user.role !== Role.ADMIN && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">⚠️</div>
              <div>
                 <h3 className="text-lg font-black text-amber-900">{lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Confirm Your Email'}</h3>
                 <p className="text-sm font-medium text-amber-700/80">{lang === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك بالكامل.' : 'Please confirm your email address to fully activate your account.'}</p>
              </div>
           </div>
           <button 
             onClick={handleConfirmEmail} 
             disabled={isVerifyingEmail}
             className="bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
           >
             {isVerifyingEmail ? (lang === 'ar' ? 'جاري التأكيد...' : 'Confirming...') : (lang === 'ar' ? 'تأكيد الآن' : 'Confirm Now')}
           </button>
        </div>
      )}

      {user.emailVerified && user.role !== Role.ADMIN && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
           <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">✅</div>
           <div>
              <h3 className="text-sm font-black text-emerald-900">{lang === 'ar' ? 'البريد الإلكتروني مؤكد' : 'Email Confirmed'}</h3>
              <p className="text-xs font-medium text-emerald-700/80">{user.email}</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl lg:rounded-[3rem] p-6 sm:p-10 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 lg:gap-12">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-palma-green/5 rounded-full -mr-24 -mt-24"></div>
        <div className="relative group shrink-0">
          <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-3xl lg:rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50">
            <img src={userImg} className="w-full h-full object-cover" alt={user.name} />
          </div>
          {isEditing && (
            <button onClick={() => !isUploading && fileInputRef.current?.click()} className={`absolute inset-0 bg-black/40 text-white flex items-center justify-center rounded-3xl lg:rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Change Logo'}</span>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left rtl:md:text-right relative z-10">
          <div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
               <span className="bg-palma-green/10 text-palma-green px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{user.role} Dashboard</span>
               {user.isApproved && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">✓ Approved</span>}
            </div>
            <h1 className="text-[22px] sm:text-[30px] lg:text-[40px] font-black text-slate-900 tracking-tight leading-tight">
              {isEditing ? <input name="name" className="bg-slate-50 border-none rounded-xl px-4 py-1 w-full" value={formData.name} onChange={handleInputChange} /> : user.name}
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.common.balance}</p>
               <p className="text-lg font-black text-palma-green">₪{user.balance?.toFixed(0) || '0'}</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{user.role === Role.MERCHANT ? 'Inventory' : 'Endorsed'}</p>
               <p className="text-lg font-black text-slate-900">{user.role === Role.MERCHANT ? myProducts.length : marketStore.getSharedProducts(user.id).length}</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank</p>
               <p className="text-lg font-black text-indigo-600">Gold</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
               <p className="text-lg font-black text-slate-900">{user.registration_date ? new Date(user.registration_date).getFullYear() : new Date().getFullYear()}</p>
             </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
           {user.role === Role.MERCHANT && <button onClick={() => setIsAddingProduct(true)} className="bg-palma-green text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3"><span>➕</span> {t.common.addProduct}</button>}
           {!isEditing ? <button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase hover:brightness-110 transition-all shadow-xl">Edit Profile</button> :
             <><button onClick={handleSave} className="bg-palma-green text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase hover:brightness-110 shadow-xl">Save Changes</button>
               <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-400 px-8 py-4 rounded-2xl text-[10px] font-black uppercase">Cancel</button></>
           }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t.common.editProfile}</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.auth.phone}</label>
                   <input name="phone" disabled={!isEditing} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-palma-green outline-none" value={formData.phone} onChange={handleInputChange} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 px-1">{lang === 'en' ? 'Bio' : 'النبذة التعريفية'}</label>
                   <textarea name="bio" disabled={!isEditing} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium h-24 focus:ring-2 focus:ring-palma-green outline-none resize-none" value={formData.bio} onChange={handleInputChange} />
                 </div>

                 {user.role === Role.MERCHANT && (
                   <>
                     <div className="pt-4 border-t border-slate-50 space-y-4">
                        <p className="text-[10px] font-black uppercase text-palma-green tracking-widest">Business Information</p>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.auth.businessName}</label>
                          <input name="business_name" disabled={!isEditing} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-palma-green outline-none" value={formData.business_name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 px-1">{lang === 'ar' ? 'مقر المتجر الرئيسي' : 'Store Origin HQ'} *</label>
                           <select 
                            disabled={!isEditing}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none appearance-none"
                            onChange={handleCityChange}
                            value={selectedCityId || ''}
                           >
                            <option value="">{lang === 'ar' ? 'اختر المدينة...' : 'Select City...'}</option>
                            {cities.map(c => (
                              <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>
                            ))}
                           </select>
                           <select 
                            disabled={!isEditing || !selectedCityId}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none disabled:opacity-50 appearance-none"
                            onChange={handleVillageChange}
                            value={formData.village_id || ''}
                           >
                            <option value="">{lang === 'ar' ? 'اختر المنطقة...' : 'Select Area...'}</option>
                            {availableVillages.map(v => (
                              <option key={v.id} value={v.id}>{lang === 'ar' ? v.nameAr : v.nameEn}</option>
                            ))}
                           </select>
                           <input name="business_address" placeholder="Store full street address" disabled={!isEditing} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-palma-green outline-none" value={formData.business_address} onChange={handleInputChange} />
                        </div>
                     </div>
                   </>
                 )}
              </div>
           </div>
        </div>

        {/* Content Area */}
        <main className="lg:col-span-2 space-y-10">
           {Object.keys(groupedProducts).length === 0 ? <div className="bg-white p-16 rounded-3xl border text-center">No products found</div> :
             <div className="space-y-12">
               {Object.entries(groupedProducts).map(([cat, prods]) => (
                 <div key={cat} className="space-y-6">
                   <div className="flex items-center gap-4 px-2"><h2 className="text-xl font-black text-slate-900 uppercase">{cat}</h2><div className="h-px flex-1 bg-slate-100"></div></div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(prods as Product[]).map(p => (
                        <div key={p.id} onClick={() => onViewProduct(p.id)} className="bg-white rounded-[2rem] p-4 border border-slate-100 hover:shadow-xl transition-all group cursor-pointer flex flex-col h-full">
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
              </div>
               ))}
             </div>
           }
        </main>
      </div>
    </div>
  );
};

export default ProfileView;
