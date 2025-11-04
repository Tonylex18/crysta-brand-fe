// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { X, ShoppingCart, Check } from 'lucide-react';
// import { useCart } from '../contexts/CartContext';
// import { useAuth } from '../contexts/AuthContext';

// type ProductModalProps = {
//   product: Product;
//   onClose: () => void;
// };

// export default function ProductModal({ product, onClose }: ProductModalProps) {
//   const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
//   const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
//   const [quantity, setQuantity] = useState(1);
//   const [adding, setAdding] = useState(false);
//   const { addToCart } = useCart();
//   const { user } = useAuth();

//   const handleAddToCart = async () => {
//     if (!user) {
//       alert('Please sign in to add items to cart');
//       return;
//     }

//     if (!selectedSize || !selectedColor) {
//       alert('Please select size and color');
//       return;
//     }

//     setAdding(true);
//     try {
//       await addToCart(product.id, selectedSize, selectedColor, quantity);
//       setTimeout(() => {
//         setAdding(false);
//         onClose();
//       }, 500);
//     } catch (error) {
//       alert('Failed to add to cart');
//       setAdding(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         exit={{ opacity: 0, scale: 0.9 }}
//         className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 relative"
//       >
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
//         >
//           <X className="w-5 h-5" />
//         </button>

//         <div className="grid md:grid-cols-2 gap-8 p-8">
//           <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
//             <img
//               src={product.image_url || ''}
//               alt={product.name}
//               className="w-full h-full object-cover"
//             />
//           </div>

//           <div className="space-y-6">
//             <div>
//               <h2 className="text-3xl font-bold text-gray-900 mb-2">
//                 {product.name}
//               </h2>
//               <p className="text-2xl font-bold text-[#00CFFF]">
//                 ${product.price.toFixed(2)}
//               </p>
//             </div>

//             <p className="text-gray-600 leading-relaxed">
//               {product.description}
//             </p>

//             {product.sizes.length > 0 && (
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-3">
//                   Select Size
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   {product.sizes.map((size) => (
//                     <button
//                       key={size}
//                       onClick={() => setSelectedSize(size)}
//                       className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
//                         selectedSize === size
//                           ? 'border-[#00CFFF] bg-[#00CFFF] text-white'
//                           : 'border-gray-200 hover:border-[#00CFFF]'
//                       }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {product.colors.length > 0 && (
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-3">
//                   Select Color
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   {product.colors.map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setSelectedColor(color)}
//                       className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
//                         selectedColor === color
//                           ? 'border-[#00CFFF] bg-[#00CFFF] text-white'
//                           : 'border-gray-200 hover:border-[#00CFFF]'
//                       }`}
//                     >
//                       {color}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div>
//               <label className="block text-sm font-semibold text-gray-900 mb-3">
//                 Quantity
//               </label>
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   className="w-10 h-10 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
//                 >
//                   -
//                 </button>
//                 <span className="text-xl font-semibold w-12 text-center">
//                   {quantity}
//                 </span>
//                 <button
//                   onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
//                   className="w-10 h-10 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
//                 >
//                   +
//                 </button>
//               </div>
//               <p className="text-sm text-gray-500 mt-2">
//                 {product.stock} items in stock
//               </p>
//             </div>

//             <button
//               onClick={handleAddToCart}
//               disabled={adding || product.stock === 0}
//               className="w-full px-6 py-4 bg-[#00CFFF] text-white font-semibold rounded-full hover:bg-[#00CFFF]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
//             >
//               {adding ? (
//                 <>
//                   <Check className="w-5 h-5" />
//                   <span>Added to Cart!</span>
//                 </>
//               ) : (
//                 <>
//                   <ShoppingCart className="w-5 h-5" />
//                   <span>Add to Cart</span>
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
