import { ChevronRight, Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { appendUserId, getUserId } from "../utils/navigation";
import { categoriesAPI, productsAPI, resolveImageUrl, subcategoriesAPI } from "../pages/lib/api";
import CategoryDropdown from "./category/CategoryDropdown";

const Navigation = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'categories' | 'main'>('categories');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navCategories, setNavCategories] = useState<Array<{ id: string; name: string; imageUrl?: string | null }>>([]);
  const [navSubcategories, setNavSubcategories] = useState<Array<{ id: string; name: string; parentId: string }>>([]);
  const [navProducts, setNavProducts] = useState<
    Array<{
      id: string;
      name: string;
      imageUrl?: string | null;
      categoryId?: string;
      categoryName?: string;
      parentCategoryId?: string;
      parentCategoryName?: string;
    }>
  >([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const userId = getUserId(user);
  // const deliveryPath = appendUserId('/delivery-fee', userId);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const menuItems = [
    { label: 'Shop', path: '/products', plus: true },
    { label: 'About', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact Us', path: '/contact' },
  ];

  const mobileMainMenuItems = [
    { label: 'About Us', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact Us', path: '/contact' },
    { label: 'Profile', path: '/dashboard', requiresAuth: true },
  ];

  useEffect(() => {
    let mounted = true;

    const loadNavbarCategories = async () => {
      try {
        const [categoriesResponse, subcategoriesResponse, productsResponse] = await Promise.all([
          categoriesAPI.getAll({ parent_id: "null" }),
          subcategoriesAPI.getAll({ limit: 200 }),
          productsAPI.getAll({ limit: 200, sort: "-createdAt", isActive: true }),
        ]);

        if (!mounted) return;

        const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];
        const subcategories = Array.isArray(subcategoriesResponse?.data) ? subcategoriesResponse.data : [];

        const topLevelCategories = categories
          .filter((category: any) => {
            const parent = category.parent_id;
            if (!parent) return true;
            if (parent === "null") return true;
            if (typeof parent === "object") return !parent.id && !parent._id;
            return false;
          })
          .map((category: any) => ({
            id: String(category.id || category._id || ""),
            name: String(category.name || ""),
            imageUrl: resolveImageUrl(category.image_url),
          }))
          .filter((category: any) => category.id && category.name);

        const normalizedSubcategories = subcategories
          .map((subcategory: any) => {
            const parent = subcategory.parent_id;
            const parentId =
              typeof parent === "object"
                ? String(parent.id || parent._id || "")
                : String(parent || "");

            return {
              id: String(subcategory.id || subcategory._id || ""),
              name: String(subcategory.name || ""),
              parentId,
            };
          })
          .filter((subcategory: any) => subcategory.id && subcategory.name && subcategory.parentId);

        const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
        const normalizedProducts = products
          .map((product: any) => {
            const category = product.category_id;
            const parent = typeof category === "object" ? category?.parent_id : null;

            return {
              id: String(product.id || product._id || ""),
              name: String(product.name || ""),
              imageUrl: resolveImageUrl(product.image_url),
              categoryId:
                typeof category === "object" ? String(category.id || category._id || "") : String(category || ""),
              categoryName: typeof category === "object" ? String(category.name || "") : "",
              parentCategoryId:
                typeof parent === "object"
                  ? String(parent.id || parent._id || "")
                  : typeof parent === "string"
                    ? parent
                    : "",
              parentCategoryName: typeof parent === "object" ? String(parent.name || "") : "",
            };
          })
          .filter((product: any) => product.id && product.name);

        setNavCategories(topLevelCategories);
        setNavSubcategories(normalizedSubcategories);
        setNavProducts(normalizedProducts);
        setActiveCategoryId(null);
      } catch {
        if (!mounted) return;
        setNavCategories([]);
        setNavSubcategories([]);
        setNavProducts([]);
        setActiveCategoryId(null);
      }
    };

    loadNavbarCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!userMenuRef.current?.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const featuredSearchCategories = useMemo(
    () =>
      navCategories.slice(0, 6).map((category) => {
        const productCount = navProducts.filter(
          (product) => product.parentCategoryId === category.id || (!product.parentCategoryId && product.categoryId === category.id),
        ).length;

        return {
          ...category,
          itemLabel: `${productCount} ${productCount === 1 ? "product" : "products"}`,
        };
      }),
    [navCategories, navProducts],
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredSearchCategories = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return navCategories.filter((category) => category.name.toLowerCase().includes(normalizedSearchQuery)).slice(0, 6);
  }, [navCategories, normalizedSearchQuery]);

  const filteredSearchSubcategories = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return navSubcategories.filter((subcategory) => subcategory.name.toLowerCase().includes(normalizedSearchQuery)).slice(0, 8);
  }, [navSubcategories, normalizedSearchQuery]);

  const filteredSearchProducts = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return navProducts
      .filter((product) => {
        const haystacks = [
          product.name,
          product.categoryName || "",
          product.parentCategoryName || "",
        ];
        return haystacks.some((value) => value.toLowerCase().includes(normalizedSearchQuery));
      })
      .slice(0, 8);
  }, [navProducts, normalizedSearchQuery]);

  const mobileCategoryList = useMemo(() => {
    if (!normalizedSearchQuery) return navCategories;
    return navCategories.filter((category) => category.name.toLowerCase().includes(normalizedSearchQuery));
  }, [navCategories, normalizedSearchQuery]);

  const navigateToProducts = (params: Record<string, string>) => {
    const nextParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      const normalizedValue = value.trim();
      if (normalizedValue) {
        nextParams.set(key, normalizedValue);
      }
    });

    setShowSearchModal(false);
    setShowCategories(false);
    setActiveCategoryId(null);
    setSearchQuery("");

    navigate(appendUserId(`/products${nextParams.toString() ? `?${nextParams.toString()}` : ""}`, userId));
  };

  const submitSearch = () => {
    if (!searchQuery.trim()) return;
    navigateToProducts({ q: searchQuery });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobilePanel('categories');
  };

  const handleMobileNavigate = (path: string) => {
    closeMobileMenu();
    navigate(appendUserId(path, userId));
  };

  const handleMobileSignOut = async () => {
    closeMobileMenu();
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs text-gray-700">
          <div className="flex items-center gap-3 sm:gap-6 font-medium">
            <button className="hover:text-gray-900">Account</button>
            <button className="hover:text-gray-900">Support</button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-700">
            <span className="font-medium sm:hidden">Call us</span>
            <span className="text-blue-700 font-semibold">+2347057263201</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 top-0 z-40 sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            <button onClick={() => navigate(appendUserId('/', userId))} className="hidden lg:flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-gray-900" />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-bold text-gray-900">Crysta</div>
                <div className="text-xs text-gray-500 -mt-1">Shop</div>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700">
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-10 h-10 rounded-full bg-[#b89f00] text-white flex items-center justify-center hover:bg-[#a58f00] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(appendUserId('/wishlist', userId))}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Heart className="w-4 h-4" />
                <span>Wishlist</span>
                <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              </button>
              <button
                onClick={() => navigate(appendUserId('/cart', userId))}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
              {user ? (
                <div ref={userMenuRef} className="relative flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((current) => !current)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b89f00] text-white ring-2 ring-[#1a24b8]/20 transition-transform hover:scale-[1.02]"
                  >
                    {user.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{user.name || 'Account'}</span>
                  {showUserMenu && (
                    <div className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] z-50">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{user.name || 'Account'}</p>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate(appendUserId('/dashboard', userId));
                          }}
                          className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setShowUserMenu(false);
                            await signOut();
                            navigate('/auth');
                          }}
                          className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#1a24b8] hover:text-[#1a24b8]"
                >
                  Sign In
                </button>
              )}
            </div>

            <div className="flex items-center justify-between lg:hidden w-full">
              <button
                type="button"
                onClick={() => {
                  setMobilePanel('categories');
                  setMobileMenuOpen(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate(appendUserId('/', userId))}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
                aria-label="Go to homepage"
              >
                <ShoppingCart className="w-8 h-8 text-gray-900" />
                <div className="leading-tight text-center">
                  <div className="text-xl font-bold text-gray-900">Crysta</div>
                  <div className="text-[11px] text-gray-500 -mt-1">Shop</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(appendUserId('/cart', userId))}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#12108b] px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-[#12108b] hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-white">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategories((current) => {
                      const next = !current;
                      setActiveCategoryId(null);
                      return next;
                    });
                  }}
                  className="flex items-center gap-3 px-4 py-2 transition-colors hover:border-white"
                >
                  <span className="w-6 h-6 rounded flex items-center justify-center">
                    <Menu className="w-4 h-4" />
                  </span>
                  <span>All Categories</span>
                </button>

                <CategoryDropdown
                  isOpen={showCategories}
                  categories={navCategories}
                  subcategories={navSubcategories}
                  activeCategoryId={activeCategoryId}
                  onHoverCategory={setActiveCategoryId}
                  onSelectCategory={(categoryId) => {
                    navigateToProducts({ category: categoryId });
                  }}
                  onSelectSubcategory={(subcategoryId) => {
                    navigateToProducts({ subcategory: subcategoryId });
                  }}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                />
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(appendUserId(item.path, userId))}
                  className="flex items-center gap-1 hover:text-yellow-300"
                >
                  <span>{item.label}</span>
                  {item.plus ? <span>+</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close mobile menu overlay"
              className="absolute inset-0 bg-black/35"
              onClick={closeMobileMenu}
            />

            <div className="relative h-full w-[82%] max-w-[360px] overflow-hidden bg-white shadow-[0_20px_50px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(appendUserId('/wishlist', userId))}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#12108b] transition-colors hover:bg-[#f4f3ff]"
                  aria-label="Open wishlist"
                >
                  <Heart className="h-5 w-5" />
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#12108b] px-1 text-[10px] font-semibold text-white">
                    {wishlistCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9f2f2f] text-white transition-colors hover:bg-[#842626]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-gray-200 px-4 py-4">
                <div className="flex overflow-hidden rounded-sm border border-gray-300">
                  <input
                    type="text"
                    placeholder="Search Product..."
                    className="h-11 flex-1 px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        closeMobileMenu();
                        submitSearch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      submitSearch();
                    }}
                    className="flex h-11 w-12 items-center justify-center bg-[#12108b] text-white transition-colors hover:bg-[#0c0a64]"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center text-[15px] font-semibold text-gray-900">
                  <button
                    type="button"
                    onClick={() => setMobilePanel('categories')}
                    className={`pr-4 ${mobilePanel === 'categories' ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    Categories
                  </button>
                  <span className="h-4 w-px bg-gray-300" />
                  <button
                    type="button"
                    onClick={() => setMobilePanel('main')}
                    className={`pl-4 ${mobilePanel === 'main' ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    Main Menu
                  </button>
                </div>
              </div>

              <div className="h-[calc(100%-140px)] overflow-y-auto pb-6">
                {mobilePanel === 'categories' ? (
                  <div className="px-3 py-3">
                    {mobileCategoryList.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          closeMobileMenu();
                          navigateToProducts({ category: category.id });
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#ece9ff] to-[#dfe9ff]" />
                          )}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-gray-800">{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </button>
                    ))}

                    {mobileCategoryList.length === 0 && (
                      <div className="px-3 py-8 text-sm text-gray-500">
                        No categories match “{searchQuery.trim()}”.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-4">
                    {user ? (
                      <div className="mb-4 rounded-2xl bg-[#f6f6fb] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Signed in as</p>
                        <p className="mt-2 text-base font-semibold text-gray-900">{user.name || 'Account'}</p>
                        <p className="mt-1 break-all text-sm text-gray-500">{user.email || ''}</p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      {mobileMainMenuItems
                        .filter((item) => !item.requiresAuth || Boolean(user))
                        .map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleMobileNavigate(item.path)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                          >
                            <span>{item.label}</span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        ))}

                      {/* <button
                        type="button"
                        onClick={() => handleMobileNavigate(deliveryPath)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        <span>Delivery Fee</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button> */}

                      {user ? (
                        <button
                          type="button"
                          onClick={handleMobileSignOut}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <span>Sign Out</span>
                          <ChevronRight className="h-4 w-4 text-red-300" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMobileNavigate('/auth')}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#12108b] transition-colors hover:bg-[#f4f3ff]"
                        >
                          <span>Sign In</span>
                          <ChevronRight className="h-4 w-4 text-[#12108b]" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm">
          <div className="bg-white max-w-4xl mx-auto mt-20 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {normalizedSearchQuery ? "Search Results" : "Browse Categories"}
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                }}
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
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitSearch();
                    }
                  }}
                />
                <button type="button" onClick={submitSearch} className="text-gray-500 hover:text-gray-700">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!normalizedSearchQuery ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredSearchCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => navigateToProducts({ category: category.id })}
                    className="flex items-center space-x-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#f4b4d9] to-[#8c7bff]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.itemLabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSearchCategories.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Categories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSearchCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => navigateToProducts({ category: category.id })}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-[#f4b4d9] to-[#8c7bff]" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredSearchSubcategories.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Subcategories</h3>
                    <div className="flex flex-wrap gap-2">
                      {filteredSearchSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          type="button"
                          onClick={() => navigateToProducts({ subcategory: subcategory.id })}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredSearchProducts.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSearchProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => navigateToProducts({ q: product.name })}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-[#dbeafe] to-[#c4b5fd]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{product.name}</p>
                            <p className="truncate text-sm text-gray-500">
                              {product.parentCategoryName || product.categoryName || 'Product'}
                              {product.categoryName && product.parentCategoryName ? ` / ${product.categoryName}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredSearchCategories.length === 0 &&
                  filteredSearchSubcategories.length === 0 &&
                  filteredSearchProducts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">
                      No categories or products match “{searchQuery.trim()}”.
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

    </>
  )
}

export default Navigation
