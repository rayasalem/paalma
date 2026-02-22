
/**
 * Application Configuration
 * Centralizes all environment variables and static config values.
 */

// Helper to safely access environment variables without crashing if import.meta.env is undefined
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore: suppress typescript error for checking import.meta directly
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Fallback if anything goes wrong
  }
  return fallback;
};

export const env = {
  SUPABASE: {
    URL: getEnvVar('VITE_SUPABASE_URL', ''),
    ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', ''),
  },
  CLOUDINARY: {
    CLOUD_NAME: getEnvVar('VITE_CLOUDINARY_CLOUD_NAME', 'demo'),
    UPLOAD_PRESET: getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', 'palma_uploads'),
  },
  EMAIL: {
    // SendGrid Configuration
    SENDGRID_API_KEY: getEnvVar('VITE_SENDGRID_API_KEY', ''),
    SENDER_EMAIL: getEnvVar('VITE_SENDER_EMAIL', 'noreply@palma.ps'),
  },
  FLASHLINE: {
    API_URL: getEnvVar('VITE_FLASHLINE_API_URL', 'https://apisv2.logestechs.com/api'),
    // In a real app, secrets should not be client-side. This is for the simulation/mock.
    MOCK_EMAIL: 'test',
    MOCK_PASSWORD: 'test',
    COMPANY_ID: 1,
  },
  FEATURES: {
    USE_MOCK_DATA: true, // Flag to easily toggle between Mock and Real API in future
    ENABLE_ANALYTICS: false,
  },
  APP: {
    NAME: 'Palma Marketplace',
    VERSION: '1.0.0',
    CURRENCY: 'ILS',
  }
};
