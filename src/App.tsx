import { useEffect, useState, useMemo } from 'react';
import { Sparkles, ArrowRight, ShoppingBag, Menu, Heart, X, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import AuthPage from './pages/AuthPage';
import UserProfilePage from './pages/UserProfilePage';
import ProductDetails from './pages/ProductDetails';
import CartDrawer from './components/CartDrawer';
import CollectionList from './pages/CollectionList';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ReturnAndRefund from './pages/ReturnAndExchangePolicy';
import ShippingDelivery from './pages/ShippingAndDelivery';
import CancellationRefund from './pages/CancelAndRefundPolicy';

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

function App() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState<{id: string; email: string; full_name?: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState<string>('All');

  // 1. INITIAL SETUP: Seed the first history state when the app boots up
useEffect(() => {
  if (!window.history.state) {
    window.history.replaceState({ page: currentPage, category: globalCategoryFilter, productId: selectedProduct?.id }, '', '');
  }
}, []);

// 2. INTERCEPT ENGINE: Listen for the user hitting the browser's back/forward buttons
useEffect(() => {
  const handleHardwareNavigation = (event: PopStateEvent) => {
    if (event.state) {
      const { page, category, productId } = event.state;
      
      // Restore the historical page position smoothly
      setCurrentPage(page || 'home');
      setGlobalCategoryFilter(category || 'All');
      
      // If we are backing into a specific product detail look, find it in your local cache/state
      if (productId) {
        const foundProd = products.find(p => p.id === productId); // Replace with your master products array variable
        setSelectedProduct(foundProd || null);
      } else {
        setSelectedProduct(null);
      }
    } else {
      // Baseline safety catch-all
      setCurrentPage('home');
      setGlobalCategoryFilter('All');
      setSelectedProduct(null);
    }
  };

  window.addEventListener('popstate', handleHardwareNavigation);
  return () => window.removeEventListener('popstate', handleHardwareNavigation);
}, [products]);

  // SYNC RECOVERY HOOK (Run immediately when a user signs in)
useEffect(() => {
  async function loadSavedUserData() {
    if (!user?.id) return;

    try {
      // 1. Fetch saved Cart items with nested Product data
      const { data: savedCart, error: cartErr } = await supabase
        .from('user_carts')
        .select('quantity, size, product:products(*)')
        .eq('user_id', user.id);

      if (!cartErr && savedCart && savedCart.length > 0) {
        const formattedCart: CartItem[] = savedCart.map(item => {
          const productData = Array.isArray(item.product) ? item.product[0] : item.product;
          
          return {
            product: productData as Product, // Casts directly to your internal Product interface
            quantity: Number(item.quantity),
            size: item.size || 'Universal Size'
          };
        });
        setCartItems(formattedCart); // Overwrite/hydrate local side-panel cart state
      }

      // 2. Fetch saved Wishlist records
      const { data: savedWish, error: wishErr } = await supabase
        .from('user_wishlists')
        .select('product:products(*)');

      if (!wishErr && savedWish) {
        // Collect product IDs into an array to activate local Heart state fills
        const fullWishlistProducts: Product[] = savedWish
        .map(w => (Array.isArray(w.product) ? w.product[0] : w.product))
        .filter(Boolean) as Product[]; 
        setWishlist(fullWishlistProducts); 
      }
    } catch (err) {
      console.error("Failed to restore cloud user state metrics:", err);
    }
  }

  loadSavedUserData();
}, [user?.id]);
  
  const [currentPage, setCurrentPage] = useState<'home' | 'collection' | 'auth' | 'profile' | 'checkout' | 'admin' | 'product-details' | 'wishlist' | 'about' | 'contact' | 'faq' | 'privacy-policy' | 'terms-of-service' | 'return-and-refund' | 'shipping-delivery' | 'cancellation-refund'>('home');
  //SYNCHRONIZATION POINT: Whenever your code changes views via clicks, log a checkpoint
  const navigateToView = (
    targetPage: "home" | "collection" | "auth" | "profile" | "checkout" | "admin" | "product-details" | "wishlist" | "about" | "contact" | "faq" | "privacy-policy" | "terms-of-service" | "return-and-refund" | "shipping-delivery" | "cancellation-refund",
    targetCategory: string = 'All', targetProduct: any = null, replace: boolean = false) => {
    setCurrentPage(targetPage);
    setGlobalCategoryFilter(targetCategory);
    setSelectedProduct(targetProduct);
    
    const stateBlueprint = { 
      page: targetPage, 
      category: targetCategory, 
      productId: targetProduct?.id || null 
    };

    if (replace) {
      // Overwrite the current history slot so the back button skips this page
      window.history.replaceState(stateBlueprint, '', '');
    } else {
      // Standard navigation tracking step
      window.history.pushState(stateBlueprint, '', '');
    }
  };
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedProduct, currentPage]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (viewTarget: any, cat: any = null, prod: any = null) => {
    navigateToView(viewTarget, cat, prod);
    setIsMobileMenuOpen(false);
  };

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.first_name) setFirstName(data.first_name);
          if (data?.last_name) setLastName(data.last_name);
        });
    }
  }, [user?.id]);

  useEffect(() => {
    const isPasswordRecoveryLink = 
      window.location.hash.includes('type=recovery') || 
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('access_token');

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id || '',
          email: session.user.email || '', 
          full_name: firstName + ' ' + lastName || '' 
        });
        
        if (isPasswordRecoveryLink) {
          setCurrentPage('auth');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id || '' ,
          email: session.user.email || '', 
          full_name: firstName + ' ' + lastName || ''
        });

        if (event === 'PASSWORD_RECOVERY' || isPasswordRecoveryLink) {
          setCurrentPage('auth');
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .range(0, 150);

        if (!error && data) setProducts(data as Product[]);
      } catch (err) {
        console.error("Error loading showcase:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [products]);

  const mostSellingProducts = useMemo(() => {
    return products.filter(p => p.is_most_selling === true).slice(0, 4);
  }, [products]);

  const rotationShowcase = useMemo(() => {
    if (products.length === 0) return null;
    const items = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    if (items.length === 0) return null;

    const currentTimestamp = Date.now();
    const cycleInterval = 7 * 24 * 60 * 60 * 1000; 
    const fixedEpochAnchor = new Date('2026-01-01').getTime();
    
    const intervalsPassed = Math.floor(Math.max(0, currentTimestamp - fixedEpochAnchor) / cycleInterval);
    const selectedCategory = items[intervalsPassed % items.length];
    const categoryProducts = products.filter(p => p.category === selectedCategory);

    const topSeller = categoryProducts.find(p => p.is_most_selling === true);
    const computedCoverImage = topSeller ? topSeller.main_image : (categoryProducts[0]?.main_image || '');

    return {
      category: selectedCategory,
      coverImage: computedCoverImage,
      count: categoryProducts.length
    };
  }, [products]);

  const handleToggleWishlist = async (product: Product) => {
  if (!user?.id) return;

  const isAlreadyWishlisted = wishlist.some(item => item.id === product.id);

  try {
    if (isAlreadyWishlisted) {
      // 1. Immediately update UI state for a snappy experience
      setWishlist(prev => prev.filter(item => item.id !== product.id));

      await supabase
        .from('user_wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
        
    } else {
      // 1. Immediately update UI state for a snappy experience
      setWishlist(prev => [...prev, product]);

      await supabase
        .from('user_wishlists')
        .upsert({
          user_id: user.id,
          product_id: product.id
        }, { onConflict: 'user_id,product_id' });
    }
  } catch (dbError) {
    console.error("Failed to sync wishlist action to cloud network metrics:", dbError);
  }
};

  const onAddToBag = (product: any, quantity: number, size: string) => {
    setCartItems(prevItems => {
      const existingIdx = prevItems.findIndex(
        item => item.product.id === product.id && item.size === size
      );

      if (existingIdx > -1) {
        // Exact Overwrite Rule: Carry forward the exact quantity from the page
        return prevItems.map((item, idx) => 
          idx === existingIdx ? { ...item, quantity } : item
        );
      } else {
        // Fresh Add Rule
        return [...prevItems, { product, quantity, size }];
      }
    });
    setIsCartOpen(true);
  };

  // 2. DRAWER BULK SYNC ENGINE: Fires ONCE when drawer closes or checkout is clicked
  const handleSyncCartToDatabase = async (currentCart: CartItem[]) => {
    if (!user?.id) return; // Ignore for Guests (remains safe in global memory state)

    try {
      // Format all current items for a single batch upsert query
      const upsertRows = currentCart.map(item => ({
        user_id: user.id,
        product_id: item.product.id,
        size: item.size,
        quantity: item.quantity
      }));

      if (upsertRows.length === 0) return;

      const { error } = await supabase
        .from('user_carts')
        .upsert(upsertRows, { onConflict: 'user_id,product_id,size' });

      if (error) throw error;
      console.log("Global inventory allocations synced to cloud database.");
    } catch (err) {
      console.error("Database sync failed:", err);
    }
  };

  // 3. CLOSE DRAWER TRIGGER
  const handleCloseDrawer = () => {
    setIsCartOpen(false);
    handleSyncCartToDatabase(cartItems); // Sync everything to DB upon closing
  };

  const handleCheckoutTrigger = () => {
    handleSyncCartToDatabase(cartItems); // Sync everything to DB before navigating to checkout
    navigateToView('checkout', 'All', null);
    setIsCartOpen(false);
  };

  const handleRemoveCartItem = (indexToRemove: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900 antialiased selection:bg-stone-200">
      
      {/* 1. TOP MARQUEE ANNOUNCEMENT */}
      <div className="bg-stone-950 text-[#f5f2eb] text-[10px] tracking-[0.25em] uppercase py-2.5 px-4 text-center font-sans font-light border-b border-stone-800">
        🎉 Enjoy curated pricing revisions on select jewelry sets for a limited time 🎉
      </div>

      {/* 2. STICKY EDITORIAL NAVIGATION */}
      <nav className="sticky lg:relative top-0 z-50 backdrop-blur-md bg-[#faf9f6]/85 border-b border-stone-200/40 px-6 md:px-8 py-4 flex justify-between items-center select-none">
        
        {/* DESKTOP LINKS ONLY (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-1 items-center gap-6 text-[11px] tracking-[0.2em] uppercase font-sans font-light text-stone-600">
          <span onClick={() => navigateToView('collection', 'All', null)} className="cursor-pointer hover:text-stone-950 transition-colors">Collections</span>
          <span onClick={() => navigateToView('about')} className="cursor-pointer hover:text-stone-950 transition-colors">About</span>
          <span onClick={() => navigateToView('contact')} className="cursor-pointer hover:text-stone-950 transition-colors">Contact</span>
          <span onClick={() => navigateToView('faq')} className="cursor-pointer hover:text-stone-950 transition-colors">FAQ</span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="cursor-pointer text-stone-600 hover:text-stone-950 transition-colors focus:outline-none py-2 lg:hidden"
          aria-label="Toggle Navigation Drawer"
        >
          {isMobileMenuOpen ? <X size={19} strokeWidth={1.3} /> : <Menu size={19} strokeWidth={1.3} />}
        </button>

        {/* LOGO: Always centered on all screen formats */}
        <div className="lg:flex-1 text-center md:text-center">
          <h1 
            className="font-serif text-2xl tracking-[0.2em] uppercase text-stone-950 inline-block cursor-pointer" 
            onClick={() => handleMobileNavClick('home', 'All', null)}
          >
            Aura
          </h1>
        </div>

        <div className="flex lg:flex-1  items-center justify-end gap-4 text-stone-600">
          <div className="relative flex items-center h-7">
            {user ? (
              user.email === 'harshiqatest@gmail.com' ? (
                <button
                  onClick={() => navigateToView('admin', 'All', null)}
                  className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-sans font-medium text-amber-800 hover:text-stone-950 transition-colors cursor-pointer group outline-none"
                  title="Access Aura Management Terminal"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  <span>Dashboard</span>
                </button>
              ) : (
                <div className="relative flex items-center">
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-1 hover:text-stone-950 transition-colors cursor-pointer outline-none"
                  >
                    <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-950 flex items-center justify-center text-stone-100 text-[9px] font-sans font-medium uppercase">
                      {firstName ? firstName.charAt(0) : user.email.charAt(0)}
                    </div>
                    <span className="text-[8px] text-stone-400 scale-85">▼</span>
                  </button>

                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-48 bg-white border border-stone-200 rounded-xs shadow-xl py-1 z-40 text-left transition-all duration-300 ease-in-out overflow-hidden">
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-[10px] font-sans tracking-wider uppercase text-stone-400">Account</p>
                          <p className="text-xs font-sans font-medium text-stone-900 truncate mt-0.5">
                            {firstName && lastName ? `Welcome, ${firstName} ${lastName}` : 'Welcome Back'}
                          </p>
                        </div>
                        <button
                          onClick={() => { navigateToView('profile', 'All', null); setIsProfileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-sans text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-colors cursor-pointer"
                        >
                          My Profile Details
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            setUser(null);
                            setCartItems([]);
                            setWishlist([]);
                            navigateToView('home', undefined, null, true);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-sans text-red-700 hover:bg-red-50/40 transition-colors cursor-pointer border-t border-stone-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            ) : (
              <button 
                onClick={() => navigateToView('auth', 'All', null, true)}
                className="text-[10px] tracking-widest uppercase font-sans font-light hover:text-stone-950 transition-colors cursor-pointer h-full"
              >
                Sign In
              </button>
            )}
          </div>
          <div className="cursor-pointer hover:text-stone-950 transition-colors" onClick={() => navigateToView('wishlist')}>
            <Heart size={17} strokeWidth={1.2} />
          </div>
          <div className="cursor-pointer hover:text-stone-950 transition-colors" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={17} strokeWidth={1.2} />
          </div>
        </div>

        {/* MOBILE EXPANSION NAV DROPDOWN CANVAS */}
        <div 
          className={`absolute top-full right-0 left-0 w-full bg-[#faf9f6] border-b border-stone-200 z-40 transition-all duration-300 ease-in-out lg:hidden overflow-hidden ${
            isMobileMenuOpen ? 'max-h-64 opacity-100 shadow-lg' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col px-8 py-6 space-y-4 font-sans text-xs tracking-[0.2em] uppercase font-light text-stone-600">
            <span 
              onClick={() => handleMobileNavClick('collection', 'All', null)} 
              className="cursor-pointer hover:text-stone-950 transition-colors py-1.5 border-b border-stone-100/50"
            >
              Collections
            </span>
            <span 
              onClick={() => handleMobileNavClick('about')} 
              className="cursor-pointer hover:text-stone-950 transition-colors py-1.5 border-b border-stone-100/50"
            >
              About
            </span>
            <span 
              onClick={() => handleMobileNavClick('contact')} 
              className="cursor-pointer hover:text-stone-950 transition-colors py-1.5 border-b border-stone-100/50"
            >
              Contact
            </span>
            <span 
              onClick={() => handleMobileNavClick('faq')} 
              className="cursor-pointer hover:text-stone-950 transition-colors py-1.5 pb-2"
            >
              FAQ
            </span>
          </div>
        </div>
      </nav>
      
      {/* DYNAMIC LAYOUT INTERFACE MATRIX ROUTER */}
      <main className="grow">
        {currentPage === 'checkout' ? (
          <Checkout 
            cartItems={cartItems} 
            user={user}
            onOrderPlacedSuccess={() => {
              setCartItems([]);
            }}
            navigateToView={navigateToView}
          />
        ) : selectedProduct ? (
          <ProductDetails 
            product={selectedProduct}
            wishlist={wishlist}
            user={user}
            cartItems={cartItems}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={onAddToBag}
            navigateToView={navigateToView}
          />
        ) : currentPage === 'auth' ? (
          <AuthPage 
            onAuthSuccess={(email) => {
              setUser({ id: '', email });
              setCurrentPage('home');
            }}
            navigateToView={navigateToView}
          />
        ) : currentPage === 'profile' ? (
          <UserProfilePage 
            user={user} 
            navigateToView={navigateToView}
          />
        ) : currentPage === 'admin' ? (
          <AdminDashboard navigateToView={navigateToView} />
        ) : currentPage === 'collection' ? (
          <CollectionList 
            initialCategory={globalCategoryFilter || 'All'}
            navigateToView={navigateToView}
          />
        ) : currentPage === 'wishlist' ? (
          <WishlistPage 
            user={user} 
            wishlistItems={wishlist} 
            onToggleWishlist={handleToggleWishlist} 
            navigateToView={navigateToView} 
          />
        ) : currentPage === 'about' ? (
          <About
            navigateToView={navigateToView} 
          />
        ) : currentPage === 'contact' ? (
          <Contact
            user={user}
          />
        ) : currentPage === 'faq' ? (
          <Faq/>
        ) : currentPage === 'privacy-policy' ? (
          <PrivacyPolicy/>
        ) : currentPage === 'terms-of-service' ? (
          <TermsOfService/>
        ) : currentPage === 'return-and-refund' ? (
          <ReturnAndRefund/>
        ) : currentPage === 'shipping-delivery' ? (
          <ShippingDelivery/>
        ) : currentPage === 'cancellation-refund' ? (
          <CancellationRefund/>
        ) : (
          <>
            {/* HERO LOOKBOOK BLOCK */}
            <section className="relative h-[85vh] w-full overflow-hidden bg-stone-950 flex items-center">
              <div className="absolute inset-0 z-0 bg-stone-950">
                <img 
                  src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&auto=format&fit=crop&q=80" 
                  alt="Minimalist Luxury Studio Backdrop" 
                  className="w-full h-full object-cover opacity-35 transform scale-102"
                />
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
                    Curated <br />  to Last.
                  </h2>
                  <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-300 font-light max-w-sm tracking-wide">
                    Premium essentials engineered for your everyday routine. Discover our newest collection of timeless objects and apparel.
                  </p>
                  <div className="pt-4">
                    <button onClick={() => navigateToView('collection', 'All', null)}
                    className="group flex items-center gap-4 bg-[#f5f2eb] text-stone-950 px-8 py-4 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase hover:bg-[#c5a880] hover:text-white transition-all duration-300 shadow-md">
                      Explore The Collection 
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* NEW ARRIVALS */}
            <section className="bg-white py-24">
              <div className="max-w-7xl w-full mx-auto px-8 space-y-12">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[#c5a880] text-[10px] tracking-[0.3em] uppercase font-medium">
                    <Sparkles size={10} /> Fresh From The Vault
                  </div>
                  <h3 className="font-serif text-3xl uppercase tracking-wider text-stone-900 font-light">New Arrivals</h3>
                  <p className="text-xs text-stone-400 italic max-w-md mx-auto font-sans leading-relaxed">
                    Discover our latest handcrafted acquisitions. Rare silhouettes forged in timeless premium finishes, straight from the master artisan's workbench.
                  </p>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-[11px] tracking-[0.25em] uppercase text-stone-400 font-sans animate-pulse">
                    Syncing newly forged designs...
                  </div>
                ) : newArrivals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {newArrivals.map((product) => (
                      <div key={`new-${product.id}`} onClick={() => navigateToView('product-details', product.category, product)} className="group cursor-pointer bg-white p-3 border border-stone-200/60 rounded-sm hover:shadow-3xs transition-all duration-300">
                        <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                          <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-[0.8s]" />
                        </div>
                        <div className="space-y-1 px-1">
                          <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{product.category}</div>
                          <h4 className="font-serif text-base text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">{product.name}</h4>
                          <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                            <span className="text-stone-950 font-medium">₹{product.price.toLocaleString()}</span>
                            <span className="text-[9px] tracking-[0.15em] uppercase text-stone-400 group-hover:text-stone-950 flex items-center gap-1">View Details <ArrowRight size={10} /></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-stone-400">No new arrivals logged in the ledger yet.</div>
                )}
              </div>
            </section>

            {/* 7-DAY CAPSULE */}
              {rotationShowcase && (
                <section className="w-full bg-[#faf9f6] py-20 px-8 border-b border-stone-200/30 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-120">
                    {/* Visual Asset Block */}
                    <div className="md:col-span-6 bg-stone-50 relative overflow-hidden min-h-87.5 md:min-h-full border-b md:border-b-0 md:border-r border-stone-200/30">
                      {rotationShowcase.coverImage ? (
                        <img 
                          src={rotationShowcase.coverImage} 
                          alt="Weekly showcase thumbnail curation" 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] hover:scale-102" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-widest text-stone-300 uppercase">
                          Awaiting Visual Media Asset
                        </div>
                      )}
                    </div>

                  {/* Editorial Text Block */}
                  <div className="md:col-span-6 md:p-12 py-10 px-5 lg:p-20 space-y-6 flex flex-col justify-center bg-[#faf9f6]/40">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#c5a880] font-semibold block">
                        Weekly Curation Focus
                      </span>
                      <h3 className="font-serif text-3xl lg:text-4xl uppercase tracking-wider text-stone-950 font-light">
                        The {rotationShowcase.category} Capsule
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed font-sans max-w-md">
                      Every seven days, the Maison re-aligns its studio focal point. This week, we showcase our signature collection of bespoke <span className="text-stone-950 font-medium lowercase">{rotationShowcase.category}</span> configurations, celebrating symmetry and raw metal craftsmanship.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => navigateToView('collection', rotationShowcase.category, null)}
                        className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase text-stone-900 hover:text-[#c5a880] font-sans font-medium transition-colors border-b border-stone-950 pb-0.5"
                      >
                        Explore This Capsule Layout<ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* BEST SELLING SECTION */}
            <section className="bg-white py-24 border-t border-stone-200/40">
              <div className="max-w-7xl w-full mx-auto px-8 space-y-12">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-amber-800 text-[10px] tracking-[0.3em] uppercase font-medium">
                    <Flame size={10} /> Constantly Desired
                  </div>
                  <h3 className="font-serif text-3xl uppercase tracking-wider text-stone-900 font-light">Most Selling Masterpieces</h3>
                  <p className="text-xs text-stone-400 italic max-w-md mx-auto font-sans leading-relaxed">
                    The signature icons universally revered by our collectors. High-demand hallmarks that define elegance and unparalleled luxury identity.
                  </p>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-[11px] tracking-[0.25em] uppercase text-stone-400 font-sans animate-pulse">
                    Pulling metrics indexes from core vault records...
                  </div>
                ) : mostSellingProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {mostSellingProducts.map((product) => {
                      const hasDiscount = product.discount_rate && product.discount_rate > 0;
                      const finalPrice = hasDiscount ? product.price * (1 - (product.discount_rate || 0) / 100) : product.price;

                      return (
                        <div key={`best-${product.id}`} onClick={() => navigateToView('product-details', product.category, product)} className="group cursor-pointer bg-white p-3 border border-stone-200/60 rounded-sm hover: shadow-3xs transition-all duration-300 relative">
                          <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                            <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-[0.8s]" />
                          </div>
                          <div className="space-y-1 px-1">
                            <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{product.category}</div>
                            <h4 className="font-serif text-base text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">{product.name}</h4>
                            <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-stone-950 font-medium">₹{Math.round(finalPrice).toLocaleString()}</span>
                                {hasDiscount ? <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded-3xs">(-{product.discount_rate}%)</span> : null}
                              </div>
                              <span className="text-[9px] tracking-[0.15em] uppercase text-stone-400 group-hover:text-stone-950 flex items-center gap-1">View <ArrowRight size={10} /></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-stone-400">No most selling indicators flagged across dynamic products.</div>
                )}
              </div>
            </section>

            {/* MINIMAL ARCHITECTURAL NEWSLETTER PORTAL */}
            <section className="bg-stone-950 text-[#f5f2eb] pt-24 pb-8 lg:pb-24 border-t border-stone-900">
              <div className="max-w-2xl mx-auto px-8 text-center space-y-6">
                <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#c5a880]">Aura Invitations</p>
                <h4 className="font-serif text-2xl md:text-3xl uppercase tracking-widest font-light">Don't Miss a Drop</h4>
                <p className="font-sans text-xs text-stone-400 font-light max-w-md mx-auto leading-relaxed tracking-wide">
                  Get immediate notifications on new releases, upcoming local gallery exhibitions, and secret markdown sales.
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

      {/* FOOTER BASE */}
      <footer className="bg-stone-950 text-stone-500 border-t border-stone-900 px-8 py-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col-reverse lg:flex-row justify-between items-center gap-4 text-center lg:text-left">
          <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-stone-500">
            &copy; 2026 Aura Inc. High-End Portfolio Framework &mdash; By Harshita Jain
          </p>
          <span className="h-[0.5px] w-full bg-stone-500 block lg:hidden" />
          <div className="flex flex-col md:flex-row gap-6 text-[9px] tracking-[0.2em] uppercase font-sans font-light text-stone-500">
            <span onClick={() => navigateToView('privacy-policy')} className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Privacy Policy</span>
            <span onClick={() => navigateToView('terms-of-service')} className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Terms of Service</span>
            <span onClick={() => navigateToView('return-and-refund')} className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Return & Exchange Policy</span>
            <span onClick={() => navigateToView('shipping-delivery')} className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Shipping & Delivery</span>
            <span onClick={() => navigateToView('cancellation-refund')} className="hover:text-[#f5f2eb] cursor-pointer transition-colors">Cancellation & Refund Policy</span>
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCloseDrawer} 
        cartItems={cartItems} 
        onRemoveItem={handleRemoveCartItem}
        setCartItems={setCartItems}
        onNavigateToCollection={() => {
          navigateToView('collection', 'All', null);
          setIsCartOpen(false);
        }} 
        onCheckoutTrigger={handleCheckoutTrigger}
        user={user}
      />
    </div>
  );
}

export default App;