
import { User, Product, MerchantProfile, Order, OrderItem, Role, OrderStatus, Review } from '../types';

// Valid UUIDs for Mock Data
const ADMIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MERCHANT_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'; // Changed to valid UUID
const BROKER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11';
const STUDENT_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11';
const CUSTOMER_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11';

export const MOCK_USERS: User[] = [
  {
    id: ADMIN_ID,
    email: 'admin@palma.com',
    password: 'password',
    name: 'Palma Admin',
    phone: '0599000000',
    role: Role.ADMIN,
    status: 'APPROVED',
    isApproved: true,
    createdAt: Date.now(),
    registration_date: new Date().toISOString()
  },
  {
    id: MERCHANT_ID,
    email: 'merchant@store.com',
    password: 'password',
    name: 'Sami Merchant',
    phone: '0599111111',
    role: Role.MERCHANT,
    status: 'APPROVED',
    isApproved: true,
    city: 'Ramallah',
    companyName: 'Palma Fashion',
    createdAt: Date.now(),
    registration_date: new Date().toISOString()
  },
  {
    id: BROKER_ID,
    email: 'broker@deals.com',
    password: 'password',
    name: 'Rana Broker',
    phone: '0599222222',
    role: Role.BROKER,
    status: 'APPROVED',
    isApproved: true,
    city: 'Nablus',
    companyName: 'Best Deals',
    balance: 1500,
    createdAt: Date.now(),
    registration_date: new Date().toISOString()
  },
  {
    id: STUDENT_ID,
    email: 'student@uni.edu',
    password: 'password',
    name: 'Ali Student',
    phone: '0599333333',
    role: Role.BROKER, // Consolidated to BROKER
    status: 'APPROVED',
    isApproved: true,
    university: 'Birzeit University',
    createdAt: Date.now(),
    registration_date: new Date().toISOString()
  },
  {
    id: CUSTOMER_ID,
    email: 'customer@palma.com',
    password: 'password',
    name: 'Ahmed Customer',
    phone: '0599333333',
    role: Role.CUSTOMER,
    status: 'APPROVED',
    isApproved: true,
    createdAt: Date.now(),
    registration_date: new Date().toISOString()
  }
];

export const MOCK_MERCHANT_PROFILES: MerchantProfile[] = [
  {
    id: 'mp-1',
    user_id: MERCHANT_ID,
    business_name: 'Palma Fashion',
    phone: '0599111111',
    city: 'Ramallah',
    city_id: 1,
    village_id: 101,
    region_id: 1,
    business_description: 'The best fashion store in Ramallah, offering high-quality winter and summer collections.',
    logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    merchant_id: MERCHANT_ID,
    merchantId: MERCHANT_ID,
    merchantName: 'Palma Fashion',
    name: 'جاكيت شتوي مقاوم للماء',
    description: 'جاكيت عالي الجودة مصمم خصيصاً للأجواء الباردة والممطرة. مبطن بالفرو الصناعي الناعم.',
    price_ils: 250,
    price: 250,
    discount: 15,
    category: 'fashion',
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80'],
    rating: 4.8,
    reviewCount: 12,
    isActive: true,
    created_at: new Date().toISOString(),
    is_bestseller: true
  },
  {
    id: 'p2',
    merchant_id: MERCHANT_ID,
    merchantId: MERCHANT_ID,
    merchantName: 'Palma Fashion',
    name: 'حذاء رياضي مريح',
    description: 'حذاء رياضي خفيف الوزن مناسب للجري والمشي لمسافات طويلة. نعل طبي مريح.',
    price_ils: 180,
    price: 180,
    discount: 0,
    category: 'fashion',
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'],
    rating: 4.2,
    reviewCount: 5,
    isActive: true,
    created_at: new Date().toISOString(),
    is_bestseller: false
  },
  {
    id: 'p3',
    merchant_id: MERCHANT_ID,
    merchantId: MERCHANT_ID,
    merchantName: 'Palma Fashion',
    name: 'حقيبة جلدية فاخرة',
    description: 'حقيبة يد مصنوعة من الجلد الطبيعي، تصميم عصري يناسب جميع المناسبات.',
    price_ils: 320,
    price: 320,
    discount: 5,
    category: 'fashion',
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80'],
    rating: 5.0,
    reviewCount: 3,
    isActive: true,
    created_at: new Date().toISOString(),
    is_bestseller: false
  },
  {
    id: 'p4',
    merchant_id: MERCHANT_ID,
    merchantId: MERCHANT_ID,
    merchantName: 'Palma Fashion',
    name: 'سماعات بلوتوث لاسلكية',
    description: 'سماعات عالية الدقة مع خاصية إلغاء الضوضاء، بطارية تدوم طويلاً.',
    price_ils: 450,
    price: 450,
    discount: 10,
    category: 'electronics',
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'],
    rating: 4.7,
    reviewCount: 45,
    isActive: true,
    created_at: new Date().toISOString(),
    is_bestseller: true
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'p1',
    product_id: 'p1',
    userId: CUSTOMER_ID,
    customer_id: CUSTOMER_ID,
    customer_name: 'Ahmed Customer',
    rating: 5,
    comment: 'Great product! Highly recommended for winter.',
    date: new Date().toISOString(),
    createdAt: Date.now()
  }
];

export const MOCK_ORDERS: Order[] = [];
export const MOCK_ORDER_ITEMS: OrderItem[] = [];
