import { X, Trash2, ArrowRight, ShieldCheck, Loader2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_rate?: number;
  main_image: string;
  category: string;
  polish?: string;
  is_new?: boolean;
  is_most_selling?: boolean;
  is_featured?: boolean;
  created_at: string;
  size_stock?: Record<string, number>;
}

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onRemoveItem: (index: number) => void;
  onNavigateToCollection: () => void;
  onCheckoutTrigger: () => void;
  user: { id: string } | null;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, setCartItems, onNavigateToCollection, onCheckoutTrigger, user }: CartDrawerProps) {
  const getFinalPrice = (product: Product) => {
    if (product.discount_rate && product.discount_rate > 0) {
      return product.price * (1 - product.discount_rate / 100);
    }
    return product.price;
  };
  const totalPrice = cartItems.reduce((acc, item) => acc + (getFinalPrice(item.product) * item.quantity), 0);
  const getMaxStock = (item: CartItem) => item.product.size_stock?.[item.size] ?? 99;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleDrawerQtyAdjust = (index: number, shift: number) => {
    setCartItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      
      const nextQty = item.quantity + shift;
      const maxAvailableStock = getMaxStock(item);
      
      if (nextQty < 1 || nextQty > maxAvailableStock) return item;
      return { ...item, quantity: nextQty };
    }));
  };

  const handleItemRemovalSync = async (index: number, item: CartItem) => {
    setDeletingIndex(index);
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('user_carts')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', item.product.id)
          .eq('size', item.size || 'Universal Size');

        if (error) {
          console.error("Cloud database cart item removal rejected:", error.message);
        }
      }
    } catch (err) {
      console.error("Non-blocking failure syncing local cart removal matrix:", err);
    } finally {
      onRemoveItem(index);
      setDeletingIndex(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-stone-950 pointer-events-auto"
          />

          {/* Sliding Side Vault Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#faf9f6] shadow-2xl border-l border-stone-200/60 flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Header Block */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-200/60">
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg uppercase tracking-wider text-stone-900 font-light">Your Allocation</h3>
                <p className="text-[10px] font-sans tracking-widest uppercase text-stone-400">
                  {cartItems.length} {cartItems.length === 1 ? 'Product' : 'Products'} Selected
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-950 transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Item Stack Container */}
            <div className="grow overflow-y-auto py-4 space-y-4 pr-1">
              {cartItems.length > 0 ? (
                <ul className="space-y-4 pr-1" role="list" aria-label="Cart items">
                  {cartItems.map((item, idx) => {
                    const maxAvailableStock = getMaxStock(item);

                  return (
                    <li key={ `${item.product.id}-${item.size}` } tabIndex={0} className="flex gap-4 p-3 bg-white border border-stone-200/40 rounded-sm group relative min-h-20"
                        role="listitem" aria-label={`${item.product.name}, Size: ${item.size}, Quantity: ${item.quantity}`}>
                      <div className="w-20 h-20 bg-stone-50 overflow-hidden shrink-0 border border-stone-100">
                        <img loading="lazy" onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="grow space-y-1 min-w-0 pr-6" role="group" aria-label="Item details">
                        <div className="text-[9px] tracking-[0.15em] font-sans uppercase text-stone-400" id={`item-${idx}-category`}>{item.product.category}</div>
                        <h4 className="font-serif text-sm text-stone-900 truncate font-light tracking-wide pr-2" aria-labelledby={`item-${idx}-category`}>
                          {item.product.name}
                        </h4>

                        <div className="text-[11px] font-sans text-stone-500 font-light flex items-center gap-4 pt-1" aria-label="Size and quantity controls">
                          <span>Size: <span className="text-stone-900 font-normal">{item.size}</span></span>
                          
                          <div className="flex items-center border border-stone-200 bg-stone-50/50 rounded-xs px-1">
                            <button 
                              type="button"
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              disabled={item.quantity <= 1}
                              onClick={() => handleDrawerQtyAdjust(idx, -1)}
                              className="p-1 text-stone-500 hover:text-stone-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus size={10} aria-hidden="true" />
                            </button>
                            
                            <span className="min-w-6 text-center text-xs text-stone-950 font-medium" aria-live="polite" aria-atomic="true" id={`quantity-display-${idx}`}>
                              {item.quantity}
                            </span>
                            
                            <button 
                              type="button"
                              aria-label={`Increase quantity of ${item.product.name}`}
                              disabled={item.quantity >= maxAvailableStock}
                              onClick={() => handleDrawerQtyAdjust(idx, 1)}
                              className="p-1 text-stone-500 hover:text-stone-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Plus size={10} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="font-sans text-xs font-medium text-stone-950 pt-1" aria-label={`Total price for ${item.product.name}`}>
                          ₹{(Math.round(getFinalPrice(item.product) * item.quantity)).toLocaleString()}
                        </div>
                      </div>

                      <button 
                        type="button"
                        aria-label={`Remove ${item.product.name} from cart`}
                        disabled={deletingIndex === idx}
                        onClick={() => handleItemRemovalSync(idx, item)}
                        className={`absolute top-3 right-3 transition-colors cursor-pointer ${
                          deletingIndex === idx ? 'text-stone-400 cursor-not-allowed' : 'text-stone-300 hover:text-red-500'
                        }`}
                      >
                        {deletingIndex === idx ? (
                          <Loader2 size={13} className="animate-spin text-stone-500" aria-hidden="true" />
                        ) : (
                          <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-24">
                  <p className="font-serif text-sm text-stone-400 italic">The bag is currently empty.</p>
                  <p className="font-sans text-[10px] tracking-widest uppercase text-stone-400 max-w-xs leading-relaxed">
                    Explore our collection registries to add luxury replicas.
                  </p>
                <button
                  onClick={onNavigateToCollection}
                  className="group flex items-center justify-center gap-3 bg-stone-950 text-[#f5f2eb] w-full max-w-60 py-3.5 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 border border-stone-950 hover:bg-transparent hover:text-stone-950 shadow-xs"
                >
                  Explore Collections
                  <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                </button>
                </div>
              )}
            </div>

            {/* BOTTOM SECTION: Checkout Action Calculations Board */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-stone-100 bg-stone-50/40 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Subtotal Allocation</span>
                  <span className="text-stone-950 font-medium">₹{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed tracking-wide">
                  Shipping logistics and regulatory surcharges are determined during secure authorization steps next.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();            
                    onCheckoutTrigger();  
                  }}
                  className="w-full bg-stone-950 text-white font-sans text-[10px] tracking-widest uppercase py-3 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 shadow-sm cursor-pointer"
                >
                  Proceed to Secure Checkout
                </button>
                
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-sans tracking-wider uppercase text-stone-400">
                  <ShieldCheck size={11} className="text-stone-500" /> End-To-End TLS Encrypted Pipeline
                </div>
              </div>
            </div>
          )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}