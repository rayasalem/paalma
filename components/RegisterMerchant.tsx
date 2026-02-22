
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, Role } from '../types';
import { userService } from '../services/userService';
import { storageService } from '../services/storageService';
import { translations } from '../translations';
import Logo from './Logo';
import { getInternalCities, getInternalVillages } from '../services/flashlineService';
import { useToast } from './ToastProvider';
import { Mail, CheckCircle, RefreshCcw } from 'lucide-react';

interface RegisterMerchantProps {
  onRegister: (user: User) => void;
  onBackToLogin: () => void;
}

const RegisterMerchant: React.FC<RegisterMerchantProps> = ({ onRegister, onBackToLogin }) => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const { showToast } = useToast();

  useEffect(() => {
    setLang(document.documentElement.lang === 'en' ? 'en' : 'ar');
  }, []);
  
  const t = translations[lang];

  // UI State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    logo_url: '',
  });
  
  // Location State
  const cities = useMemo(() => getInternalCities(), []);
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(undefined);
  const [selectedVillageId, setSelectedVillageId] = useState<number | undefined>(undefined);
  const [selectedRegionId, setSelectedRegionId] = useState<number | undefined>(undefined);
  
  const availableVillages = useMemo(() => selectedCityId ? getInternalVillages(selectedCityId) : [], [selectedCityId]);

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = parseInt(e.target.value);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setSelectedCityId(cityId);
      setSelectedRegionId(city.regionId);
      setSelectedVillageId(undefined); 
    } else {
      setSelectedCityId(undefined);
      setSelectedRegionId(undefined);
      setSelectedVillageId(undefined);
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVillageId(parseInt(e.target.value));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
    try {
      const path = `merchant_logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const url = await storageService.uploadFile(file, 'profiles', path);
      
      setFormData(prev => ({ ...prev, logo_url: url }));
      showToast(lang === 'en' ? 'Logo uploaded successfully' : 'تم رفع الشعار بنجاح', 'success');
    } catch (err) {
      const msg = lang === 'en' ? 'Failed to upload image' : 'فشل رفع الصورة';
      setError(msg);
      showToast(msg, 'error');
    }
    
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.business_name || !formData.owner_name || !formData.email || !formData.phone || !selectedCityId || !selectedVillageId || !formData.password) {
      const msg = lang === 'en' ? 'All fields marked * are required including location' : 'جميع الحقول المطلوبة * يجب ملؤها بما في ذلك الموقع';
      setError(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }

    const cityObj = cities.find(c => c.id === selectedCityId);
    const cityName = cityObj ? (lang === 'en' ? cityObj.nameEn : cityObj.nameAr) : '';

    const newUser: User = {
      id: '', // Service generates valid UUID
      name: formData.business_name, 
      email: formData.email,
      phone: formData.phone,
      city: cityName, 
      logoUrl: formData.logo_url,
      role: Role.MERCHANT,
      status: 'PENDING', // Initially pending
      isApproved: false,
      approved_at: undefined,
      createdAt: Date.now(),
      companyName: formData.business_name
    };

    const result = await userService.register(newUser, formData.password, {
        city_id: selectedCityId,
        village_id: selectedVillageId,
        region_id: selectedRegionId,
        owner_name: formData.owner_name,
        business_name: formData.business_name
    });

    if (result.success) {
      if (result.data) {
        showToast(t.common.success, 'success');
        onRegister(result.data.user);
      }
    } else {
      const msg = result.error || (lang === 'en' ? 'Registration failed' : 'فشل التسجيل');
      setError(msg);
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-2xl w-full bg-white p-12 rounded-[2rem] shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <Logo size="medium" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">{t.auth.joinMerchant}</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-2">{t.auth.merchantSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className={`space-y-6 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
              {error && <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl text-center uppercase">{error}</div>}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.businessName} *</label>
                  <input required name="business_name" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none" value={formData.business_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.ownerName} *</label>
                  <input required name="owner_name" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none" value={formData.owner_name} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.storeLogo}</label>
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-4 bg-slate-50 transition-all cursor-pointer min-h-[140px] ${isUploading ? 'opacity-50' : 'hover:bg-slate-100 hover:border-palma-primary'}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                  {formData.logo_url ? (
                    <div className="flex flex-col items-center">
                      <img src={formData.logo_url} className="w-24 h-24 rounded-2xl object-cover shadow-md mb-2" alt="Logo preview" />
                      <span className="text-[9px] font-black uppercase text-slate-400">{t.auth.clickToChange}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">{isUploading ? '⌛' : '🏢'}</span>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {isUploading ? t.common.uploading : t.auth.uploadLogo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.email} *</label>
                <input required type="email" name="email" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none" value={formData.email} onChange={handleChange} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.phone} *</label>
                  <input required name="phone" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none" placeholder="05x-xxxxxxx" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.city} *</label>
                  <select 
                    required 
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none appearance-none"
                    onChange={handleCityChange}
                    value={selectedCityId || ''}
                  >
                    <option value="">{lang === 'en' ? 'Select City...' : 'اختر المدينة...'}</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{lang === 'en' ? c.nameEn : c.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-500">{lang === 'en' ? 'Area / Village' : 'المنطقة / القرية'} *</label>
                 <select 
                    required 
                    disabled={!selectedCityId}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none disabled:opacity-50 appearance-none"
                    onChange={handleVillageChange}
                    value={selectedVillageId || ''}
                  >
                    <option value="">{lang === 'en' ? 'Select Area...' : 'اختر المنطقة...'}</option>
                    {availableVillages.map(v => (
                      <option key={v.id} value={v.id}>{lang === 'en' ? v.nameEn : v.nameAr}</option>
                    ))}
                  </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">{t.auth.password} *</label>
                <input required type="password" name="password" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-palma-primary outline-none" value={formData.password} onChange={handleChange} />
              </div>

              <button type="submit" disabled={isUploading || loading} className="w-full py-5 bg-palma-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-palma-primary/20 mt-4 disabled:opacity-50 hover:brightness-110 transition-all active:scale-95">
                {loading ? t.common.loading : t.nav.register}
              </button>
              
              <button type="button" onClick={onBackToLogin} className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-palma-primary">
                {t.common.back}
              </button>
            </form>
      </div>
    </div>
  );
};

export default RegisterMerchant;
