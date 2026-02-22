
import { db } from './core/storage';
import { Product, ActionResponse, Role } from '../types';
import { userService } from './userService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storageService } from './storageService';

// Helper to validate UUIDs
const isUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Product Service
 * Manages product catalog with Supabase integration.
 */
export const productService = {
  
  /**
   * Get all products (Public Catalog)
   * Fetches active products from Supabase (if connected) or local storage.
   * Syncs remote data to local cache to ensure synchronous filters work.
   */
  async getAll(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      // Fetch active products (check both status and boolean flag for safety)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('status.eq.active,is_active.eq.true')
        .order('created_at', { ascending: false }); 
      
      if (error) {
        console.error('Supabase fetch error:', error);
        return db.products; // Fallback
      }
      
      // Map and sync to local DB cache so marketStore filters work
      const mapped = data.map(mapDbToProduct);
      
      // Merge with local non-synced products if any (optional strategy, here we overwrite for consistency)
      // For a public view, we trust the DB.
      db.products = mapped;
      db.persist('products');
      
      return mapped;
    }
    return db.products;
  },

  /**
   * Fetch a single product by ID (Async)
   */
  async fetchById(id: string): Promise<Product | undefined> {
    // 1. Check local cache first
    const local = db.products.find(p => p.id === id);
    if (local) return local;

    // 2. Fetch from Supabase
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        return mapDbToProduct(data);
      }
    }
    return undefined;
  },

  /**
   * Get products specifically for a merchant (Backend Management)
   */
  async getByMerchantId(merchantId: string): Promise<Product[]> {
    // Only attempt Supabase query if merchantId is a valid UUID
    if (isSupabaseConfigured && supabase && isUuid(merchantId)) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch merchant products error:', error);
        return []; 
      }
      
      return data.map(mapDbToProduct);
    }
    
    // Fallback
    return db.products.filter(p => p.merchantId === merchantId || p.merchant_id === merchantId);
  },

  getById(id: string): Product | undefined {
    return db.products.find(p => p.id === id);
  },

  /**
   * Create a new product
   */
  async add(merchantId: string, data: Partial<Product>): Promise<ActionResponse<Product>> {
    const merchantName = userService.getMerchantName(merchantId);
    
    // Prepare Data
    const price = Number(data.price_ils) || Number(data.price) || 0;
    const isActive = data.isActive !== undefined ? data.isActive : true;
    const stock = Number(data.stock) || 0;
    
    // Use images array if present, otherwise fallback to single image
    const images = data.images && data.images.length > 0 
        ? data.images 
        : (data.image_url ? [data.image_url] : []);

    // Only use Supabase if ID is UUID
    if (isSupabaseConfigured && supabase && isUuid(merchantId)) {
      const dbPayload = {
        merchant_id: merchantId,
        title: data.name, // Map 'name' to 'title'
        name: data.name,  // Keep 'name' for legacy
        description: data.description,
        price: price,     // Map to 'price' numeric
        price_ils: price, // Keep for legacy
        stock: stock,
        category: data.category || 'other',
        status: isActive ? 'active' : 'inactive', // Map boolean to text status
        is_active: isActive,
        images: images,   // Store array of URLs
        image_url: images[0] || '', // Legacy single image
        is_bestseller: data.is_bestseller || false,
        sku: data.sku,
        weight: data.weight,
        dimensions: data.dimensions,
        tags: data.tags
      };

      const { data: inserted, error } = await supabase
        .from('products')
        .insert(dbPayload)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      const newProduct = mapDbToProduct(inserted);
      
      // Update local cache immediately
      db.addItem('products', newProduct);
      
      return { success: true, data: newProduct };
    }

    // Mock Fallback
    const newProduct: Product = {
      id: `PRD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      merchant_id: merchantId,
      merchantId: merchantId,
      merchantName: merchantName,
      name: data.name || '',
      description: data.description || '',
      price: price,
      price_ils: price,
      stock: stock,
      category: data.category || 'other',
      image_url: images[0] || '',
      imageUrl: images[0] || '',
      images: images,
      isActive: isActive,
      rating: 0,
      reviewCount: 0,
      created_at: new Date().toISOString(),
      createdAt: Date.now(),
      ...data
    };

    db.addItem('products', newProduct);
    return { success: true, data: newProduct };
  },

  /**
   * Update an existing product
   */
  async update(productId: string, data: Partial<Product>): Promise<ActionResponse<Product>> {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch original to compare images
      const { data: original, error: fetchError } = await supabase
        .from('products')
        .select('images, image_url')
        .eq('id', productId)
        .single();

      if (!fetchError && original) {
        const oldImages: string[] = original.images || (original.image_url ? [original.image_url] : []);
        const newImages: string[] = data.images || (data.imageUrl ? [data.imageUrl] : []) || oldImages;
        
        // Find images in old but not in new
        const toDelete = oldImages.filter(url => !newImages.includes(url));
        
        if (toDelete.length > 0) {
           const paths = toDelete.map(url => storageService.getPathFromUrl(url)).filter(p => p !== null) as string[];
           if (paths.length > 0) {
             await storageService.deleteFiles('products', paths);
           }
        }
      }

      // Map frontend keys to DB keys
      const dbPayload: any = {};
      
      if (data.name) {
        dbPayload.title = data.name;
        dbPayload.name = data.name;
      }
      if (data.description) dbPayload.description = data.description;
      
      if (data.price_ils !== undefined || data.price !== undefined) {
        const p = Number(data.price_ils !== undefined ? data.price_ils : data.price);
        dbPayload.price = p;
        dbPayload.price_ils = p;
      }
      
      if (data.stock !== undefined) dbPayload.stock = Number(data.stock);
      if (data.category) dbPayload.category = data.category;
      
      if (data.isActive !== undefined) {
        dbPayload.status = data.isActive ? 'active' : 'inactive';
        dbPayload.is_active = data.isActive;
      }
      
      if (data.images) {
        dbPayload.images = data.images;
        if (data.images.length > 0) dbPayload.image_url = data.images[0];
      } else if (data.image_url) {
        dbPayload.image_url = data.image_url;
      }

      if (data.tags) dbPayload.tags = data.tags;

      dbPayload.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('products')
        .update(dbPayload)
        .eq('id', productId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      
      const updatedProduct = mapDbToProduct(updated);
      
      // Update local cache
      db.updateItem('products', productId, updatedProduct);
      
      return { success: true, data: updatedProduct };
    }

    // Mock Fallback
    const updated = db.updateItem('products', productId, data);
    if (updated) return { success: true, data: updated };
    return { success: false, error: 'Product not found in mock DB' };
  },

  /**
   * Delete a product
   */
  async delete(id: string): Promise<ActionResponse<void>> {
    if (isSupabaseConfigured && supabase) {
      // Debug: Check Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[ProductService] No active Supabase session found. Delete aborted.');
        return { success: false, error: 'Authentication required. Please log in again.' };
      }
      console.log(`[ProductService] Attempting to delete product ${id} as user ${session.user.id}`);

      // 1. Fetch product to get images
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images, image_url, merchant_id')
        .eq('id', id)
        .single();

      if (fetchError) {
         console.warn('[ProductService] Could not fetch product before delete:', fetchError.message);
         // Proceed to delete anyway, it might be a ghost record
      } else if (product) {
         // Verify ownership (Client-side check, RLS should also enforce this)
         if (product.merchant_id !== session.user.id) {
             console.warn(`[ProductService] Ownership mismatch. Product owner: ${product.merchant_id}, Current user: ${session.user.id}`);
             // We let the DB call happen so RLS handles it, but logging this helps debug
         }

         const images: string[] = product.images || (product.image_url ? [product.image_url] : []);
         const paths = images.map(url => storageService.getPathFromUrl(url)).filter(p => p !== null) as string[];
         
         if (paths.length > 0) {
            console.log('[ProductService] Deleting associated images:', paths);
            await storageService.deleteFiles('products', paths);
         }
      }

      // 2. Delete from DB
      const { error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        console.error('[ProductService] Supabase delete error:', error);
        // If it's a UUID error, it means the ID format is invalid for the DB column type (if the column is strictly UUID).
        // In that case, we still want to remove it from local cache so the UI updates.
        if (error.code === '22P02') { // invalid_text_representation (usually UUID format error)
            console.warn(`[ProductService] ID ${id} is not a valid UUID for the database. Deleting from local cache only.`);
            db.deleteItem('products', id);
            return { success: true };
        }
        return { success: false, error: error.message };
      }
      
      console.log(`[ProductService] Delete successful. Rows affected: ${count}`);

      // If count is 0, it might mean RLS prevented deletion or record didn't exist
      if (count === 0) {
         console.warn('[ProductService] Supabase delete returned 0 rows affected. Check RLS policies.');
         
         // Double check existence
         const { data: checkExists } = await supabase.from('products').select('id').eq('id', id).single();
         if (checkExists) {
            console.error('[ProductService] Product still exists after delete. RLS permission denied.');
            return { success: false, error: 'Permission denied: You do not have permission to delete this product.' };
         } else {
            console.log('[ProductService] Product not found in DB. Assuming already deleted.');
         }
      }
      
      db.deleteItem('products', id);
      return { success: true };
    }

    db.deleteItem('products', id);
    return { success: true };
  },

  filter(filters: { searchTerm?: string; minPrice?: number; maxPrice?: number; minRating?: number; sortBy?: string; merchantId?: string; categoryId?: string; }) {
    let result = db.products.filter(p => p.isActive !== false);

    if (filters.merchantId && filters.merchantId !== 'all') {
      result = result.filter(p => p.merchantId === filters.merchantId || p.merchant_id === filters.merchantId);
    }
    if (filters.categoryId && filters.categoryId !== 'all') {
      result = result.filter(p => p.category === filters.categoryId);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    }
    if (filters.minPrice !== undefined) result = result.filter(p => (p.price || p.price_ils || 0) >= filters.minPrice!);
    if (filters.maxPrice !== undefined) result = result.filter(p => (p.price || p.price_ils || 0) <= filters.maxPrice!);
    if (filters.minRating !== undefined) result = result.filter(p => (p.rating || 0) >= filters.minRating!);

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
        case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
        case 'newest': result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
        case 'rating_desc': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      }
    }
    return result;
  },

  getCategories() {
    return Array.from(new Set(db.products.map(p => p.category)));
  }
};

// Helper to map DB columns (Snake Case) to App Types (Camel Case)
const mapDbToProduct = (dbRecord: any): Product => ({
  id: dbRecord.id,
  merchantId: dbRecord.merchant_id, // Legacy support
  merchant_id: dbRecord.merchant_id,
  // We'd ideally fetch merchant name via join, but simplified here
  merchantName: 'Loading...', 
  name: dbRecord.title || dbRecord.name, // Prefer title, fallback to name
  description: dbRecord.description,
  price: Number(dbRecord.price || dbRecord.price_ils), // Prefer price
  price_ils: Number(dbRecord.price || dbRecord.price_ils),
  stock: dbRecord.stock,
  category: dbRecord.category,
  imageUrl: dbRecord.image_url || (dbRecord.images && dbRecord.images[0]),
  image_url: dbRecord.image_url || (dbRecord.images && dbRecord.images[0]),
  images: dbRecord.images || [],
  isActive: dbRecord.status === 'active' || dbRecord.is_active, // Map status 'active' to true
  is_bestseller: dbRecord.is_bestseller,
  rating: Number(dbRecord.rating),
  reviewCount: dbRecord.review_count,
  createdAt: dbRecord.created_at && !isNaN(new Date(dbRecord.created_at).getTime()) ? new Date(dbRecord.created_at).getTime() : Date.now(),
  created_at: dbRecord.created_at || new Date().toISOString()
});
