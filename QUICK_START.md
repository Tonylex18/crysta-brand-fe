# Quick Start Guide - Crysta E-Commerce

## One-Time Setup (Required)

### Configure Environment Variables

Create a file named `.env` at the project root with your Supabase credentials:

```bash
# .env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

You can find these in your Supabase project under Settings → API.

### Apply Database Migration

Before using the application, you must apply the database migration:

1. Open your own Supabase project dashboard URL (from your Supabase account)
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Open the file locally: `supabase/migrations/20250101000000_initial_schema.sql`
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run**

That's it! Your database is now set up with:
- 4 product categories
- 6 sample products
- 3 customer testimonials
- All necessary tables and security policies

## Using the Application
First, install dependencies and start the dev server:

```bash
npm install
npm run dev
```


### Browse Products
- No login required
- Click on products to view details
- Use price filters to narrow down selection

### Create an Account
1. Click the user icon in the top right
2. Select "Sign Up"
3. Enter your email and password (min 6 characters)
4. You're ready to shop!

### Shopping
1. Sign in to your account
2. Click "Add to Cart" on any product
3. Choose size and color in the product modal
4. Adjust quantity as needed
5. Click the cart icon to review your items

### Checkout
1. Open your cart
2. Click "Proceed to Checkout"
3. Fill in your shipping address
4. Click "Place Order"
5. Order confirmation will appear

## Key Features to Try

- **Smooth Animations**: Watch the hero section animations
- **Product Filters**: Filter by price range
- **Responsive Design**: Try on mobile, tablet, and desktop
- **Testimonials**: Click through customer reviews
- **Collections**: Explore different product categories
- **Cart Management**: Add, remove, and update quantities

## Demo Note

This is a demo MVP. No real payments are processed. All checkout orders are saved to the database for demonstration purposes.

## Need Help?

See the full README.md for detailed information about features, architecture, and customization options.
