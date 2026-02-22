
import React from 'react';
import { User, Role } from '../types';
import Logo from './Logo';
import { Language, translations } from '../translations';
import { ShoppingCart, Menu, X, Globe, LogOut, LayoutDashboard, Package, ShoppingBag, Banknote, User as UserIcon, TrendingUp, BarChart, Users, Wallet, Home, History } from 'lucide-react';

interface LayoutProps {
  lang: Language;
  toggleLang: () => void;
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ lang, toggleLang, user, onLogout, children, activeTab, onTabChange, cartCount = 0 }) => {
  const t = translations[lang];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isProfessional = [Role.MERCHANT, Role.BROKER, Role.ADMIN].includes(user.role as Role);

  const getRoleLabel = (role: Role | string) => {
    const r = role as keyof typeof t.roles;
    return t.roles[r] || role;
  };

  const getIcon = (iconName: string, size = 20) => {
    const icons: Record<string, React.ReactNode> = {
      LayoutDashboard: <LayoutDashboard size={size} />,
      Package: <Package size={size} />,
      ShoppingBag: <ShoppingBag size={size} />,
      Banknote: <Banknote size={size} />,
      User: <UserIcon size={size} />,
      Globe: <Globe size={size} />,
      BarChart: <BarChart size={size} />,
      Users: <Users size={size} />,
      Wallet: <Wallet size={size} />,
      Home: <Home size={size} />,
      History: <History size={size} />,
      ShoppingCart: <ShoppingCart size={size} />,
      TrendingUp: <TrendingUp size={size} />
    };
    return icons[iconName] || <LayoutDashboard size={size} />;
  };

  const userMenuItems = user.role === Role.MERCHANT ? [
    { id: 'dashboard', label: t.common.dashboard, icon: 'LayoutDashboard' },
    { id: 'products', label: t.common.products, icon: 'Package' },
    { id: 'orders', label: t.common.orders, icon: 'ShoppingBag' },
    { id: 'earnings', label: t.common.earnings, icon: 'Banknote' },
    { id: 'profile', label: t.common.profile, icon: 'User' },
  ] : user.role === Role.BROKER ? [
    { id: 'promote', label: lang === 'en' ? 'Market' : 'السوق', icon: 'Globe' },
    { id: 'earnings', label: t.common.earnings, icon: 'Banknote' },
    { id: 'stats', label: t.common.stats, icon: 'BarChart' },
    { id: 'profile', label: t.common.profile, icon: 'User' },
  ] : user.role === Role.ADMIN ? [
    { id: 'users', label: t.common.users, icon: 'Users' },
    { id: 'orders', label: t.common.orders, icon: 'ShoppingBag' },
    { id: 'withdrawals', label: t.common.withdrawals, icon: 'Wallet' },
  ] : [ 
    { id: 'home', label: t.nav.home, icon: 'Home' },
    { id: 'orders_customer', label: t.nav.orders, icon: 'History' },
    { id: 'cart', label: t.nav.cart, icon: 'ShoppingCart' },
  ];

  const profileImg = user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=1F5D42&color=fff&size=80`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-palma-text" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-palma-border sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 h-16 sm:h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-palma-navy hover:bg-slate-100 rounded-lg transition-colors">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            <div className="cursor-pointer flex items-center hover:opacity-80 transition-opacity" onClick={() => onTabChange('home')}>
               <Logo size="medium" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            {!isProfessional && (
              <button 
                onClick={() => onTabChange('cart')}
                className="relative p-2.5 text-palma-muted hover:text-palma-primary hover:bg-palma-primary/5 rounded-xl transition-all group"
                title={t.nav.cart}
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-palma-accent text-[10px] font-bold text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-palma-navy hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Globe className="w-4 h-4" />
              {lang === 'en' ? 'العربية' : 'EN'}
            </button>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-2 sm:gap-4 pl-2">
              <button 
                onClick={() => onTabChange('profile')}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
              >
                <img src={profileImg} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 object-cover" alt="Profile" />
                <div className="hidden sm:flex flex-col text-right rtl:text-left pr-2 rtl:pl-2">
                  <span className="text-sm font-bold text-palma-navy leading-tight">{user.name}</span>
                  <span className="text-[10px] font-medium text-palma-muted uppercase tracking-wide">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title={t.common.logout}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1800px] mx-auto w-full">
        {/* Desktop Sidebar */}
        {isProfessional && (
          <aside className={`hidden lg:block w-72 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 pr-6 rtl:pr-0 rtl:pl-6`}>
            <div className="bg-white rounded-3xl shadow-card border border-palma-border h-full flex flex-col p-4">
              <div className="px-4 py-4 mb-2">
                <h3 className="text-xs font-black text-palma-muted uppercase tracking-[0.15em]">{t.common.dashboard}</h3>
              </div>
              <nav className="space-y-1 flex-1">
                {userMenuItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
                      activeTab === item.id 
                        ? 'bg-palma-soft text-palma-primary ring-1 ring-palma-primary/10' 
                        : 'text-palma-muted hover:bg-slate-50 hover:text-palma-navy'
                    }`}
                  >
                    {activeTab === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-palma-primary rounded-r-full rtl:left-auto rtl:right-0 rtl:rounded-r-none rtl:rounded-l-full"></div>
                    )}
                    <span className={`transition-transform duration-300 ${activeTab === item.id ? 'text-palma-primary' : 'text-slate-400 group-hover:text-palma-navy'}`}>
                      {getIcon(item.icon, 20)}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>
              
              <div className="mt-auto p-4 bg-gradient-to-br from-palma-soft to-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                        <TrendingUp size={16} className="text-palma-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-palma-navy">Palma Business</p>
                        <p className="text-[10px] text-palma-muted font-medium">Pro Plan Active</p>
                    </div>
                  </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                 <Logo size="small" />
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-palma-muted" /></button>
               </div>
               <div className="p-4 overflow-y-auto flex-1 bg-white">
                 <nav className="space-y-2">
                  {userMenuItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { onTabChange(item.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                        activeTab === item.id ? 'bg-palma-soft text-palma-primary' : 'text-palma-muted hover:bg-slate-50'
                      }`}
                    >
                      {getIcon(item.icon)}
                      {item.label}
                    </button>
                  ))}
                </nav>
               </div>
               <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <button onClick={onLogout} className="flex items-center gap-3 text-sm font-bold text-red-600 w-full justify-center py-3 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-100 transition">
                    <LogOut size={18} />
                    {t.common.logout}
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8`}>
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {!isProfessional && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe z-50 shadow-lg">
          <div className="flex justify-around items-center h-20 pb-2">
            {userMenuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all group ${
                  activeTab === item.id ? 'text-palma-primary' : 'text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-palma-primary/10 -translate-y-1' : 'group-hover:bg-slate-50'}`}>
                   {getIcon(item.icon, 22)}
                </div>
                <span className={`text-[10px] font-bold ${activeTab === item.id ? 'text-palma-navy' : ''}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
