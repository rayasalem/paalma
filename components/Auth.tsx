
import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { marketStore } from '../store';
import { userService } from '../services/userService';
import { t } from '../translations';
import { ShoppingCart, TrendingUp, Store, ArrowRight, Mail, Lock, CheckCircle, RefreshCcw } from 'lucide-react';
import RegisterBroker from './RegisterBroker';
import RegisterCustomer from './RegisterCustomer';
import RegisterMerchant from './RegisterMerchant';
import Logo from './Logo';
import { useToast } from './ToastProvider';

interface AuthProps {
  onLogin: (user: User) => void;
  initialView?: 'LOGIN' | 'ROLE_SELECT' | 'REGISTER_MERCHANT' | 'REGISTER_BROKER' | 'REGISTER_CUSTOMER';
}

export const Auth: React.FC<AuthProps> = ({ onLogin, initialView = 'LOGIN' }) => {
  const [view, setView] = useState(initialView);
  
  // Specific state for Unverified Flow
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Sanitize initialView
    if (initialView as any === 'REGISTER_STUDENT') {
        setView('LOGIN');
    } else {
        setView(initialView);
    }
  }, [initialView]);

  // Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate slight network delay for effect
    await new Promise(r => setTimeout(r, 600));

    const result = await marketStore.login(email, password);

    if (result.success && result.data) {
      showToast(t.common.success, 'success');
      onLogin(result.data.user);
    } else {
      setError(result.error || 'Invalid credentials');
      showToast(result.error || 'Login Failed', 'error');
    }
    setLoading(false);
  };

  const handleRoleSelection = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError('');
  };

  const proceedToRegister = () => {
    if (!role) {
      setError('Please select an account type');
      return;
    }
    
    if (role === 'BROKER') setView('REGISTER_BROKER');
    else if (role === 'CUSTOMER') setView('REGISTER_CUSTOMER');
    else if (role === 'MERCHANT') setView('REGISTER_MERCHANT');
    else setView('ROLE_SELECT');
  };

  const roleOptions = [
    { id: 'CUSTOMER', label: t.roles.CUSTOMER, icon: <ShoppingCart className="w-5 h-5"/>, desc: 'Shop & Discover' },
    { id: 'MERCHANT', label: t.roles.MERCHANT, icon: <Store className="w-5 h-5"/>, desc: 'Sell & Grow' },
    { id: 'BROKER', label: t.roles.BROKER, icon: <TrendingUp className="w-5 h-5"/>, desc: 'Promote & Earn' },
  ];

  if (view === 'REGISTER_BROKER') return <RegisterBroker onRegister={onLogin} onBackToLogin={() => setView('LOGIN')} />;
  if (view === 'REGISTER_CUSTOMER') return <RegisterCustomer onRegister={onLogin} onBackToLogin={() => setView('LOGIN')} />;
  if (view === 'REGISTER_MERCHANT') return <RegisterMerchant onRegister={onLogin} onBackToLogin={() => setView('LOGIN')} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans" dir="rtl">
      
      <div className="w-full max-w-lg transition-all duration-700 ease-in-out animate-fade-in">
        
        {/* Branding Header */}
        <div className="text-center space-y-8 mb-10">
           <div className="flex justify-center transform scale-125"><Logo /></div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-50 border-b border-slate-100 m-4 rounded-2xl">
            <button 
              onClick={() => { setView('LOGIN'); setError(''); }}
              className={`py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'LOGIN' ? 'bg-white text-palma-navy shadow-sm' : 'text-slate-400 hover:text-palma-navy'}`}
            >
              {t.auth.login}
            </button>
            <button 
              onClick={() => { setView('ROLE_SELECT'); setError(''); }}
              className={`py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view !== 'LOGIN' ? 'bg-white text-palma-navy shadow-sm' : 'text-slate-400 hover:text-palma-navy'}`}
            >
              {t.auth.register}
            </button>
          </div>

          <div className="p-8 sm:p-10 pt-4">
            <div className="mb-10 text-center">
               <h2 className="text-2xl font-black text-palma-navy mb-2 tracking-tight">
                 {view === 'LOGIN' ? t.auth.welcomeHeadline : t.auth.chooseRole}
               </h2>
               <p className="text-sm font-medium text-slate-400">
                 {view === 'LOGIN' ? t.auth.digitalJourney : t.auth.roleSubtitle}
               </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center justify-center gap-3 border border-red-100 animate-slide-up">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            {/* LOGIN VIEW */}
            {view === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.auth.email}</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-palma-primary transition-colors" />
                    <input 
                      required 
                      type="email" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-palma-navy focus:bg-white focus:border-palma-primary focus:ring-2 focus:ring-palma-primary/10 outline-none transition-all placeholder:text-slate-300" 
                      placeholder="name@email.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.auth.password}</label>
                    <button type="button" className="text-[10px] font-bold text-palma-primary hover:underline">{t.auth.forgot}</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-palma-primary transition-colors" />
                    <input 
                      required 
                      type="password" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-palma-navy focus:bg-white focus:border-palma-primary focus:ring-2 focus:ring-palma-primary/10 outline-none transition-all placeholder:text-slate-300" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-palma-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-palma-navy/20 hover:bg-palma-primary transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      {t.auth.loginBtn}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ROLE SELECTION VIEW */}
            {view === 'ROLE_SELECT' && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                   {roleOptions.map(r => (
                     <button
                        key={r.id}
                        onClick={() => handleRoleSelection(r.id as any)}
                        className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center gap-3 relative group ${role === r.id ? 'border-palma-primary bg-palma-primary/5 ring-1 ring-palma-primary' : 'border-slate-100 bg-slate-50 hover:border-palma-primary/30 hover:shadow-lg hover:bg-white'}`}
                     >
                        <div className={`p-3 rounded-xl transition-colors ${role === r.id ? 'bg-palma-primary text-white shadow-lg shadow-palma-primary/30' : 'bg-white text-slate-400 group-hover:text-palma-primary shadow-sm'}`}>
                          {r.icon}
                        </div>
                        <div>
                          <span className={`block text-xs font-black uppercase tracking-wider mb-1 ${role === r.id ? 'text-palma-primary' : 'text-palma-navy'}`}>{r.label}</span>
                          <span className="text-[9px] font-bold text-slate-400">{r.desc}</span>
                        </div>
                     </button>
                   ))}
                </div>

                <button 
                  onClick={proceedToRegister}
                  disabled={!role}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${role ? 'bg-palma-navy text-white hover:bg-palma-primary shadow-palma-navy/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
                >
                  {t.auth.continue}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Demo Footer */}
        <div className="mt-10 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Demo Access</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { role: 'CUSTOMER', label: 'Customer', email: 'customer@palma.com' },
                { role: 'MERCHANT', label: 'Merchant', email: 'merchant@store.com' },
                { role: 'BROKER', label: 'Broker', email: 'broker@deals.com' },
              ].map(demo => (
                <button 
                  key={demo.role}
                  type="button" 
                  onClick={() => {
                    setView('LOGIN');
                    setEmail(demo.email);
                    setPassword('password');
                    setError('');
                  }} 
                  className="px-4 py-2 bg-white text-slate-500 text-[9px] font-bold uppercase rounded-xl hover:bg-palma-navy hover:text-white transition-all border border-slate-100 shadow-sm hover:shadow-md"
                >
                  {demo.label}
                </button>
              ))}
            </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] font-bold text-slate-300">© 2024 Palma Commerce. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
