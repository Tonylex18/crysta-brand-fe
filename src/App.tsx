import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Navigation from './components/Navigation';
import Products from './components/Products';
import NewArrivals from './components/NewArrivals';
import TopRatedProducts from './components/TopRatedProducts';
import Collections from './components/Collections';
import BrandStory from './components/BrandStory';
// import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import HeroSection from './components/Hero';
import Features from './components/Features';
import Banner from './components/Banner';
import FlashSaleBanner from './components/FlashSaleBanner';
import Newsletter from './components/Newsletter';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Auth = lazy(() => import('./pages/Auth'));
const ProductsPage = lazy(() => import('./pages/Products'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Verifyemail = lazy(() => import('./pages/Verify.email'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DeliveryFee = lazy(() => import('./pages/DeliveryFee'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
      <div className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-500 shadow-sm">
        Loading page...
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-white">
              <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
              <Navigation />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={
                    <>
                      <HeroSection />
                      <Features />
                      <TopRatedProducts />
                      <Products />
                      <FlashSaleBanner />
                      <NewArrivals />
                      <Banner />
                      <Collections />
                      <BrandStory />
                      {/* <Testimonials /> */}
                     
                    </>
                  } />
                  <Route path="/auth" element={<Auth />} />
                  <Route path='/cart' element={<CartPage />} />
                  <Route path='/wishlist' element={<Wishlist />} />
                  <Route path='/checkout' element={<CheckoutPage />} />
                  <Route path='/checkout/success' element={<CheckoutSuccess />} />
                  <Route path='/verify-email' element={<Verifyemail />} />
                  <Route path='/dashboard' element={<Dashboard />} />
                  <Route path='/delivery-fee' element={<DeliveryFee />} />
                  <Route path='/product/:id' element={<ProductDetails />} />
                  <Route path='/products' element={<ProductsPage />} />
                  <Route path='/about' element={<AboutPage />} />
                  <Route path='/contact' element={<ContactPage />} />
                </Routes>
              </Suspense>
              <Newsletter />
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
