import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navigation from './components/Navigation';
import Products from './components/Products';
import Collections from './components/Collections';
import BrandStory from './components/BrandStory';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import HeroSection from './components/Hero';
import Features from './components/Features';
import Banner from './components/Banner';
import Newsletter from './components/Newsletter';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import PaymentCallback from './pages/PaymentCallback';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verifyemail from './pages/Verify.email';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
            <Navigation />
            <Routes>
              <Route path="/" element={
                <>
                  <HeroSection />
                  <Features />
                  <Products />
                  <Banner />
                  <Collections />
                  <BrandStory />
                  <Testimonials />
                  <Newsletter />
                  <Footer />
                </>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path='/cart' element={<CartPage />} />
              <Route path='/checkout' element={<CheckoutPage />} />
              <Route path='/payment/callback' element={<PaymentCallback />} />
              <Route path='/verify-email' element={<Verifyemail />} />
              <Route path='/dashboard' element={<Dashboard />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
