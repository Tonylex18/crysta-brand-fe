import { useEffect, useState } from "react";
import { productsAPI } from "../lib/api";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await productsAPI.getAll();
        setProducts(res.data || []);
      } catch (e) {
        setProducts([]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="py-10 text-center">Loading products...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <div className="font-semibold text-lg">{product.name}</div>
            <div className="text-gray-600 text-sm mb-2">{product.description}</div>
            <div className="font-bold text-green-700 mb-2">${product.price}</div>
            {/* Add more product details/actions as needed */}
          </div>
        ))}
      </div>
    </div>
  );
}
