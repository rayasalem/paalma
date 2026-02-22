
import { User, Product, Order, OrderItem, MerchantProfile, SharedProduct, Review, Notification, CommissionRecord, WithdrawalRequest, Transaction, Follow, Like, Comment } from '../../types';
import { MOCK_USERS, MOCK_MERCHANT_PROFILES, MOCK_PRODUCTS, MOCK_REVIEWS } from '../../lib/mockData';

/**
 * StorageService (Data Access Layer)
 * Manages in-memory state synchronized with LocalStorage.
 * Acts as the "Database" for the mock environment.
 */
class StorageService {
  public users: User[] = [];
  public merchantProfiles: MerchantProfile[] = [];
  public products: Product[] = [];
  public orders: Order[] = [];
  public orderItems: OrderItem[] = [];
  public sharedProducts: SharedProduct[] = [];
  public reviews: Review[] = [];
  public notifications: Notification[] = [];
  public commissions: CommissionRecord[] = [];
  public withdrawals: WithdrawalRequest[] = [];
  public transactions: Transaction[] = [];
  public follows: Follow[] = [];
  public likes: Like[] = [];
  public comments: Comment[] = [];

  constructor() {
    this.init();
  }

  private init() {
    this.load('users', MOCK_USERS);
    this.load('merchantProfiles', MOCK_MERCHANT_PROFILES);
    this.load('products', MOCK_PRODUCTS);
    this.load('reviews', MOCK_REVIEWS);
    this.load('orders', []);
    this.load('orderItems', []);
    this.load('sharedProducts', []);
    this.load('notifications', []);
    this.load('commissions', []);
    this.load('withdrawals', []);
    this.load('transactions', []);
    this.load('follows', []);
    this.load('likes', []);
    this.load('comments', []);
  }

  private load<T>(key: keyof StorageService, defaultData: T) {
    try {
      const stored = localStorage.getItem(`palma_${key}`);
      if (stored) {
        (this as any)[key] = JSON.parse(stored);
      } else {
        (this as any)[key] = defaultData;
        this.persist(key);
      }
    } catch (e) {
      console.warn(`[Storage] Failed to load ${key}`, e);
      (this as any)[key] = defaultData;
    }
  }

  public persist(key: keyof StorageService) {
    try {
      localStorage.setItem(`palma_${key}`, JSON.stringify((this as any)[key]));
    } catch (e) {
      console.error(`[Storage] Failed to save ${key}`, e);
    }
  }

  // --- Generic Helpers ---

  public addItem<T>(collection: keyof StorageService, item: T) {
    (this as any)[collection].push(item);
    this.persist(collection);
  }

  public updateItem<T extends { id: string }>(collection: keyof StorageService, id: string, updates: Partial<T>) {
    const list = (this as any)[collection] as T[];
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.persist(collection);
      return list[index];
    }
    return null;
  }

  public deleteItem<T extends { id: string }>(collection: keyof StorageService, id: string) {
    const list = (this as any)[collection] as T[];
    (this as any)[collection] = list.filter(i => i.id !== id);
    this.persist(collection);
  }
}

export const db = new StorageService();
