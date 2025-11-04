# Crysta - Premium E-Commerce Fashion Brand

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```


## Project Structure

```
crysta-ecommerce/
├── src/
│   ├── components/          # React components
│   │   ├── Navigation.tsx   # Header navigation
│   │   ├── Hero.tsx         # Hero section
│   │   ├── Products.tsx     # Product grid
│   │   ├── Collections.tsx  # Category collections
│   │   ├── BrandStory.tsx   # About section
│   │   ├── Testimonials.tsx # Customer reviews
│   │   ├── Footer.tsx       # Footer
│   │   ├── AuthModal.tsx    # Auth modal
│   │   ├── CartModal.tsx    # Shopping cart
│   │   ├── ProductModal.tsx # Product details
│   │   └── CheckoutModal.tsx # Checkout form
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── CartContext.tsx  # Shopping cart state
│   ├── lib/                 # Utilities
│   │   └── supabase.ts      # Supabase client
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── supabase/
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

## Production Build

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist/` directory.