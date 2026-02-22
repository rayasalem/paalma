# Palma MVP - Multi-Vendor Marketplace

Palma is a comprehensive marketplace solution built with React and TypeScript, designed for the Palestinian market with full Arabic support. It features roles for Customers, Merchants, Brokers, and Admins.

## Features

- **Multi-Role System**: 
  - **Customers**: Browse, Search, Filter, Cart, Checkout, Reviews.
  - **Merchants**: Dashboard, Product Management, Order Fulfillment, FlashLine Shipping Integration.
  - **Brokers**: Market Overview, Sales Analytics, Commission Tracking.
  - **Admins**: User Approval, System Oversight.
- **Mock Integration**: 
  - Simulated Supabase backend via LocalStorage (Fallback).
  - Simulated Cloudinary Image Uploads.
  - Simulated FlashLine Shipping API.
- **UI/UX**:
  - Fully Responsive Tailwind Design.
  - RTL (Right-to-Left) Arabic layout.
  - Real-time feedback (toasts, loaders).

## Project Structure

```
/
├── components/      # UI Components (Auth, Layout)
├── lib/             # API Wrappers (Supabase, FlashLine)
├── services/        # Mock Services implementation
├── views/           # Role-specific Dashboards
├── supabase/        # Database Scripts
│   └── setup.sql    # Full DB Schema & Seed Script
├── types.ts         # TypeScript Interfaces
├── translations.ts  # Arabic Strings
├── App.tsx          # Main Entry & Routing
└── index.tsx        # Bootstrapper
```

## Database Setup (Supabase)

To enable the full backend features with Supabase:

1.  Create a new project at [database.new](https://database.new).
2.  Go to the **SQL Editor** in your Supabase Dashboard.
3.  Open `supabase/setup.sql` from this project.
4.  Copy and paste the entire content into the SQL Editor.
5.  Click **Run**.

This script will:
*   Create all necessary tables (`users`, `products`, `orders`, etc.).
*   Disable Row Level Security (RLS) for easy development access.
*   Populate the database with realistic mock data for all roles.

## Environment Variables

Copy `.env.example` to `.env` and fill in the details.

```bash
cp .env.example .env
```

Required keys for full functionality:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Setup & Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
3. **Build**:
   ```bash
   npm run build
   ```
