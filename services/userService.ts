
import { db } from './core/storage';
import { User, Role, MerchantProfile, ActionResponse, UserStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * User Service
 * Handles registration via Supabase Auth and public profile syncing.
 */
export const userService = {
  
  async register(user: User, password?: string, extraData?: any): Promise<ActionResponse<{ user: User; token: string }>> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase is not configured. Cannot register.' };
      }

      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: password || 'password', 
        options: {
          data: {
            name: user.name,
            role: user.role
          },
          // Critical for production redirect
          emailRedirectTo: 'https://palmapss.vercel.app'
        }
      });

      // Handle "User already registered" gracefully to allow profile sync
      if (authError) {
        if (!authError.message.includes('already registered')) {
           return { success: false, error: authError.message };
        }
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: 'Registration failed to get user ID.' };
      }

      // 2. Prepare Public User Record
      const isMerchant = user.role === Role.MERCHANT;
      const newUser: User = {
        ...user,
        id: userId,
        emailVerified: isMerchant ? true : false, // Auto-verify merchants
        email_confirmed: isMerchant ? true : false,
        // Auto-approve merchants, otherwise PENDING
        status: isMerchant ? 'APPROVED' : 'PENDING',
        createdAt: Date.now(),
        registration_date: new Date().toISOString(),
        companyName: extraData?.company_name || user.companyName,
        city: extraData?.city || user.city,
        cityId: extraData?.city_id,
        villageId: extraData?.village_id,
      };

      // 3. Upsert into Public Table (public.users)
      // Use upsert to handle cases where Auth user exists but Public user might be missing or partial
      const payload: any = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          status: newUser.status,
          is_approved: newUser.status === 'APPROVED',
          city: newUser.city,
          company_name: newUser.companyName,
          email_verified: newUser.emailVerified, 
          email_confirmed: newUser.email_confirmed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
      };

      try {
          const { error: dbError } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
          
          if (dbError) {
              // Retry without new columns if schema cache is still stale
              if (dbError.code === 'PGRST204' || dbError.message.includes('email_verified')) {
                  console.warn('DB Schema mismatch. Retrying with legacy payload...');
                  const legacyPayload = { ...payload };
                  delete legacyPayload.email_verified;
                  const { error: retryError } = await supabase.from('users').upsert(legacyPayload, { onConflict: 'id' });
                  if (retryError) throw retryError;
              } else {
                  throw dbError;
              }
          }
      } catch (dbErr: any) {
          console.error('Failed to create/update public profile:', dbErr);
          // Non-blocking error logging
      }

      // 4. Handle Merchant Profile
      if (newUser.role === Role.MERCHANT) {
        try {
            await supabase.from('merchant_profiles').upsert({
                user_id: newUser.id,
                business_name: extraData?.business_name || newUser.companyName,
                phone: newUser.phone,
                city: newUser.city,
                city_id: extraData?.city_id,
                village_id: extraData?.village_id,
                region_id: extraData?.region_id,
                logo_url: newUser.logoUrl
            }, { onConflict: 'user_id' });
        } catch (merchErr) {
            console.error('Failed to create merchant profile:', merchErr);
        }
      }

      // 5. Update Local Cache
      db.addItem('users', newUser);

      // Return success indicating verification is required
      return { 
        success: true, 
        requiresVerification: false,
        data: { user: newUser, token: '' } 
      };

    } catch (e: any) {
      console.error("Registration Error:", e);
      return { success: false, error: e.message || 'Registration failed' };
    }
  },

  async confirmEmailManually(userId: string): Promise<ActionResponse<void>> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Config missing' };
    
    // Update public user record
    const { error } = await supabase
        .from('users')
        .update({ 
            email_verified: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) return { success: false, error: error.message };

    // Update local cache
    const localUser = db.users.find(u => u.id === userId);
    if (localUser) {
        localUser.emailVerified = true;
        db.updateItem('users', userId, localUser);
    }

    return { success: true };
  },

  updateProfile(userId: string, data: Partial<User>) {
    db.updateItem('users', userId, data);
  },

  updateMerchantProfile(userId: string, data: Partial<MerchantProfile>) {
    const profile = db.merchantProfiles.find(p => p.user_id === userId);
    if (profile) {
      db.updateItem('merchantProfiles', profile.id, data);
    }
  },

  getMerchantProfile(userId: string) {
    return db.merchantProfiles.find(p => p.user_id === userId);
  },

  getMerchantName(userId: string) {
    const p = this.getMerchantProfile(userId);
    if (p) return p.business_name;
    const u = db.users.find(x => x.id === userId);
    return u ? (u.companyName || u.name) : 'Unknown';
  },

  async getAll(): Promise<User[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase fetch users error:', error);
        return [];
      }
      return data as unknown as User[];
    }
    return [];
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<ActionResponse<void>> {
    if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('users')
          .update({ status, is_approved: status === 'APPROVED' })
          .eq('id', userId);
        if (error) return { success: false, error: error.message };
    }
    
    const localUser = db.users.find(u => u.id === userId);
    if (localUser) {
        localUser.status = status;
        localUser.isApproved = status === 'APPROVED';
        db.updateItem('users', userId, localUser);
    }
    return { success: true };
  }
};
