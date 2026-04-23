import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type CacheMatcher = string | RegExp;
type CachedGetOptions = {
  params?: Record<string, unknown>;
  ttlMs?: number;
  scope: 'public' | 'auth';
};

const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflightGetRequests = new Map<string, Promise<unknown>>();

const serializeParams = (params?: Record<string, unknown>) => {
  if (!params) return '';

  const search = new URLSearchParams();
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => search.append(key, String(entry)));
        return;
      }
      search.append(key, String(value));
    });

  return search.toString();
};

const getAuthCacheIdentity = () => {
  if (typeof window === 'undefined') return 'server';
  return window.localStorage.getItem('authToken') || 'guest';
};

const buildCacheKey = (url: string, options: CachedGetOptions) => {
  const paramString = serializeParams(options.params);
  const scopeKey = options.scope === 'auth' ? `auth:${getAuthCacheIdentity()}` : 'public';
  return `${scopeKey}:${url}${paramString ? `?${paramString}` : ''}`;
};

const invalidateCachedGets = (matchers: CacheMatcher[]) => {
  for (const key of [...responseCache.keys(), ...inflightGetRequests.keys()]) {
    const shouldInvalidate = matchers.some((matcher) =>
      typeof matcher === 'string' ? key.includes(matcher) : matcher.test(key),
    );

    if (shouldInvalidate) {
      responseCache.delete(key);
      inflightGetRequests.delete(key);
    }
  }
};

const cachedGet = async <T>(
  client: typeof api | typeof publicApi,
  url: string,
  options: CachedGetOptions,
): Promise<T> => {
  const ttlMs = options.ttlMs ?? 30_000;
  const cacheKey = buildCacheKey(url, options);
  const now = Date.now();

  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const inflight = inflightGetRequests.get(cacheKey);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = client
    .get(url, { params: options.params })
    .then((response) => {
      responseCache.set(cacheKey, {
        expiresAt: now + ttlMs,
        data: response.data,
      });
      return response.data as T;
    })
    .finally(() => {
      inflightGetRequests.delete(cacheKey);
    });

  inflightGetRequests.set(cacheKey, request);
  return request;
};

// Types
export type Product = {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  price?: number;
  price_kobo?: number;
  originalPrice?: number;
  original_price?: number;
  originalPriceKobo?: number;
  original_price_kobo?: number;
  displayPrice?: number;
  display_price?: number;
  displayPriceKobo?: number;
  display_price_kobo?: number;
  rating?: number;
  rating_count?: number;
  compareAtPrice?: number;
  displayCompareAtPrice?: number;
  display_compare_at_price?: number;
  weight_grams?: number;
  is_fragile?: boolean;
  is_oversize?: boolean;
  category_id?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        slug?: string;
        parent_id?:
          | string
          | {
              _id?: string;
              id?: string;
              name?: string;
              slug?: string;
            }
          | null;
      }
    | null;
  image_url?: string | null;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  featured?: boolean;
  tags?: string[];
  discountPercentage?: number;
  flashSaleActive?: boolean;
  flash_sale_active?: boolean;
  flashSaleName?: string;
  flash_sale_name?: string;
  flashSaleDiscountPercentage?: number;
  flash_sale_discount_percentage?: number;
  stockStatus?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FlashSale = {
  id: string;
  title: string;
  subtitle?: string;
  discountPercentage: number;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
  ctaLabel?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  phone?: string;
};

export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  price_kobo: number;
  weight_grams: number;
  is_fragile: boolean;
  is_oversize: boolean;
  selected_size?: string;
  selected_color?: string;
  image_url?: string | null;
  quantity: number;
};

export type CartResponse = {
  cart_id: string | null;
  user_id: string;
  items: CartItem[];
  items_subtotal_kobo: number;
  updated_at: string | null;
};

export type SavedAddress = {
  _id?: string;
  state: string;
  city: string;
  street: string;
  landmark?: string;
  phone: string;
  is_default?: boolean;
};

export type PricingSnapshot = {
  items_subtotal_kobo: number;
  discounts_total_kobo: number;
  shipping_fee_kobo: number;
  tax_kobo: number;
  grand_total_kobo: number;
};

export type ShippingOption = {
  option_id: string;
  service_type: 'standard' | 'express' | 'pickup';
  price_kobo: number;
  eta_min_days: number;
  eta_max_days: number;
  pickup_hubs?: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  }>;
  zone_name: string;
};

export type CheckoutResponse = {
  checkout_id: string;
  checkout_status: string;
  pricing_snapshot: PricingSnapshot;
  snapshot_version: number;
};

export type CheckoutAddressResponse = {
  available_shipping_options: ShippingOption[];
  checkout: {
    id: string;
    status: string;
    pricing_snapshot: PricingSnapshot;
    snapshot_version: number;
  };
};

