import { ChevronDown, Menu, Phone, Search, ShoppingCart, User, X } from "lucide-react"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext"; // <-- Add this import
import { toast } from "react-toastify";

const Navigation = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart(); // <-- Get cartCount from context
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const isAuthenticated = !!(user || authToken);

  const categories = [
    { name: 'Furniture', items: '240 Item Available', icon: '🛋️' },
    { name: 'Headphone', items: '240 Item Available', icon: '🎧' },
    { name: 'Shoe', items: '240 Item Available', icon: '👟' },
    { name: 'Bag', items: '240 Item Available', icon: '👜' },
    { name: 'Laptop', items: '240 Item Available', icon: '💻' },
    { name: 'Book', items: '240 Item Available', icon: '📚' }
  ];

  const menuItems = ['Deals', "What's New", 'Delivery'];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>+00123456789</span>
          </div>
          <div className="md:flex hidden items-center space-x-6">
            <span>Get 50% Off on Selected Items</span>
            <span className="hidden sm:inline">|</span>
            <button className="underline font-medium">Shop Now</button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1">
              <span>Eng</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 top-0 z-40 sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() =>  navigate('/')} className="flex items-center pointer space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">Crysta</span>
              </button>

              <div className="hidden lg:flex items-center space-x-8">
                <div
                  onMouseEnter={() => setShowCategories(true)}
                  onMouseLeave={() => setShowCategories(false)}
                  className="relative h-16 flex items-center"
                >
                  <button
                    className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium"
                  >
                    <span>Categories</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {menuItems.map((item) => (
                  <button
                    key={item}
                    className="text-gray-700 hover:text-green-600 font-medium relative"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
                <button onClick={() => setShowSearchModal(true)}>
                  <Search className="w-5 h-5 text-gray-500" />
                </button>

              <button className="p-2 hover:bg-gray-100 rounded-full relative">
                <ShoppingCart className="w-5 h-5 text-gray-700" onClick={() => navigate('/cart')} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="relative">
                {!isAuthenticated ? (
                  <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => navigate('/auth')}>
                    <User className="w-5 h-5 text-gray-700" />
                  </button>
                ) : (
                  <>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowUserMenu((v) => !v)}
                    >
                      <User className="w-5 h-5 text-gray-700" />
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                        <div className="px-4 py-2 text-sm text-gray-600 border-b">{user?.email || 'Account'}</div>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/dashboard');
                          }}
                        >
                          Dashboard
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={async () => {
                            try {
                              await signOut();
                              toast.success('Logged out');
                              setShowUserMenu(false);
                              navigate('/');
                            } catch (e) {
                              toast.error('Logout failed');
                            }
                          }}
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <button className="block w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
                Categories
              </button>
              {menuItems.map((item) => (
                <button
                  key={item}
                  className="block w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm">
          <div className="bg-white max-w-4xl mx-auto mt-20 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                <input
                  type="text"
                  placeholder="Search Product"
                  className="bg-transparent flex-1 outline-none"
                />
                <Search className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className="flex items-center space-x-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <div className="text-4xl">{category.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-600">{category.items}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Dropdown */}
      {showCategories && (
        <div
          className="fixed top-[64px] left-0 right-0 bg-white border-t border-b border-gray-200 shadow-lg z-30"
          onMouseEnter={() => setShowCategories(true)}
          onMouseLeave={() => setShowCategories(false)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className="flex flex-col items-center space-y-2 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="text-4xl">{category.icon}</div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-xs text-gray-600">{category.items}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation