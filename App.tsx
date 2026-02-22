
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Auth } from './components/Auth';
import PublicWebsite from './components/PublicWebsite';
import PublicCatalog from './components/PublicCatalog';
import { CustomerView } from './views/CustomerView';
import { MerchantView } from './views/MerchantView';
import { BrokerView } from './views/BrokerView';
import { AdminView } from './views/AdminView';
import ProfileView from './views/ProfileView';
import PublicBrokerPage from './views/PublicBrokerPage';
import PublicProfileView from './views/PublicProfileView'; // Updated View
import PublicProductDetails from './views/PublicProductDetails';
import { PendingReview } from './components/PendingReview';
import { User, Product, CartItem } from './types';
import { marketStore } from './store';
import { userService } from './services/userService';
import { Language } from './translations';
import { ToastProvider, useToast } from './components/ToastProvider';
import { isSupabaseConfigured } from './lib/supabase';

// Helper to validate UUIDs
const isUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const loadUser = (): User | null => {
  const stored = localStorage.getItem('palma_current_user');
  return stored ? JSON.parse(stored) : null;
};

// Component to handle verification logic inside ToastProvider context
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [authView, setAuthView] = useState<'LOGIN' | 'ROLE_SELECT' | 'REGISTER_MERCHANT' | 'REGISTER_BROKER' | 'REGISTER_CUSTOMER'>('LOGIN');
  const [lang, setLang] = useState<Language>('ar');
  const { showToast } = useToast();
  
  // Public State: 'LANDING' | 'CATALOG' | 'AUTH' | 'BROKER_PAGE' | 'PRODUCT_DETAILS' | 'PUBLIC_PROFILE'
  const [publicState, setPublicState] = useState<'LANDING' | 'CATALOG' | 'AUTH' | 'BROKER_PAGE' | 'PRODUCT_DETAILS' | 'PUBLIC_PROFILE'>('LANDING');
  const [publicBrokerId, setPublicBrokerId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Sync language with document for components that rely on DOM direction
  useEffect(() => {
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const initApp = async () => {
      // 1. Check for URL Params (Verification, Referral, etc.)
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const brokerRef = params.get('broker');
      const productRef = params.get('product');
      const profileRef = params.get('profile');
      
      if (ref) {
        marketStore.setReferral(ref);
        console.log(`[Palma] Referral tracked: ${ref}`);
      }

      if (brokerRef) {
        // Legacy Broker link support
        setPublicBrokerId(brokerRef);
        setPublicState('BROKER_PAGE');
      }

      if (profileRef) {
          handleViewProfile(profileRef);
      }

      if (productRef) {
        handleViewProduct(productRef);
      }

      // 2. Load User
      const savedUser = loadUser();
      if (savedUser) {
        // Check if user is a legacy mock user (non-UUID) when Supabase is active
        if (isSupabaseConfigured && !isUuid(savedUser.id)) {
          console.warn('[App] Legacy mock user detected. Forcing logout to sync with database.');
          handleLogout();
          // We can't show toast here easily as it's inside useEffect, but logout clears state
          return;
        }

        const refreshedUser = marketStore.getUserById(savedUser.id);
        const u = refreshedUser || savedUser;
        
        // Security Check: Ensure session user is verified if they have a code pending
        if (u.verificationCode && !u.emailVerified) {
           console.warn('Session user not verified. Logging out.');
           handleLogout();
           return;
        }

        if (refreshedUser) {
          setUser(refreshedUser);
          setDefaultView(refreshedUser);
        } else {
          setUser(savedUser);
          setDefaultView(savedUser);
        }
      }
      
      // 3. Load Cart
      const savedCart = localStorage.getItem('palma_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    };

    initApp();
  }, []);

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const refreshUser = () => {
    if (!user) return;
    const u = marketStore.getUserById(user.id);
    if (u) {
      setUser({...u});
      localStorage.setItem('palma_current_user', JSON.stringify(u));
    }
  };

  const setDefaultView = (u: User) => {
    if (u.role === 'MERCHANT') setCurrentView('dashboard');
    else if (u.role === 'ADMIN') setCurrentView('dashboard');
    else if (u.role === 'BROKER') setCurrentView('dashboard');
    else setCurrentView('home');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('palma_current_user', JSON.stringify(loggedInUser));
    setDefaultView(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('palma_current_user');
    setCurrentView('home');
    setPublicState('LANDING');
    setAuthView('LOGIN');
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      let newCart;
      const price = product.price || product.price_ils || 0;
      
      if (existing) {
        newCart = prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p);
      } else {
        newCart = [...prev, { ...product, quantity, price }];
      }
      localStorage.setItem('palma_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = prev.filter(p => p.id !== id);
      localStorage.setItem('palma_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(p => {
        if (p.id === id) return { ...p, quantity: Math.max(0, p.quantity + delta) };
        return p;
      }).filter(p => p.quantity > 0);
      localStorage.setItem('palma_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('palma_cart');
  };

  const openAuth = (view: typeof authView) => {
    setAuthView(view);
    setPublicState('AUTH');
  };

  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    if (user) {
        setCurrentView('product_details');
    } else {
        setPublicState('PRODUCT_DETAILS');
    }
  };

  const handleViewProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (user) {
        setCurrentView('public_profile');
    } else {
        setPublicState('PUBLIC_PROFILE');
    }
  };

  if (!user) {
    if (publicState === 'PRODUCT_DETAILS' && selectedProductId) {
      return (
        <PublicProductDetails 
          lang={lang}
          user={null}
          productId={selectedProductId}
          onBack={() => setPublicState('CATALOG')}
          onLoginClick={() => openAuth('LOGIN')}
          addToCart={addToCart}
        />
      );
    }

    if (publicState === 'PUBLIC_PROFILE' && selectedProfileId) {
      return (
        <PublicProfileView 
          lang={lang}
          currentUser={null}
          profileId={selectedProfileId}
          onBack={() => setPublicState('LANDING')}
          onProductClick={handleViewProduct}
          onLoginClick={() => openAuth('LOGIN')}
          toggleLang={toggleLang}
        />
      );
    }

    if (publicState === 'BROKER_PAGE' && publicBrokerId) {
      return (
        <PublicBrokerPage 
          lang={lang}
          brokerId={publicBrokerId}
          onBack={() => setPublicState('LANDING')}
          onProductClick={handleViewProduct}
          onLoginClick={() => openAuth('LOGIN')}
          toggleLang={toggleLang}
        />
      );
    }

    if (publicState === 'LANDING') {
      return (
        <PublicWebsite 
          lang={lang}
          toggleLang={toggleLang}
          onLoginClick={() => openAuth('LOGIN')}
          onJoinMerchant={() => openAuth('REGISTER_MERCHANT')}
          onJoinBroker={() => openAuth('REGISTER_BROKER')}
          onExploreProducts={() => setPublicState('CATALOG')}
          onViewProduct={handleViewProduct}
        />
      );
    }
    
    if (publicState === 'CATALOG') {
      return (
        <PublicCatalog 
          onBack={() => setPublicState('LANDING')}
          onLoginClick={() => openAuth('LOGIN')}
          onProductClick={handleViewProduct} 
        />
      );
    }
    
    return <Auth onLogin={handleLogin} initialView={authView} />;
  }

  // 4. Email Verification Check (DISABLED - Moved to Profile)
  // if (!user.emailVerified && user.role === 'MERCHANT') {
  //   return (
  //     <VerifyEmail 
  //       user={user} 
  //       onLogout={handleLogout} 
  //       lang={lang} 
  //       onVerified={() => {
  //         refreshUser();
  //         showToast(lang === 'ar' ? 'تم التحقق بنجاح!' : 'Verified successfully!', 'success');
  //       }}
  //     />
  //   );
  // }

  if ((user.status === 'PENDING' || user.status === 'REJECTED') && user.role !== 'ADMIN') {
    return <PendingReview user={user} onLogout={handleLogout} lang={lang} />;
  }

  return (
    <Layout 
      user={user} 
      lang={lang}
      toggleLang={toggleLang}
      onLogout={handleLogout} 
      activeTab={currentView} 
      onTabChange={(tab) => {
        setCurrentView(tab);
        if (tab !== 'product_details') setSelectedProductId(null);
        if (tab !== 'public_profile') setSelectedProfileId(null);
      }}
      cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
    >
      {currentView === 'profile' ? (
        <ProfileView 
          lang={lang}
          user={user}
          onRefresh={refreshUser}
          onViewProduct={(id) => {
              setSelectedProductId(id);
              setCurrentView('product_details');
          }}
        />
      ) : currentView === 'product_details' && selectedProductId ? (
          <PublicProductDetails 
            lang={lang}
            user={user}
            productId={selectedProductId}
            onBack={() => setCurrentView('home')}
            onLoginClick={() => {}} 
            onRefresh={refreshUser}
            addToCart={addToCart}
          />
      ) : currentView === 'public_profile' && selectedProfileId ? (
          <PublicProfileView 
            lang={lang}
            currentUser={user}
            profileId={selectedProfileId}
            onBack={() => setCurrentView('home')}
            onProductClick={(id) => {
                setSelectedProductId(id);
                setCurrentView('product_details');
            }}
            onLoginClick={() => {}}
            toggleLang={toggleLang}
          />
      ) : (
        <>
          {(user.role === 'CUSTOMER') && (
            <div className={'block'}>
              <CustomerView 
                user={user} 
                view={currentView === 'orders_customer' ? 'orders' : currentView} 
                cart={cart}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                clearCart={clearCart}
                lang={lang}
                onRefresh={refreshUser}
                onViewProduct={(id) => {
                    setSelectedProductId(id);
                    setCurrentView('product_details');
                }}
                onTabChange={(tab) => {
                    if (tab === 'home' || tab === 'shop') setCurrentView('home');
                    else if (tab === 'cart') setCurrentView('cart');
                    else if (tab === 'orders') setCurrentView('orders_customer');
                    else setCurrentView(tab);
                }}
              />
            </div>
          )}

          {user.role === 'MERCHANT' && (
            <MerchantView user={user} view={currentView} />
          )}
          
          {user.role === 'ADMIN' && (
              <AdminView />
          )}

          {user.role === 'BROKER' && (
            <BrokerView 
              user={user} 
              lang={lang}
              activeTab={currentView}
              onTabChange={setCurrentView}
              onRefresh={refreshUser}
            />
          )}
        </>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
