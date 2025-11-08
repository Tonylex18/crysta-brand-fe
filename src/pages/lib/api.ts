import axios from 'axios';

// API base URL - will be configured based on environment
const RAW_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api/';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await authAPI.refreshToken();
        localStorage.setItem('authToken', refreshResponse.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('authToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Type definitions
export type User = {
  id: string;
  email: string;
  name?: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  created_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
  created_at: string;
  product?: Product;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

// Auth API
export const authAPI = {
  signUp: async (name: string, email: string, password: string) => {
    const response = await api.post('user/sign-up', { name, email, password });
    const data = response.data;
    return {
      user: data.user,
      token: data.accessToken,
    };
  },
  
  signIn: async (email: string, password: string) => {
    const response = await api.post('user/login', { email, password });
    const data = response.data;
    return {
      user: data.user,
      token: data.accessToken,
    };
  },
  
  getProfile: async () => {
    const response = await api.get('user/profile');
    return response.data;
  },
  
  signOut: async () => {
    const response = await api.post('auth/signout');
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await api.post('user/refresh-token');
    return response.data;
  },
};

// Email verification API (user routes)
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

// Products API
export const productsAPI = {
  getAll: async () => {
    const response = await api.get('products/get-products');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`products/${id}`);
    return response.data;
  },
  
  getByCategory: async (categoryId: string) => {
    const response = await api.get(`products/category/${categoryId}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('categories');
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  getItems: async () => {
    const response = await api.get('cart/get-cart');
    return response.data;
  },
  
  addItem: async (productId: string, size: string, price: number, color: string, quantity: number = 1) => {
    const response = await api.post('cart/add-cart', { productId, size, color, price, quantity });
    return response.data;
  },
  
  updateItem: async (itemId: string, quantity: number) => {
    console.log('API: updateItem called with itemId:', itemId, 'quantity:', quantity);
    const response = await api.put(`cart/update-cart/${itemId}`, { quantity });
    console.log('API: updateItem response:', response.data);
    return response.data;
  },
  
  removeItem: async (itemId: string) => {
    console.log('API: removeItem called with itemId:', itemId);
    const response = await api.delete(`cart/remove-cart/${itemId}`);
    console.log('API: removeItem response:', response.data);
    return response.data;
  },
  
  clear: async () => {
    const response = await api.delete('cart/clear-cart');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData: any) => {
    const response = await api.post('orders/checkout', orderData);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await api.get('orders/get-all-orders');
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`orders/get-order-byId/${id}`);
    return response.data;
  },
  
  cancelOrder: async (id: string) => {
    const response = await api.post(`orders/cancel-order/${id}/cancel`);
    return response.data;
  },
};

// Testimonials API
export const testimonialsAPI = {
  getAll: async () => {
    const response = await api.get('testimonials');
    return response.data;
  },
};

// Delivery Information API
export const deliveryAPI = {
  addDeliveryInfo: async (deliveryData: any) => {
    const response = await api.post('user/delivery-information', deliveryData);
    return response.data;
  },
  
  getDeliveryInfo: async () => {
    const response = await api.get('user/get-delivery-details');
    return response.data;
  },
  
  updateDeliveryInfo: async (deliveryData: any) => {
    const response = await api.put('user/update-delivery-information', deliveryData);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  initializePayment: (data: { 
    amount: number; 
    email: string; 
    orderId: string; 
    reference: string; 
    metadata?: any 
  }) => api.post('/payment/initialize-payment', data),
  
  verifyPayment: async (reference: string) => {
    const response = await api.get(`payment/verify/${reference}`);
    return response.data;
  },
  
  getPaymentHistory: async () => {
    const response = await api.get('payment/history');
    return response.data;
  },
  
  getPaymentDetails: async (id: string) => {
    const response = await api.get(`payment/${id}`);
    return response.data;
  },
};

export default api;

export function resolveImageUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const origin = base.replace(/\/api$/, '');
  return `${origin}/${String(path).replace(/^\/+/, '')}`;
}