export type CheckoutSelectResponse = {
  checkout: {
    id: string;
    status: string;
    pricing_snapshot: PricingSnapshot;
    snapshot_version: number;
    shipping_option: {
      option_id: string;
      service_type: 'standard' | 'express' | 'pickup';
      fee_kobo: number;
      eta_min_days: number;
      eta_max_days: number;
      pickup_hub_id?: string | null;
      zone_name: string;
    };
  };
};

export type Order = {
  _id: string;
  status: string;
  order_status?: string;
  payment_status?: string;
  payment_reference?: string;
  payment: {
    reference: string;
    status: string;
    paid_at?: string;
  };
  totals: PricingSnapshot;
  address: {
    state: string;
    city: string;
    street: string;
    landmark?: string;
    phone: string;
  };
  items: Array<{
    id?: string;
    _id?: string;
    product_id: string;
    name: string;
    price_kobo: number;
    selected_size?: string;
    selected_color?: string;
    quantity: number;
  }>;
  createdAt?: string;
};

export type WishlistItem = {
  id: string;
  product: Product;
  createdAt?: string;
};

export type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string | null;
  };
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
    rating?: number;
    rating_count?: number;
  };
  order?: {
    id: string;
    createdAt?: string;
  };
};

export type PendingReviewItem = {
  order_id: string;
  order_created_at?: string;
  product_id: string;
  product_name: string;
  image_url?: string | null;
  quantity: number;
  rating?: number;
  rating_count?: number;
};

export type LocationState = {
  id: string;
  name: string;
  capital?: string;
};

export type LocationCity = {
  id: string;
  name: string;
  state_id: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type ApiPagination = {
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalProducts?: number;
  totalCategories?: number;
  totalSubcategories?: number;
};

export type ApiCollectionResponse<T> = {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: ApiPagination;
};

export type ApiItemResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type CategoryRecord = {
  id?: string;
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  parent_id?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        slug?: string;
      }
    | null;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const koboToNaira = (kobo: number) => (kobo / 100).toFixed(2);
export const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
export const getProductDisplayPriceKobo = (product: Product) => {
  if (typeof product.display_price_kobo === 'number') return product.display_price_kobo;
  if (typeof product.displayPriceKobo === 'number') return product.displayPriceKobo;
  if (typeof product.price_kobo === 'number') return product.price_kobo;
  if (typeof product.price === 'number') return Math.round(product.price * 100);
  return 0;
};

export const getProductDisplayPrice = (product: Product) => getProductDisplayPriceKobo(product) / 100;

export const getProductOriginalPriceKobo = (product: Product) => {
  if (typeof product.original_price_kobo === 'number') return product.original_price_kobo;
  if (typeof product.originalPriceKobo === 'number') return product.originalPriceKobo;
  if (typeof product.price_kobo === 'number') return product.price_kobo;
  if (typeof product.price === 'number') return Math.round(product.price * 100);
  return 0;
};

export const getProductCompareAtPrice = (product: Product) => {
  if (typeof product.display_compare_at_price === 'number') return product.display_compare_at_price;
  if (typeof product.displayCompareAtPrice === 'number') return product.displayCompareAtPrice;
  if (typeof product.compareAtPrice === 'number') return product.compareAtPrice;
  return undefined;
};

export const isProductOnSale = (product: Product) => {
  const compareAt = getProductCompareAtPrice(product);
  return typeof compareAt === 'number' && compareAt * 100 > getProductDisplayPriceKobo(product);
};

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, name?: string, phone?: string) => {
    const response = await api.post('user/sign-up', { email, password, name, phone });
    return response.data;
  },
  signIn: async (email: string, password: string) => {
    const response = await api.post('user/login', { email, password });
    return response.data;
  },
};

export const newsletterAPI = {
  subscribe: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await publicApi.post("newsletter/subscribe", { email });
    return response.data;
  },
};

export const contactAPI = {
  sendMessage: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string; contact_message: ContactMessage }> => {
    const response = await publicApi.post("contact", payload);
    return response.data;
  },
};

export const accountAPI = {
  updatePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('user/update-password', payload);
    return response.data;
  },
};

// User addresses
export const userAPI = {
  getAddresses: async (): Promise<{ addresses: SavedAddress[] }> => {
    return cachedGet(api, 'user/addresses', { scope: 'auth', ttlMs: 15_000 });
  },
  saveAddress: async (payload: {
    state: string;
    city: string;
    street: string;
    landmark?: string;
    phone: string;
    set_default?: boolean;
  }): Promise<{ addresses: SavedAddress[] }> => {
    const response = await api.post('user/addresses', payload);
    invalidateCachedGets(['user/addresses']);
    return response.data;
  },
};

