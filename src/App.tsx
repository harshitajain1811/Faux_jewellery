import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ShoppingBag, Menu, Heart, Shield, Award, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import ProductDetails from './pages/ProductDetails';
import CartDrawer from './components/CartDrawer';
import CollectionList from './pages/CollectionList';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  main_image: string;
  category: string;
  sizes: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState<string>('All');
  const handleRemoveCartItem = (indexToRemove: number) => {
  setCartItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
};
  const [currentPage, setCurrentPage] = useState<'home' | 'collection'>('home');
 useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [selectedProduct, currentPage]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(4); // Keep homepage clean with a curated 4 items

        if (!error && data) setProducts(data);
      } catch (err) {
        console.error("Error loading showcase:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleToggleWishlist = (productToToggle: Product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === productToToggle.id);
      if (exists) {
        return prev.filter(item => item.id !== productToToggle.id);
      } else {
        return [...prev, productToToggle];
      }
    });
  };

//   if (selectedProduct) {
//   return (
//     <ProductDetails 
//       product={selectedProduct} 
//       onBack={() => setSelectedProduct(null)} 
//       onAddToBag={(quantity, size) => {
//         setCartItems(prev => [...prev, { product: selectedProduct, quantity, size }]);
//         setIsCartOpen(true); // Automatically glides cart open on success!
//       }}
//     />
//   );
// }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 antialiased selection:bg-stone-200">
      
      {/* 1. TOP MARQUEE ANNOUNCEMENT */}
      <div className="bg-stone-950 text-[#f5f2eb] text-[10px] tracking-[0.25em] uppercase py-2.5 px-4 text-center font-sans font-light border-b border-stone-800">
        Complimentary Insured Courier Delivery Worldwide &mdash; Aura Atelier
      </div>

      {/* 2. STICKY EDITORIAL NAVIGATION */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#faf9f6]/85 border-b border-stone-200/40 px-8 py-5 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-8">
          <Menu size={18} strokeWidth={1.2} className="cursor-pointer text-stone-600 hover:text-stone-950" />
          <div className="hidden md:flex items-center gap-6 text-[11px] tracking-[0.2em] uppercase font-sans font-light text-stone-600">
            <span onClick={() => { setCurrentPage('collection'); setSelectedProduct(null); }} className="cursor-pointer hover:text-stone-950 transition-colors">All Collections</span>
            <span onClick={() => { setCurrentPage('home'); setSelectedProduct(null); }} className="cursor-pointer hover:text-stone-950 transition-colors">The Maison</span>
          </div>
        </div>

        <h1 
          className="font-serif text-2xl tracking-[0.3em] uppercase text-stone-950 pl-12 cursor-pointer select-none" 
          onClick={() => {setCurrentPage('home'); setSelectedProduct(null);}}
        >
          Aura
        </h1>

        <div className="flex items-center gap-6 text-stone-600">
          <div className="hidden sm:flex items-center gap-1.5 cursor-pointer hover:text-stone-950 transition-colors">
            <MapPin size={12} strokeWidth={1.5} />
            <span className="text-[10px] tracking-widest uppercase font-sans font-light">Boutiques</span>
          </div>

          {/* Interactive Wishlist Indicator */}
          <div className="relative cursor-pointer hover:text-stone-950 transition-colors flex items-center gap-1">
            <Heart size={18} strokeWidth={1.2} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#c5a880] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium">
                {wishlist.length}
              </span>
            )}
          </div>

          {/* Shopping Bag Counter */}
          <div className="relative cursor-pointer hover:text-stone-950 transition-colors flex items-center gap-1" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={18} strokeWidth={1.2} />
            <span className="absolute -top-1.5 -right-2 bg-stone-950 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
        </div>
      </nav>
      
      <main className="grow">
        {selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)} 
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={(quantity, size) => {
              setCartItems(prev => [...prev, { product: selectedProduct, quantity, size }]);
              setIsCartOpen(true);
            }}
          />
        ) : currentPage === 'collection' ? (
          <CollectionList 
            onSelectProduct={(prod) => setSelectedProduct(prod)} 
            initialCategory={globalCategoryFilter || 'All'}
            onBack={() => setCurrentPage('home')}
          />
        ) :(
          <>
      {/* 3. HERO LOOKBOOK BLOCK (Optimized for premium text legibility) */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-stone-950 flex items-center">
        {/* Sleek, dark studio-lit background image that won't compete with typography */}
        <div className="absolute inset-0 z-0 bg-stone-950">
          <img 
            src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&auto=format&fit=crop&q=80" 
            alt="Minimalist Luxury Studio Backdrop" 
            className="w-full h-full object-cover opacity-35 transform scale-102 transition-transform duration-[10s]"
          />
          {/* Subtle gradient overlay to smoothly darken the text area further */}
          <div className="absolute inset-0 bg-linear-to-r from-stone-950 via-stone-950/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="md:col-span-6 lg:col-span-5 text-[#f5f2eb] space-y-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} strokeWidth={1} className="text-[#c5a880]" />
              <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#c5a880]">The 2026 Edition</span>
            </div>
            <h2 className="font-serif text-5xl md:text-6xl tracking-wide uppercase leading-[1.1] font-light">
              Sculpted <br /> By Light.
            </h2>
            <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-300 font-light max-w-sm tracking-wide">
              Premium premium curation. Discover seasonal artifacts designed to capture light and celebrate individual elegance.
            </p>
            <div className="pt-4">
              <button onClick={() => { setGlobalCategoryFilter('All'); setCurrentPage('collection'); }}
              className="group flex items-center gap-4 bg-[#f5f2eb] text-stone-950 px-8 py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-[#c5a880] hover:text-white transition-all duration-300 shadow-md">
                Explore The Lineage 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. CURATED COLLECTIONS GRID */}
      <section className="max-w-7xl w-full mx-auto px-8 py-24 space-y-12">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Curated Curations</p>
          <h3 className="font-serif text-2xl md:text-3xl uppercase tracking-widest text-stone-900 font-light">Shop by Chapter</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Rings', label: 'Fine Rings', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600' },
            { name: 'Necklaces', label: 'Collar Necklaces', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600' },
            { name: 'Earrings', label: 'Eternity Bands', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600' }
          ].map((col, idx) => (
            <motion.div 
              key={idx} 
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={() => { setGlobalCategoryFilter(col.name); setCurrentPage('collection'); }}
              className="relative aspect-3/4 overflow-hidden group bg-stone-100 cursor-pointer border border-stone-200/20"
            >
              <img src={col.img} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.2s] ease-out" />
              <div className="absolute inset-0 bg-linear-to-t from-stone-950/70 via-stone-950/0 to-transparent flex items-end p-8">
                <div className="w-full flex justify-between items-center text-white">
                  <h4 className="font-serif text-lg tracking-wider uppercase font-light">{col.name}</h4>
                  <span className="text-[10px] font-sans tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                    Discover <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. LIVE DATABASE PORTAL SHOWCASE */}
      <section className="bg-white border-y border-stone-200/50 py-24">
        <div className="max-w-7xl w-full mx-auto px-8 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Live Vault Registry</p>
              </div>
              <h3 className="font-serif text-3xl uppercase tracking-wider text-stone-900 font-light">Available Masterpieces</h3>
            </div>
            <p className="font-sans text-xs text-stone-500 max-w-xs font-light tracking-wide leading-relaxed">
              Synchronized directly with our central vault index. Handcrafted and verified in real-time.
            </p>
          </div>

          {loading ? (
            <div className="py-24 text-center text-[11px] tracking-[0.25em] uppercase text-stone-400 font-sans animate-pulse">
              Requesting assets from secure vault ledger...
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id}
                     onClick={() => setSelectedProduct(product)} 
                     className="group cursor-pointer bg-[#faf9f6]/20 p-3 border border-transparent hover:border-stone-200/50 hover:bg-white transition-all duration-300">
                  <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                    <img 
                      src={product.main_image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-stone-950/5 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  <div className="space-y-1.5 px-1">
                    <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{product.category}</div>
                    <h4 className="font-serif text-base text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">
                      {product.name}
                    </h4>
                    <p className="font-sans text-xs text-stone-500 line-clamp-1 font-light tracking-wide">{product.description}</p>
                    <div className="pt-3 flex justify-between items-center text-sm font-light font-sans border-t border-stone-100 mt-2">
                      <span className="text-stone-950 font-medium">${product.price.toLocaleString()}</span>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 group-hover:text-stone-950 transition-colors flex items-center gap-1 font-normal">
                        View Details <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-stone-500">
              No products found in the database.
            </div>
          )}
        </div>
      </section>

      {/* 6. BRAND HERITAGE / QUALITY STATEMENT */}
      <section className="max-w-7xl w-full mx-auto px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-4/5 bg-stone-100 max-w-md mx-auto w-full">
            <img 
              src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&auto=format&fit=crop&q=80" 
              alt="Artisan Craftsmanship" 
              className="w-full h-full object-cover shadow-sm"
            />
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">The Maison Standards</p>
              <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-wider text-stone-900 font-light leading-snug">
                Consciously Cast, <br />Forever Retained
              </h3>
            </div>
            <p className="font-sans text-sm leading-relaxed text-stone-600 font-light tracking-wide">
              Every creation leaving our workshops embodies centuries of inherited bench technical intelligence. We operate solely with 100% recycled precious metals and carefully vetted conflict-free diamonds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-white border border-stone-200/50 rounded-xs text-stone-800">
                  <Shield size={16} strokeWidth={1.2} />
                </div>
                <div>
                  <h5 className="font-sans text-xs font-medium uppercase tracking-wider text-stone-900">Certified Integrity</h5>
                  <p className="font-sans text-xs text-stone-500 mt-1 font-light leading-relaxed">Full geological passports accompanying every specimen.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-white border border-stone-200/50 rounded-xs text-stone-800">
                  <Award size={16} strokeWidth={1.2} />
                </div>
                <div>
                  <h5 className="font-sans text-xs font-medium uppercase tracking-wider text-stone-900">Atelier Lifetime Care</h5>
                  <p className="font-sans text-xs text-stone-500 mt-1 font-light leading-relaxed">Complimentary restoration and sizing audits globally.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MINIMAL ARCHITECTURAL NEWSLETTER PORTAL */}
      <section className="bg-stone-950 text-[#f5f2eb] py-24 border-t border-stone-900">
        <div className="max-w-2xl mx-auto px-8 text-center space-y-6">
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#c5a880]">Atelier Invitations</p>
          <h4 className="font-serif text-2xl md:text-3xl uppercase tracking-widest font-light">Acquire Private Access</h4>
          <p className="font-sans text-xs text-stone-400 font-light max-w-md mx-auto leading-relaxed tracking-wide">
            Receive premium collection notification cycles, masterwork previews, and private viewing events curated near you.
          </p>
          <div className="pt-4 max-w-md mx-auto">
            <div className="flex border-b border-stone-700 pb-2">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="bg-transparent border-none outline-none w-full text-xs tracking-wider placeholder-stone-600 focus:placeholder-stone-400 text-white font-sans font-light"
              />
              <button className="text-[10px] tracking-[0.2em] uppercase text-[#c5a880] hover:text-[#f5f2eb] transition-colors font-sans pl-4">
                Request
              </button>
            </div>
          </div>
        </div>
      </section>
      </>
      )}
      </main>

      {/* 8. MAISON FOOTER BASE */}
      <footer className="bg-stone-950 text-stone-500 border-t border-stone-900 px-8 py-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-stone-500">
            &copy; 2026 Aura Atelier Inc. &mdash; High-End Portfolio Framework
          </p>
          <div className="flex gap-6 text-[9px] tracking-[0.2em] uppercase font-sans font-light text-stone-500">
            <span className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Privacy Privacy</span>
            <span className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Terms of Care</span>
          </div>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemoveItem={handleRemoveCartItem} />
    </div>
  );
}

export default App;