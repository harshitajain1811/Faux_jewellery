import { useEffect, useState, useMemo } from 'react';
import { Sparkles, ArrowRight, ShoppingBag, Menu, Heart, MapPin, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import AuthPage from './pages/AuthPage';
import UserProfilePage from './pages/UserProfilePage';
import ProductDetails from './pages/ProductDetails';
import CartDrawer from './components/CartDrawer';
import CollectionList from './pages/CollectionList';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';

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
  
  const handleRemoveCartItem = (indexToRemove: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };
  
  const [currentPage, setCurrentPage] = useState<'home' | 'collection' | 'auth' | 'profile' | 'checkout' | 'admin'>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedProduct, currentPage]);

  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setProfileName(data.full_name);
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
          full_name: profileName || '' 
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
          full_name: profileName || ''
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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 antialiased selection:bg-stone-200">
      
      {/* 1. TOP MARQUEE ANNOUNCEMENT */}
      <div className="bg-stone-950 text-[#f5f2eb] text-[10px] tracking-[0.25em] uppercase py-2.5 px-4 text-center font-sans font-light border-b border-stone-800">
        Complimentary Insured Courier Delivery Worldwide &mdash; Aura Atelier
      </div>

      {/* 2. STICKY EDITORIAL NAVIGATION */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#faf9f6]/85 border-b border-stone-200/40 px-8 py-4 flex justify-between items-center transition-all duration-300 select-none">
        <div className="flex-1 flex items-center gap-6">
          <Menu size={18} strokeWidth={1.2} className="cursor-pointer text-stone-600 hover:text-stone-950 transition-colors" />
          <div className="hidden md:flex items-center gap-6 text-[11px] tracking-[0.2em] uppercase font-sans font-light text-stone-600">
            <span onClick={() => { setGlobalCategoryFilter('All'); setCurrentPage('collection'); setSelectedProduct(null); }} className="cursor-pointer hover:text-stone-950 transition-colors">All Collections</span>
            <span onClick={() => { setCurrentPage('home'); setSelectedProduct(null); }} className="cursor-pointer hover:text-stone-950 transition-colors">The Maison</span>
          </div>
        </div>

        <h1 
          className="font-serif text-2xl tracking-[0.3em] uppercase text-stone-950 text-center cursor-pointer select-none" 
          onClick={() => { setCurrentPage('home'); setSelectedProduct(null); }}
        >
          Aura
        </h1>

        <div className="flex-1 flex items-center justify-end gap-5 text-stone-600">
          <div className="hidden sm:flex items-center gap-1.5 h-7 cursor-pointer hover:text-stone-950 transition-colors">
            <MapPin size={13} strokeWidth={1.3} />
            <span className="text-[10px] tracking-widest uppercase font-sans font-light pt-px">Boutiques</span>
          </div>

          <div className="relative flex items-center h-7">
            {user ? (
              user.email === 'harshiqatest@gmail.com' ? (
                <button 
                  onClick={() => setCurrentPage('admin')}
                  className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-sans font-medium text-amber-800 hover:text-stone-950 transition-colors cursor-pointer group outline-none"
                  title="Access Atelier Management Terminal"
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
                    <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-950 flex items-center justify-center text-stone-100 text-[9px] font-sans font-medium uppercase tracking-normal">
                      {profileName ? profileName.charAt(0) : user.email.charAt(0)}
                    </div>
                    <span className="text-[8px] text-stone-400 scale-85">▼</span>
                  </button>

                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-48 bg-white border border-stone-200 rounded-xs shadow-xl py-1 z-40 text-left overflow-hidden">
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-[10px] font-sans tracking-wider uppercase text-stone-400">Account</p>
                          <p className="text-xs font-sans font-medium text-stone-900 truncate mt-0.5">
                            {profileName ? `Welcome, ${profileName}` : 'Welcome Back'}
                          </p>
                        </div>
                        <button
                          onClick={() => { setCurrentPage('profile'); setIsProfileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-sans text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-colors cursor-pointer"
                        >
                          My Profile Details
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            setUser(null);
                            setCurrentPage('home');
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
                onClick={() => setCurrentPage('auth')}
                className="text-[10px] tracking-widest uppercase font-sans font-light hover:text-stone-950 transition-colors cursor-pointer h-full"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="relative cursor-pointer hover:text-stone-950 transition-colors flex items-center justify-center w-6 h-7">
            <Heart size={17} strokeWidth={1.2} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-1.5 bg-[#c5a880] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-sans font-medium shadow-xs">
                {wishlist.length}
              </span>
            )}
          </div>

          <div className="relative cursor-pointer hover:text-stone-950 transition-colors flex items-center justify-center w-6 h-7" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={17} strokeWidth={1.2} />
            <span className="absolute -top-0.5 -right-1.5 bg-stone-950 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-sans font-medium shadow-xs">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
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
              setCurrentPage('home');
              alert("Order Successfully Authorized and Processed!");
            }}
            onBack={() => setCurrentPage('collection')} 
          />
        ) : selectedProduct ? (
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
        ) : currentPage === 'auth' ? (
          <AuthPage 
            onAuthSuccess={(email) => {
              setUser({ id: '', email });
              setCurrentPage('home');
            }}
            onBack={() => setCurrentPage('home')}
          />
        ) : currentPage === 'profile' ? (
          <UserProfilePage 
            user={user} 
            onBack={(targetView?: string) => {
              if (targetView) {
                setCurrentPage('collection');
              } else {
                setCurrentPage('home');
              }
            }}
          />
        ) : currentPage === 'admin' ? (
          <AdminDashboard onBack={() => setCurrentPage('home')} />
        ) : currentPage === 'collection' ? (
          <CollectionList 
            onSelectProduct={(prod) => setSelectedProduct(prod)} 
            initialCategory={globalCategoryFilter || 'All'}
            onBack={() => setCurrentPage('home')}
          />
        ) : (
          <>
            {/* 3. HERO LOOKBOOK BLOCK */}
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

            {/* ==========================================
                 NEW ARRIVALS
               ========================================== */}
            <section className="bg-white py-24">
              <div className="max-w-7xl w-full mx-auto px-8 space-y-12">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[#c5a880] text-[10px] tracking-[0.3em] uppercase font-medium">
                    <Sparkles size={10} /> Fresh From The Atelier
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
                      <div key={`new-${product.id}`} onClick={() => setSelectedProduct(product)} className="group cursor-pointer bg-white p-3 border border-stone-200/60 rounded-sm hover:shadow-3xs transition-all duration-300">
                        <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                          <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-[0.8s]" />
                        </div>
                        <div className="space-y-1 px-1">
                          <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{product.category}</div>
                          <h4 className="font-serif text-base text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">{product.name}</h4>
                          <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                            <span className="text-stone-950 font-medium">${product.price.toLocaleString()}</span>
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

            {/* ==========================================
                 7-DAY CAPSULE
                ========================================== */}
              {rotationShowcase && (
                <section className="w-full bg-[#faf9f6] py-20 px-8 border-b border-stone-200/30 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-120">
                    {/* Visual Asset Block (Now on Left) */}
                    <div className="md:col-span-7 bg-stone-50 relative overflow-hidden min-h-87.5 md:min-h-full border-b md:border-b-0 md:border-r border-stone-200/30">
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

                  {/* Editorial Text Block (Now on Right) */}
                  <div className="md:col-span-5 p-12 lg:p-20 space-y-6 flex flex-col justify-center bg-[#faf9f6]/40">
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
                        onClick={() => { setGlobalCategoryFilter(rotationShowcase.category); setCurrentPage('collection'); }}
                        className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase text-stone-900 hover:text-[#c5a880] font-sans font-medium transition-colors border-b border-stone-950 pb-0.5"
                      >
                        Explore This Capsule Layout<ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ==========================================
                 BEST SELLING SECTION
               ========================================== */}
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
                        <div key={`best-${product.id}`} onClick={() => setSelectedProduct(product)} className="group cursor-pointer bg-white p-3 border border-stone-200/60 rounded-sm hover: shadow-3xs transition-all duration-300 relative">
                          <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                            <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-[0.8s]" />
                          </div>
                          <div className="space-y-1 px-1">
                            <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{product.category}</div>
                            <h4 className="font-serif text-base text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">{product.name}</h4>
                            <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-stone-950 font-medium">${Math.round(finalPrice).toLocaleString()}</span>
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

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={handleRemoveCartItem} 
        onNavigateToCollection={() => {
          setCurrentPage('collection'); 
          setSelectedProduct(null); 
          setIsCartOpen(false);    
        }} 
        onCheckoutTrigger={() => {
          setCurrentPage('checkout');
          setSelectedProduct(null); 
          setIsCartOpen(false);
        }}
      />
    </div>
  );
}

export default App;