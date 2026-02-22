
import { UserRole } from '../types';

export interface NavLink {
  id: string;
  labelKey: string;
  icon: string;
  roles?: UserRole[];
  isProtected?: boolean;
}

export const navigationConfig: NavLink[] = [
  // Public Links
  { id: 'home', labelKey: 'home', icon: 'Home' },
  { id: 'catalog', labelKey: 'products', icon: 'ShoppingBag' },
  
  // Dashboard (Shared ID, content differs by role)
  { id: 'dashboard', labelKey: 'dashboard', icon: 'LayoutDashboard', roles: ['MERCHANT', 'BROKER', 'ADMIN'], isProtected: true },
  
  // Merchant specific
  { id: 'merchant_products', labelKey: 'products', icon: 'Package', roles: ['MERCHANT'], isProtected: true },
  { id: 'orders', labelKey: 'orders', icon: 'Truck', roles: ['MERCHANT', 'ADMIN'], isProtected: true },
  
  // Broker specific
  { id: 'promote', labelKey: 'broker', icon: 'TrendingUp', roles: ['BROKER'], isProtected: true },
  { id: 'earnings', labelKey: 'earnings', icon: 'Wallet', roles: ['BROKER', 'MERCHANT'], isProtected: true },
  
  // Admin specific
  { id: 'users', labelKey: 'users', icon: 'Users', roles: ['ADMIN'], isProtected: true },
  { id: 'withdrawals', labelKey: 'withdrawals', icon: 'Banknote', roles: ['ADMIN'], isProtected: true },
  
  // Customer specific
  { id: 'orders_customer', labelKey: 'orders', icon: 'History', roles: ['CUSTOMER'], isProtected: true },
];

export const getLinksForRole = (role: UserRole | null): NavLink[] => {
  if (!role) {
    return navigationConfig.filter(link => !link.isProtected);
  }
  return navigationConfig.filter(link => !link.roles || link.roles.includes(role));
};
