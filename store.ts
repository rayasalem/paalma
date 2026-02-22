
import { db } from './services/core/storage';
import { authService } from './services/authService';
import { productService } from './services/productService';
import { orderService } from './services/orderService';
import { userService } from './services/userService';
import { socialService } from './services/socialService';
import { Review, WithdrawalRequest, CommissionRecord, SharedProduct, User, Product } from './types';

// Mock Payment Processor for Customer View
export const paymentProcessor = {
  processDigitalPayment: async (method: string, amount: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }
};

/**
 * MarketStore (Facade)
 * Aggregates all modular services into a single interface for backward compatibility.
 * In new components, prefer importing services directly.
 */
export const marketStore = {
  
  // --- Auth & User ---
  login: authService.login,
  resetPassword: authService.resetPassword,
  getUserById: authService.getUserById,
  registerCustomer: userService.register, // All mapped to generic register in service
  registerMerchant: userService.register,
  registerBroker: userService.register,
  // registerStudent Removed - role merged into Broker
  
  getUsers: () => db.users,
  getAllApprovedMerchants: () => db.users.filter(u => u.role === 'MERCHANT' && u.status === 'APPROVED'),
  getMerchantNameByUserId: (id: string) => userService.getMerchantName(id),
  getMerchantProfileByUserId: (id: string) => userService.getMerchantProfile(id),
  updateUserProfile: userService.updateProfile,
  updateMerchantProfile: userService.updateMerchantProfile,
  saveUser: (u: any) => db.updateItem('users', u.id, u),

  // --- Products ---
  // Fix: getProducts must be synchronous for existing components. 
  // For async fetching, use fetchMerchantProducts or access productService directly.
  getProducts: () => db.products, 
  
  // New Async Methods for Merchant Dashboard
  fetchMerchantProducts: productService.getByMerchantId,
  addProduct: productService.add,
  updateProduct: productService.update,
  deleteProduct: productService.delete,
  
  getFilteredProducts: productService.filter,
  getAllUniqueCategories: productService.getCategories,
  getProductRating: (id: string) => {
    const p = productService.getById(id);
    return { average: p?.rating || 0, count: p?.reviewCount || 0 };
  },
  uploadImage: async (file: File, folder?: string) => {
    // In a real implementation, this would call cloudinaryService.
    // For mock, returning a base64 string via a promise.
    const { uploadImage } = await import('./services/cloudinaryService');
    try {
      const url = await uploadImage(file);
      return { url };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  // --- Orders ---
  getOrders: orderService.getAll,
  getOrderItems: orderService.getItems,
  placeOrder: orderService.placeOrder,
  updateOrderShipment: orderService.updateShipmentInfo,
  updateLocalOrderStatus: orderService.updateStatus,
  saveOrder: (o: any) => db.updateItem('orders', o.id, o),

  // --- Reviews ---
  getReviewsForProduct: (id: string) => db.reviews.filter(r => r.productId === id || r.product_id === id),
  addReview: (userId: string, productId: string, rating: number, comment: string) => {
    if (db.reviews.find(r => r.userId === userId && r.productId === productId)) return false;
    const newReview: Review = {
      id: `REV-${Date.now()}`,
      product_id: productId,
      productId: productId,
      customer_id: userId,
      userId: userId,
      customer_name: authService.getUserById(userId)?.name || 'Customer',
      rating,
      comment,
      date: new Date().toISOString(),
      createdAt: Date.now()
    };
    db.addItem('reviews', newReview);
    return true;
  },

  // --- Social Features ---
  followUser: socialService.followUser,
  unfollowUser: socialService.unfollowUser,
  isFollowing: socialService.isFollowing,
  getFollowersCount: socialService.getFollowersCount,
  toggleLike: socialService.toggleLike,
  isLiked: socialService.isLiked,
  getLikesCount: socialService.getLikesCount,
  addComment: socialService.addComment,
  getComments: socialService.getComments,

  // --- Broker / Analytics ---
  getSharedProducts: (userId: string) => db.sharedProducts.filter(sp => sp.broker_id === userId),
  upsertSharedProduct: (brokerId: string, productId: string, data: Partial<SharedProduct>) => {
    const existingIndex = db.sharedProducts.findIndex(sp => sp.broker_id === brokerId && sp.product_id === productId);
    
    if (existingIndex >= 0) {
      // Update
      const updated = { ...db.sharedProducts[existingIndex], ...data };
      db.updateItem('sharedProducts', updated.id, updated);
    } else {
      // Create
      const newShare: SharedProduct = {
        id: `SHR-${Date.now()}`,
        broker_id: brokerId,
        product_id: productId,
        shared_at: new Date().toISOString(),
        clicks: 0,
        sales: 0,
        marketing_title: data.marketing_title,
        marketing_description: data.marketing_description,
        custom_discount_text: data.custom_discount_text,
        is_featured: false
      };
      db.addItem('sharedProducts', newShare);
    }
  },
  removeSharedProduct: (brokerId: string, productId: string) => {
    const item = db.sharedProducts.find(sp => sp.broker_id === brokerId && sp.product_id === productId);
    if (item) {
      db.deleteItem('sharedProducts', item.id);
    }
  },
  toggleSharedProductFeatured: (shareId: string) => {
    const item = db.sharedProducts.find(sp => sp.id === shareId);
    if (item) {
      db.updateItem<SharedProduct>('sharedProducts', shareId, { is_featured: !item.is_featured });
    }
  },
  getCommissions: () => db.commissions,
  incrementClicks: (userId: string) => {
    const u = db.users.find(x => x.id === userId);
    if(u) db.updateItem<User>('users', userId, { clicks: (u.clicks || 0) + 1 });
  },
  setReferral: (id: string | null) => { /* logic moved to session/cookie in real app, keeping placeholder */ },
  
  // --- Finance ---
  getWithdrawals: () => db.withdrawals,
  requestWithdrawal: (userId: string, amount: number) => {
    const req: WithdrawalRequest = { id: crypto.randomUUID(), userId, amount, status: 'PENDING', date: new Date().toISOString() };
    db.addItem('withdrawals', req);
  },
  updateWithdrawalStatus: (id: string, status: 'APPROVED'|'REJECTED') => {
    db.updateItem<WithdrawalRequest>('withdrawals', id, { status });
  }
};
