# Crysta E-Commerce - Architecture Overview

## Application Structure

```
┌─────────────────────────────────────────┐
│           App.tsx (Root)                │
│  ┌───────────────────────────────────┐  │
│  │   AuthProvider (Context)          │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  CartProvider (Context)     │  │  │
│  │  │                             │  │  │
│  │  │  - Navigation               │  │  │
│  │  │  - Hero Section             │  │  │
│  │  │  - Products Grid            │  │  │
│  │  │  - Collections              │  │  │
│  │  │  - Brand Story              │  │  │
│  │  │  - Testimonials             │  │  │
│  │  │  - Footer                   │  │  │
│  │  │                             │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## State Management

### AuthContext
**Purpose**: Manages user authentication state across the app

**State**:
- `user`: Current authenticated user
- `loading`: Auth loading state

**Methods**:
- `signIn(email, password)`: Sign in user
- `signUp(email, password)`: Register new user
- `signOut()`: Sign out user

**Used By**: All components requiring auth (Cart, Checkout, etc.)

### CartContext
**Purpose**: Manages shopping cart state and operations

**State**:
- `cartItems`: Array of cart items with product details
- `loading`: Cart loading state
- `cartTotal`: Total price of all items
- `cartCount`: Total quantity of items

**Methods**:
- `addToCart(productId, size, color, quantity)`: Add item to cart
- `removeFromCart(itemId)`: Remove item from cart
- `updateQuantity(itemId, quantity)`: Update item quantity
- `clearCart()`: Remove all items from cart

**Used By**: Products, ProductModal, CartModal, CheckoutModal

## Component Hierarchy

### Main Components

```
App
├── Navigation
│   ├── AuthModal (conditional)
│   └── CartModal (conditional)
│
├── Hero
│
├── Products
│   └── ProductModal (conditional)
│
├── Collections
│
├── BrandStory
│
├── Testimonials
│
└── Footer
```

### Modal Components

```
AuthModal
- Sign In / Sign Up forms
- Toggle between modes
- Error handling

CartModal
- Cart items list
- Quantity controls
- Total calculation
- Checkout trigger

ProductModal
- Product details
- Size selection
- Color selection
- Quantity picker
- Add to cart

CheckoutModal
- Shipping address form
- Order summary
- Order creation
```

## Data Flow

### Authentication Flow
```
User clicks account icon
    ↓
AuthModal opens
    ↓
User enters credentials
    ↓
Form submitted to Supabase Auth
    ↓
Session created
    ↓
AuthContext updates user state
    ↓
UI updates across app
```

### Shopping Flow
```
User browses products
    ↓
Clicks product card
    ↓
ProductModal opens
    ↓
Selects size, color, quantity
    ↓
Clicks "Add to Cart"
    ↓
CartContext.addToCart() called
    ↓
Item saved to Supabase
    ↓
CartContext updates
    ↓
Cart counter updates in Navigation
```

### Checkout Flow
```
User opens cart
    ↓
Reviews items
    ↓
Clicks "Proceed to Checkout"
    ↓
CheckoutModal opens
    ↓
Fills shipping form
    ↓
Submits order
    ↓
Order saved to Supabase
    ↓
Cart cleared
    ↓
Success message shown
```

## Database Schema

### Tables

**categories**
- id (uuid, primary key)
- name (text, unique)
- slug (text, unique)
- description (text)
- image_url (text)
- created_at (timestamp)

**products**
- id (uuid, primary key)
- name (text)
- slug (text, unique)
- description (text)
- price (numeric)
- category_id (uuid, foreign key)
- image_url (text)
- images (jsonb)
- sizes (text array)
- colors (text array)
- stock (integer)
- featured (boolean)
- created_at (timestamp)

**cart_items**
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- product_id (uuid, foreign key to products)
- quantity (integer)
- size (text)
- color (text)
- created_at (timestamp)
- UNIQUE(user_id, product_id, size, color)

**orders**
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- status (text)
- total (numeric)
- shipping_address (jsonb)
- created_at (timestamp)

**order_items**
- id (uuid, primary key)
- order_id (uuid, foreign key to orders)
- product_id (uuid, foreign key to products)
- quantity (integer)
- size (text)
- color (text)
- price (numeric)
- created_at (timestamp)

**testimonials**
- id (uuid, primary key)
- name (text)
- avatar_url (text)
- rating (integer)
- comment (text)
- created_at (timestamp)

## Security (RLS Policies)

### Public Read Access
- Products (all users)
- Categories (all users)
- Testimonials (all users)

### Authenticated User Access
- Cart Items (own items only)
- Orders (own orders only)
- Order Items (via orders relationship)

### Policy Examples

```sql
-- Users can only view their own cart items
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only create orders for themselves
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## API Integration

### Supabase Client
**Location**: `src/lib/supabase.ts`

**Configuration**:
- URL: From environment variable `VITE_SUPABASE_URL`
- Anon Key: From environment variable `VITE_SUPABASE_ANON_KEY`

**Usage**:
```typescript
import { supabase } from './lib/supabase';

// Query products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('featured', true);

// Insert cart item
const { error } = await supabase
  .from('cart_items')
  .insert({ user_id, product_id, quantity, size, color });
```

## Styling Architecture

### TailwindCSS Configuration
- Custom color: `crysta-blue` (#00CFFF)
- System font stack for optimal rendering
- Responsive breakpoints: sm, md, lg, xl

### Animation Strategy
- Framer Motion for component animations
- CSS transitions for hover effects
- Scroll-based animations with viewport detection

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Performance Optimizations

### Build Optimizations
- Vite for fast builds
- Code splitting
- Tree shaking
- Asset optimization
- Gzip compression

### Runtime Optimizations
- React Context for state management (minimal re-renders)
- Lazy loading of modals
- Image optimization via external CDN (Pexels)
- Efficient database queries with RLS

### Bundle Size
- Main JS: ~438 KB (130 KB gzipped)
- Main CSS: ~25 KB (5 KB gzipped)
- Total: ~463 KB (~135 KB gzipped)

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Type Checking**: `npm run typecheck`
3. **Linting**: `npm run lint`
4. **Production Build**: `npm run build`
5. **Preview Build**: `npm run preview`

## Deployment Checklist

- [ ] Apply database migration
- [ ] Verify environment variables
- [ ] Run production build
- [ ] Test authentication flow
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Verify responsive design
- [ ] Check console for errors
- [ ] Test on multiple browsers

## Future Considerations

### Scalability
- Add Redis for session management
- Implement CDN for static assets
- Add image optimization service
- Database indexing for search

### Features
- Full-text search
- Product recommendations
- Inventory management
- Email notifications
- Analytics integration

### Performance
- Implement virtual scrolling for large lists
- Add service worker for offline support
- Optimize images with WebP format
- Implement caching strategy
