
import { User, Product, Order, Review, Transaction } from '../types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_REVIEWS } from '../lib/mockData';

// Re-using imported data ensures consistency.
// The class handles persisting this data to localStorage.

class MockDatabase {
  private usersKey = 'palma_users';
  private productsKey = 'palma_products';
  private ordersKey = 'palma_orders';
  private reviewsKey = 'palma_reviews';
  private transactionsKey = 'palma_transactions';

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(this.productsKey)) {
      localStorage.setItem(this.productsKey, JSON.stringify(MOCK_PRODUCTS));
    }
    if (!localStorage.getItem(this.ordersKey)) {
      localStorage.setItem(this.ordersKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.reviewsKey)) {
      localStorage.setItem(this.reviewsKey, JSON.stringify(MOCK_REVIEWS));
    }
    if (!localStorage.getItem(this.transactionsKey)) {
      localStorage.setItem(this.transactionsKey, JSON.stringify([]));
    }
  }

  // User Methods
  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
  }

  saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  // Product Methods
  getProducts(): Product[] {
    return JSON.parse(localStorage.getItem(this.productsKey) || '[]');
  }

  saveProduct(product: Product) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(this.productsKey, JSON.stringify(products));
  }

  deleteProduct(id: string) {
    const products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem(this.productsKey, JSON.stringify(products));
  }

  // Order Methods
  getOrders(): Order[] {
    return JSON.parse(localStorage.getItem(this.ordersKey) || '[]');
  }

  saveOrder(order: Order) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.push(order);
    }
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
  }

  // Review Methods
  getReviews(productId?: string): Review[] {
    const allReviews: Review[] = JSON.parse(localStorage.getItem(this.reviewsKey) || '[]');
    if (productId) {
      return allReviews.filter(r => r.productId === productId);
    }
    return allReviews;
  }

  addReview(review: Review) {
    const reviews = this.getReviews();
    reviews.push(review);
    localStorage.setItem(this.reviewsKey, JSON.stringify(reviews));

    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === review.productId);
    if (productIndex >= 0) {
      const productReviews = reviews.filter(r => r.productId === review.productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      products[productIndex].rating = totalRating / productReviews.length;
      products[productIndex].reviewCount = productReviews.length;
      localStorage.setItem(this.productsKey, JSON.stringify(products));
    }
  }

  // Transaction Methods
  getTransactions(): Transaction[] {
    return JSON.parse(localStorage.getItem(this.transactionsKey) || '[]');
  }

  saveTransaction(transaction: Transaction) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));
  }
}

export const db = new MockDatabase();