// Email verification API
export const verificationAPI = {
  verifyEmail: async (email: string, otp: string | number) => {
    const response = await api.post('user/verify-user-mail', { email, otp });
    return response.data;
  },
  resendOtp: async (email: string) => {
    const response = await api.post('user/request-new-otp', { email });
    return response.data;
  },
};

// Locations API
export const locationsAPI = {
  getStates: async (): Promise<{ states: LocationState[] }> => {
    return cachedGet(publicApi, 'locations/states', { scope: 'public', ttlMs: 60_000 });
  },
  getCitiesByStateId: async (stateId: string): Promise<{ cities: LocationCity[] }> => {
    return cachedGet(publicApi, `locations/states/${stateId}/cities`, { scope: 'public', ttlMs: 60_000 });
  },
  getCitiesByStateName: async (state: string): Promise<{ cities: LocationCity[] }> => {
    return cachedGet(publicApi, 'locations/cities', { params: { state }, scope: 'public', ttlMs: 60_000 });
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiCollectionResponse<Product>> => {
    return cachedGet(publicApi, 'products/get-products', { params, scope: 'public', ttlMs: 60_000 });
  },
  getFeatured: async (limit: number = 10): Promise<ApiCollectionResponse<Product>> => {
    return cachedGet(publicApi, 'products/get-featured', { params: { limit }, scope: 'public', ttlMs: 60_000 });
  },
  getTopRated: async (limit: number = 10): Promise<ApiCollectionResponse<Product>> => {
    return cachedGet(publicApi, 'products/get-top-rated', { params: { limit }, scope: 'public', ttlMs: 60_000 });
  },
  getById: async (id: string): Promise<ApiItemResponse<Product>> => {
    return cachedGet(publicApi, `products/get-single-product/${id}`, { scope: 'public', ttlMs: 60_000 });
  },
  getByCategory: async (categoryId: string): Promise<ApiCollectionResponse<Product>> => {
    return cachedGet(publicApi, `products/category/${categoryId}`, { scope: 'public', ttlMs: 60_000 });
  },
};

export const flashSalesAPI = {
  getActive: async (): Promise<ApiItemResponse<FlashSale | null>> => {
    return cachedGet(publicApi, 'flash-sales/active', { scope: 'public', ttlMs: 30_000 });
  },
};

export const categoriesAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiCollectionResponse<CategoryRecord>> => {
    return cachedGet(publicApi, 'categories/get-all-categories', { params, scope: 'public', ttlMs: 60_000 });
  },
};

export const subcategoriesAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiCollectionResponse<CategoryRecord>> => {
    return cachedGet(publicApi, 'subcategories/get-all-subcategories', { params, scope: 'public', ttlMs: 60_000 });
  },
};

// Cart API
export const cartAPI = {
  get: async (): Promise<CartResponse> => {
    return cachedGet(api, 'cart', { scope: 'auth', ttlMs: 5_000 });
  },
  addItem: async (
    productId: string,
    quantity: number = 1,
    options?: { selectedSize?: string | null; selectedColor?: string | null },
  ): Promise<CartResponse> => {
    const response = await api.post('cart/items', {
      product_id: productId,
      quantity,
      selected_size: options?.selectedSize || undefined,
      selected_color: options?.selectedColor || undefined,
    });
    invalidateCachedGets(['cart']);
    return response.data;
  },
  updateItem: async (itemId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.put(`cart/items/${itemId}`, { quantity });
    invalidateCachedGets(['cart']);
    return response.data;
  },
  removeItem: async (itemId: string): Promise<CartResponse> => {
    const response = await api.delete(`cart/items/${itemId}`);
    invalidateCachedGets(['cart']);
    return response.data;
  },
  clear: async (): Promise<CartResponse> => {
    const response = await api.delete('cart');
    invalidateCachedGets(['cart']);
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  list: async (): Promise<{ items: WishlistItem[] }> => {
    return cachedGet(api, 'wishlist', { scope: 'auth', ttlMs: 15_000 });
  },
  add: async (productId: string): Promise<{ item: WishlistItem }> => {
    const response = await api.post('wishlist/items', { product_id: productId });
    invalidateCachedGets(['wishlist']);
    return response.data;
  },
  remove: async (productId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`wishlist/items/${productId}`);
    invalidateCachedGets(['wishlist']);
    return response.data;
  },
};

