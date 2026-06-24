import { X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
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
  onNavigateToCollection: () => void;
  onCheckoutTrigger: () => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, onNavigateToCollection, onCheckoutTrigger }: CartDrawerProps) {
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
                  {/* Premium Embedded Call-To-Action Button */}
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
                  <span className="text-stone-950 font-medium">${totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed tracking-wide">
                  Shipping logistics and regulatory surcharges are determined during secure authorization steps next.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();            // Step 1: Slide drawer shut smoothly
                    onCheckoutTrigger();  // Step 2: Swap layout matrix route to 'checkout' string
                  }}
                  className="w-full bg-stone-950 text-white font-sans text-xs tracking-widest uppercase py-4 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 shadow-sm cursor-pointer"
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