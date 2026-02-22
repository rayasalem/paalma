
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Check if Supabase is configured with valid URL and Key
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  env.SUPABASE.URL && 
  env.SUPABASE.ANON_KEY && 
  isValidUrl(env.SUPABASE.URL)
);

export const supabase = isSupabaseConfigured 
  ? createClient(env.SUPABASE.URL, env.SUPABASE.ANON_KEY) 
  : null;