export const reviewsAPI = {
  listProductReviews: async (productId: string): Promise<{ reviews: Review[] }> => {
    return cachedGet(publicApi, `reviews/product/${productId}`, { scope: 'public', ttlMs: 15_000 });
  },
  listMyReviews: async (): Promise<{ reviews: Review[] }> => {
    return cachedGet(api, 'reviews/me', { scope: 'auth', ttlMs: 15_000 });
  },
  listPending: async (): Promise<{ items: PendingReviewItem[] }> => {
    return cachedGet(api, 'reviews/me/pending', { scope: 'auth', ttlMs: 15_000 });
  },
  create: async (payload: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<{ review: Review }> => {
    const response = await api.post('reviews', payload);
    invalidateCachedGets(['reviews/me', 'reviews/me/pending', `reviews/product/${payload.productId}`]);
    return response.data;
  },
  update: async (id: string, payload: {
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<{ review: Review }> => {
    const response = await api.put(`reviews/${id}`, payload);
    invalidateCachedGets(['reviews/me', 'reviews/me/pending', /^public:reviews\/product\//]);
    return response.data;
  },
};

// Checkout API
export const checkoutAPI = {
  start: async (): Promise<CheckoutResponse> => {
    const response = await api.post('checkout/start');
    return response.data;
  },
  setAddress: async (checkoutId: string, payload: {
    state: string;
    city: string;
    street: string;
    landmark?: string;
    phone: string;
  }): Promise<CheckoutAddressResponse> => {
    const response = await api.post(`checkout/${checkoutId}/address`, payload);
    invalidateCachedGets(['user/addresses']);
    return response.data;
  },
  selectShipping: async (checkoutId: string, optionId: string): Promise<CheckoutSelectResponse> => {
    const response = await api.post(`checkout/${checkoutId}/select-shipping`, { option_id: optionId });
    return response.data;
  },
  initPayment: async (checkoutId: string): Promise<{ authorization_url: string; reference: string }> => {
    const response = await api.post(`checkout/${checkoutId}/init-payment`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  list: async (): Promise<{ orders: Order[] }> => {
    return cachedGet(api, 'orders', { scope: 'auth', ttlMs: 15_000 });
  },
  getByReference: async (reference: string): Promise<Order> => {
    return cachedGet(api, `orders/by-reference/${reference}`, { scope: 'auth', ttlMs: 15_000 });
  },
  getById: async (id: string): Promise<Order> => {
    return cachedGet(api, `orders/${id}`, { scope: 'auth', ttlMs: 15_000 });
  },
};

// Payments API
export const paymentsAPI = {
  verify: async (reference: string): Promise<{ status: string; order?: Order }> => {
    const response = await api.get(`payments/verify/${reference}`);
    invalidateCachedGets(['orders']);
    return response.data;
  },
};

// Payment API (legacy)
export const paymentAPI = {
  verify: async (reference: string) => {
    const response = await api.get(`payments/verify/${reference}`);
    return response.data;
  },
};

// Delivery fee (legacy)
export type DeliveryQuoteResponse = {
  success: boolean;
  message?: string;
  fee: number;
  currency: string;
  stateCode: string;
  stateName: string;
  zone: string;
  pricingType: string;
  distanceKm?: number;
  breakdown?: Record<string, number>;
};

export type DeliveryStateMeta = {
  stateCode: string;
  stateName: string;
  zone: string;
  pricingType: string;
  requiresCoordinates: boolean;
  requiresWeight: boolean;
  minWeightKg?: number;
  maxWeightKg?: number;
  maxDistanceKm?: number;
};

export const deliveryPricingAPI = {
  getStates: async (): Promise<DeliveryStateMeta[]> => {
    const response = await publicApi.get('delivery/states');
    return response.data.states || [];
  },
  getQuote: async (payload: {
    customerState: string;
    customerCity?: string;
    coordinates?: { lat: number; lng: number };
    packageWeightKg?: number;
    includeBreakdown?: boolean;
  }): Promise<DeliveryQuoteResponse> => {
    const response = await publicApi.post('delivery/quote', payload);
    return response.data;
  },
};

export type DeliveryInfo = {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  address: string;
  state?: string | null;
  cityTown: string;
  zipCode: string;
  mobile: string;
  email: string;
};

export type DeliveryInfoPayload = {
  firstName?: string;
  lastName?: string;
  address: string;
  state?: string | null;
  cityTown: string;
  zipCode: string;
  mobile: string;
  email?: string;
};

export const deliveryAPI = {
  getDeliveryInfo: async (): Promise<ApiItemResponse<DeliveryInfo>> => {
    return cachedGet(api, 'user/get-delivery-details', { scope: 'auth', ttlMs: 15_000 });
  },
  addDeliveryInfo: async (payload: DeliveryInfoPayload): Promise<ApiItemResponse<DeliveryInfo>> => {
    const response = await api.post('user/delivery-information', payload);
    invalidateCachedGets(['user/get-delivery-details']);
    return response.data;
  },
  updateDeliveryInfo: async (payload: Partial<DeliveryInfoPayload>): Promise<ApiItemResponse<DeliveryInfo>> => {
    const response = await api.put('user/update-delivery-information', payload);
    invalidateCachedGets(['user/get-delivery-details']);
    return response.data;
  },
};

export const resolveImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL.replace('/api', '')}/${url.replace(/^\//, '')}`;
};
