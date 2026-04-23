import { Suspense, lazy, useEffect, useState } from 'react';
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
import PagePreloader from './components/PagePreloader';
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
const FaqPage = lazy(() => import('./pages/Faq'));

function RouteFallback() {
  return <PagePreloader label="Loading the next page" />;
}

function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  useEffect(() => {
    const minDisplayTimer = window.setTimeout(() => {
      setShowInitialLoader(false);
    }, 1600);

    return () => {
      window.clearTimeout(minDisplayTimer);
    };
  }, []);

  if (showInitialLoader) {
    return <PagePreloader fullscreen label="Setting the mood for your next look" />;
  }

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
                  <Route path='/faq' element={<FaqPage />} />
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
