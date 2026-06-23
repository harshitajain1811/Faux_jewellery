import { X, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  main_image: string;
  category: string;
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
  onRemoveItem: (index: number) => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem }: CartDrawerProps) {
  // Calculate total price dynamically
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark luxury overlay backdrop */}
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
                  {cartItems.length} {cartItems.length === 1 ? 'Artifact' : 'Artifacts'} Selected
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-950 transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Item Stack Container */}
            <div className="grow overflow-y-auto py-4 space-y-4 pr-1">
              {cartItems.length > 0 ? (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-white border border-stone-200/40 rounded-sm group relative">
                    <div className="w-20 h-20 bg-stone-50 overflow-hidden shrink-0 border border-stone-100">
                      <img src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="grow space-y-1 min-w-0 pr-6">
                      <div className="text-[9px] tracking-[0.15em] font-sans uppercase text-stone-400">{item.product.category}</div>
                      <h4 className="font-serif text-sm text-stone-900 truncate font-light tracking-wide pr-2">{item.product.name}</h4>
                      <div className="text-[11px] font-sans text-stone-500 font-light flex gap-3">
                        <span>Size: <span className="text-stone-900 font-normal">{item.size}</span></span>
                        <span>Qty: <span className="text-stone-900 font-normal">{item.quantity}</span></span>
                      </div>
                      <div className="font-sans text-xs font-medium text-stone-950 pt-1">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(idx)}
                      className="absolute top-3 right-3 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-24">
                  <p className="font-serif text-sm text-stone-400 italic">The bag is currently empty.</p>
                  <p className="font-sans text-[10px] tracking-widest uppercase text-stone-400 max-w-xs leading-relaxed">
                    Explore our collection registries to add luxury replicas.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Transaction Summary Block */}
            <div className="border-t border-stone-200/60 pt-4 space-y-4 bg-[#faf9f6]">
              <div className="space-y-1.5 font-sans text-xs font-light text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal Matrix</span>
                  <span className="font-medium text-stone-950">${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-400">Insured Delivery Courier</span>
                  <span className="text-emerald-600 uppercase tracking-wider text-[9px] font-medium">Complimentary</span>
                </div>
              </div>

              <div className="border-t border-stone-200/40 pt-3 flex justify-between items-baseline">
                <span className="font-serif text-base uppercase tracking-wider text-stone-900 font-light">Estimated Total</span>
                <span className="font-sans text-xl font-semibold text-stone-950">${totalPrice.toLocaleString()}</span>
              </div>

              <button 
                disabled={cartItems.length === 0}
                className="w-full group flex items-center justify-center gap-3 bg-stone-950 text-white border border-stone-900 px-6 py-4 text-xs tracking-widest uppercase hover:bg-stone-800 disabled:bg-stone-300 disabled:border-stone-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
              >
                Proceed to Secure Checkout
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}