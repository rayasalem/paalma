
import { db } from './core/storage';
import { User } from '../types';
import { ActionResponse } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Auth Service
 * Handles user login and session management via Supabase.
 */
export const authService = {
  /**
   * Login with Email and Password
   */
  async login(email: string, password: string): Promise<ActionResponse<{ user: User; token: string }>> {
    try {
      let authUser = null;
      let sessionToken = '';

      // 1. Attempt Supabase Login
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data.session && data.user) {
          authUser = data.user;
          sessionToken = data.session.access_token;
        } else {
          // Log warning but allow fallthrough to mock/seed data for Admin/Demo accounts
          console.warn('[Auth] Supabase login failed, checking fallback data:', error?.message);
        }
      }

      // 1.a. If Supabase Auth succeeded, validate against Public Profile
      if (authUser) {
          if (!supabase) throw new Error('Supabase client not initialized');

          // Fetch Public Profile details
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
             // Check if email verified
             // const isVerified = (profile.email_verified === true) || (!!authUser.email_confirmed_at);

             // if (!isVerified) {
             //     await supabase.auth.signOut();
             //     return { 
             //       success: false, 
             //       error: 'EMAIL_NOT_VERIFIED', 
             //       requiresVerification: true,
             //       data: { user: profile as unknown as User, token: '' } 
             //     };
             // }
             
             // Check Approval Status
             if (profile.status === 'REJECTED') {
                 await supabase.auth.signOut();
                 return { success: false, error: 'Account has been rejected.' };
             }

             return { 
                 success: true, 
                 data: { user: profile as unknown as User, token: sessionToken } 
             };
          }
      }

      // 2. Fallback: Mock/Seed Data
      // This handles the "Seed Admin" who exists in public.users/mockData but NOT in Supabase Auth yet.
      const mockUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (mockUser && (password === 'password' || mockUser.password === password)) {
         // Security Note: In production, ensure this fallback is removed or strictly limited.
         return { success: true, data: { user: mockUser, token: 'mock-token-fallback' } };
      }

      return { success: false, error: 'Invalid login credentials' };
    } catch (e: any) {
      console.error('[Auth] Login Error', e);
      return { success: false, error: e.message || 'Login failed' };
    }
  },

  getUserById(id: string): User | undefined {
    return db.users.find(u => u.id === id);
  },

  async resetPassword(email: string): Promise<ActionResponse<void>> {
    // Dummy implementation to satisfy interface
    return { success: true };
  }
};
