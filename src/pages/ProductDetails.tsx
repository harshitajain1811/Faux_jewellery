import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Heart, Star, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_rate?: number;
  main_image: string;
  sub_images?: string[]; // Array field for sub images if available in your db schema
  category: string;
  polish?: string;
  is_new?: boolean;
  is_most_selling?: boolean;
  is_featured?: boolean;
  created_at: string;
  size_stock?: Record<string, number>;
}

interface ProductDetailsProps {
  product: Product;
  wishlist: Product[];
  user: { 
    id: string; 
    email: string; 
    full_name?: string; 
  } | null;
  onToggleWishlist: (product: Product) => void;
  onAddToBag: (quantity: number, size: string) => void;
  navigateToView: (targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details" | "wishlist", targetCategory?: string, targetProduct?: any) => void; 
}

export default function ProductDetails({ product, wishlist, user, onToggleWishlist, onAddToBag, navigateToView }: ProductDetailsProps) {
  const isWishlisted = wishlist.some(item => item.id === product.id);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. DYNAMIC CATEGORY SIZE STANDARD MATCHING
  const definedSizesMatrix = useMemo(() => {
    const categoryLower = (product.category || '').toLowerCase();
    if (categoryLower === 'ring') {
      return ['6', '7', '8', '9'];
    }
    if (categoryLower.includes('bangle')) {
      return ['2.2', '2.4', '2.6', '2.8'];
    }
    // Fallback directly to whatever keys are defined in DB if category standard doesn't match
    return product.size_stock ? Object.keys(product.size_stock) : [];
  }, [product.category, product.size_stock]);

  // Determine standard lowest available size default setting
  const initialSelectedSize = useMemo(() => {
    if (!product.size_stock) return '';
    
    // Find all sizes within standard matrix that are in stock (> 0)
    const availableInStock = definedSizesMatrix.filter(
      (size) => product.size_stock?.[size] && product.size_stock[size] > 0
    );

    if (availableInStock.length > 0) {
      // Sort ascending to grab lowest numerical or alphanumeric size entry
      return [...availableInStock].sort((a, b) => parseFloat(a) - parseFloat(b))[0];
    }

    // Secondary fallback to standard keys if defined standard matrix returned no matches
    const allDbKeys = Object.keys(product.size_stock);
    const dbKeysInStock = allDbKeys.filter((k) => (product.size_stock?.[k] ?? 0) > 0);
    if (dbKeysInStock.length > 0) {
      return [...dbKeysInStock].sort((a, b) => parseFloat(a) - parseFloat(b))[0];
    }
    
    return allDbKeys[0] || '';
  }, [definedSizesMatrix, product.size_stock]);

  const [selectedSize, setSelectedSize] = useState<string>('');

  // Synchronize dynamic default size updates upon loading an alternate product blueprint
  useEffect(() => {
    setSelectedSize(initialSelectedSize);
    setSelectedQuantity(1);
  }, [initialSelectedSize, product.id]);

  // 2. STOCK LIMIT CALCULATION FOR SELECTED VARIANT
  const maxAvailableStock = useMemo(() => {
    if (!product.size_stock || !selectedSize) return 0;
    // Safely return the numerical value from DB map record
    return product.size_stock[selectedSize] ?? 0;
  }, [product.size_stock, selectedSize]);

  // Enforce safety limits if user changes sizes and previous quantity exceeds new max stock limits
  useEffect(() => {
    if (selectedQuantity > maxAvailableStock && maxAvailableStock > 0) {
      setSelectedQuantity(maxAvailableStock);
    }
  }, [selectedSize, maxAvailableStock]);

  const isOutOfStock = maxAvailableStock <= 0;
  const isAtQuantityLimit = selectedQuantity >= maxAvailableStock;

  // 3. DYNAMIC SUB IMAGES RESOLUTION EVALUATION
  const productSubImages = useMemo(() => {
    if (product.sub_images && Array.isArray(product.sub_images) && product.sub_images.length > 0) {
      return product.sub_images;
    }
    return [];
  }, [product.sub_images]);

  const [activeViewerImage, setActiveViewerImage] = useState<string>(product.main_image);

  useEffect(() => {
    setActiveViewerImage(product.main_image);
  }, [product.main_image, product.id]);

  // 3. PRICING SYSTEM CALCULATIONS
  const hasDiscount = product.discount_rate !== undefined && product.discount_rate > 0;
  const calculatedDiscountedPrice = hasDiscount 
    ? product.price * (1 - (product.discount_rate || 0) / 100) 
    : product.price;

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .not('id', 'eq', product.id)
          .limit(4);

        if (!error && data) {
          setSimilarProducts(data as Product[]);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    }
    fetchSimilar();
  }, [product.id]);

  // Determine if the product is fully out of stock across all sizes
  const isNetOutOfStock = useMemo(() => {
    if (!product.size_stock) return true;
    const totalStock = Object.values(product.size_stock).reduce((sum, val) => sum + val, 0);
    return totalStock <= 0;
  }, [product.size_stock]);

  useEffect(() => {
  async function fetchSimilar() {
    try {
      // 1. Primary Attempt: Match category (type) exactly, excluding current product
      let { data: matches, error } = await supabase
        .from('products')
        .select('*')
        .not('id', 'eq', product.id)
        .eq('category', product.category)
        .limit(4);

      if (error) throw error;

      // 2. Fallback Attempt: If category matching yielded fewer than 4 items, backfill using polish
      if (!matches || matches.length < 4) {
        const currentMatchIds = matches ? matches.map(m => m.id) : [];
        
        let fallbackQuery = supabase
          .from('products')
          .select('*')
          .not('id', 'eq', product.id);
          
        if (product.polish) {
          fallbackQuery = fallbackQuery.eq('polish', product.polish);
        }
        
        const { data: fallbackMatches } = await fallbackQuery.limit(4);

        if (fallbackMatches) {
          // Combine unique products avoiding duplicates
          const combined = [...(matches || [])];
          fallbackMatches.forEach(item => {
            if (!combined.some(c => c.id === item.id) && combined.length < 4) {
              combined.push(item);
            }
          });
          matches = combined;
        }
      }

      // 3. Absolute Last Resort: If still empty, fetch any 4 alternative products
      if (!matches || matches.length === 0) {
        const { data: randomFallback } = await supabase
          .from('products')
          .select('*')
          .not('id', 'eq', product.id)
          .limit(4);
        matches = randomFallback || [];
      }

      setSimilarProducts(matches as Product[]);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  }
  
  if (product.id) {
    fetchSimilar();
  }
}, [product.id, product.category, product.polish]);

// --- INTERCEPTED PERSISTENT ROUTINES ---
  
  const handleBagAdditionSync = async () => {
    if (isNetOutOfStock) return;
    setIsSyncing(true);
    
    try {
      // Execute the primary local layout UI sidebar trigger first
      onAddToBag(selectedQuantity, selectedSize);

      if (user?.id) {
        // If logged in, upsert row to remote DB storage
        await supabase
          .from('user_carts')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            size: selectedSize || 'Universal Size',
            quantity: selectedQuantity
          }, { onConflict: 'user_id,product_id,size' });
      }
    } catch (err) {
      console.error("Cart cloud sync rejection:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWishlistToggleSync = async () => {
    if (!user?.id) {
      setShowAuthMessage(true);
      setTimeout(() => { setShowAuthMessage(false); navigateToView('auth'); }, 2500);
      return;
    }
    onToggleWishlist(product);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 antialiased">
      <main className="max-w-7xl w-full mx-auto px-8 py-16">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* LEFT CONTAINER: Premium Image Viewer */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4 lg:sticky lg:top-28">
            
            {/* Extreme Left: Vertical Angle Thumbnails (Shown conditional to array records availability) */}
            {productSubImages.length > 0 && (
              <div className="col-span-2 space-y-3 hidden sm:flex flex-col">
                {[product.main_image, ...productSubImages].map((imgUrl, index) => (
                  <div 
                    key={index} 
                    onClick={() => setActiveViewerImage(imgUrl)}
                    className={`aspect-square w-full bg-white border rounded-sm overflow-hidden cursor-pointer transition-colors ${
                      activeViewerImage === imgUrl ? 'border-stone-950' : 'border-stone-200/60 hover:border-stone-400'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Angle view ${index + 1}`} 
                      className="w-full h-full object-cover brightness-[0.98] contrast-[1.02]" 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Main Featured Image Display */}
            <div className={productSubImages.length > 0 ? "col-span-10" : "col-span-12"}>
              <div className="aspect-square w-full overflow-hidden bg-white border border-stone-200/40 rounded-sm relative group">
                <img 
                  src={activeViewerImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-101"
                />
                <span className="absolute top-4 left-4 bg-stone-950 text-[#f5f2eb] text-[9px] uppercase tracking-[0.2em] px-3 py-1 font-sans rounded-xs">
                  {product.category}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER: Premium Detail Matrix */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-5 space-y-8"
          >
            {/* Title & Core Meta Matrix */}
            <div className="space-y-3 border-b border-stone-200/50 pb-6">
              <div className="flex items-center gap-1 text-[#c5a880]">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" stroke="none" />)}
                <span className="text-[10px] tracking-wider text-stone-400 font-sans pl-1.5">(4.9/5 Genuine Atelier Reviews)</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl tracking-wide uppercase font-light text-stone-900">
                {product.name}
              </h2>
              
              {/* Conditional Pricing Rendering Tree */}
              <div className="flex items-baseline gap-3 pt-1">
                {hasDiscount ? (
                  <>
                    <span className="font-sans text-2xl font-medium text-stone-950">
                      ${Math.round(calculatedDiscountedPrice).toLocaleString()}
                    </span>
                    <span className="font-sans text-sm text-stone-400 line-through">
                      ${product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] tracking-wider font-sans font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs uppercase">
                      Save {product.discount_rate}%
                    </span>
                  </>
                ) : (
                  <span className="font-sans text-2xl font-light text-stone-950">
                    ${product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Sizing Matrix Processing Section */}
            {definedSizesMatrix.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 block">Select Size</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {definedSizesMatrix.map((size) => {
                    const stockVolume = product.size_stock?.[size] ?? 0;
                    const isSizeSoldOut = stockVolume <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isSizeSoldOut}
                        onClick={() => {
                          setSelectedSize(size);
                          setSelectedQuantity(1);
                        }}
                        className={`px-4 py-2.5 text-xs font-sans border tracking-wider transition-all duration-200 minimum-w-[44px] ${
                          isSelected
                            ? "border-stone-950 bg-stone-950 text-white font-medium"
                            : isSizeSoldOut
                            ? "border-stone-200 bg-stone-50 text-stone-300 line-through cursor-not-allowed opacity-60"
                            : "border-stone-200 text-stone-800 hover:border-stone-950 cursor-pointer bg-white"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Quantity Stepper */}
            {!isOutOfStock && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Quantity</h4>
                <div className="flex flex-col gap-2.5">
                  <div className="inline-flex items-center border border-stone-200 rounded-xs bg-white self-start">
                    <span className="px-4 text-sm font-sans font-light w-12 text-center">{selectedQuantity}</span>
                    <div className="flex flex-col border-l border-stone-200">
                      <button 
                        disabled={isAtQuantityLimit}
                        onClick={() => setSelectedQuantity(prev => Math.min(maxAvailableStock, prev + 1))} 
                        className={`px-2 py-1 text-[10px] select-none transition-colors ${
                          isAtQuantityLimit 
                            ? "text-stone-300 bg-stone-50/50 cursor-not-allowed" 
                            : "text-stone-500 hover:text-stone-950 cursor-pointer"
                        }`}
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))} 
                        className="px-2 py-1 text-[10px] text-stone-500 hover:text-stone-950 cursor-pointer border-t border-stone-100"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT VAULT LIMIT REACHED STOCK FLAGGER */}
                  {isAtQuantityLimit && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-amber-800 bg-amber-50/60 border border-amber-200/40 rounded-xs p-3 text-xs font-sans max-w-sm tracking-wide"
                    >
                      <AlertCircle size={14} strokeWidth={2} className="shrink-0 text-amber-700" />
                      <span>
                        Only <strong>{maxAvailableStock} unit{maxAvailableStock > 1 ? 's' : ''}</strong> of this sizing selection are currently remaining in stock.
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Collapsible Design Information Block */}
            <div className="space-y-6 pt-4 border-t border-stone-200/50">
              <div className="space-y-2">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Design Overview</h4>
                <p className={`font-sans text-sm leading-relaxed text-stone-600 font-light tracking-wide transition-all duration-300 ${
                  isDescExpanded ? 'line-clamp-none' : 'line-clamp-4'
                }`}>
                  {product.description || "No artisan specifications logged for this record profile entry."}
                </p>
                {product.description && product.description.length > 160 && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-[11px] uppercase tracking-wider text-[#c5a880] hover:text-stone-950 font-sans block pt-1 cursor-pointer"
                  >
                    {isDescExpanded ? 'See Less —' : 'See More +'}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Maison Care Instructions</h4>
                <p className="font-sans text-xs leading-relaxed text-amber-700/90 font-light tracking-wide bg-amber-50/40 p-3 border border-amber-200/20 rounded-xs">
                  To preserve the high-intensity protective micro-sealing layer, avoid direct contact with high-moisture elements, heavy alcohol perfumes, or sanitizers.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS MATRIX INTERLOCK (With updated OOS Alert above the button) */}
            <div className="space-y-3 pt-2">
              {isNetOutOfStock && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-800 bg-red-50/60 border border-red-200/40 rounded-xs p-3 text-xs font-sans tracking-wide"
                >
                  <AlertCircle size={14} className="shrink-0 text-red-700" />
                  <span>This product is currently out of stock.</span>
                </motion.div>
              )}

              {showAuthMessage && (
                  <div className="flex items-center gap-2 whitespace-nowrap text-[#c5a880] font-bold text-[10px] font-sans uppercase tracking-widest animate-fade-in z-50">
                    Please sign in to save items to your wishlist
                  </div>
                )}

              {/* ACTION BUTTONS MATRIX INTERLOCK */}
            <div className="space-y-3 pt-2">
              {isNetOutOfStock && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-800 bg-red-50/60 border border-red-200/40 rounded-xs p-3 text-xs font-sans tracking-wide"><AlertCircle size={14} className="shrink-0 text-red-700" /><span>This product is out of stock.</span></motion.div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button"
                  disabled={isNetOutOfStock || isSyncing} 
                  onClick={handleBagAdditionSync}
                  className={`grow group flex items-center justify-center gap-3 border px-8 py-4 text-xs tracking-widest uppercase transition-all duration-300 shadow-sm ${
                    isNetOutOfStock || isSyncing
                      ? "bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed" 
                      : "bg-stone-950 text-white border-stone-900 hover:bg-transparent hover:text-stone-950 cursor-pointer"
                  }`}
                >
                  {isSyncing ? "Syncing Maison Vault..." : "Acquire to Bag"}
                </button>
                
                <button 
                  type="button"
                  onClick={handleWishlistToggleSync}
                  className={`p-4 border rounded-xs transition-colors duration-300 cursor-pointer ${
                    isWishlisted ? 'border-red-200 bg-red-50/40 text-red-500' : 'border-stone-200 text-stone-600 hover:text-stone-950 hover:border-stone-400'
                  }`}
                >
                  <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </div>              
            </div>
          </motion.div>
        </div>

        {/* SIMILAR PRODUCTS SECTION (Updated with category filter route navigation) */}
        <section className="mt-24 pt-16 border-t border-stone-200/60 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Atelier Curations</p>
              <h3 className="font-serif text-2xl uppercase tracking-wider text-stone-900 font-light">View Similar Products</h3>
            </div>
            <button 
              onClick={() => navigateToView('collection', product.category, null)} 
              className="text-xs uppercase tracking-widest font-sans font-light text-stone-500 hover:text-stone-950 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              View Full Vault <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {similarProducts.map((item) => (
              <div key={item.id} onClick={() => navigateToView('product-details', item.category, item)}
              className="group cursor-pointer bg-white p-3 border border-stone-200/20 hover:border-stone-200 transition-all duration-300">
                <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                  <img src={item.main_image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 px-1">
                  <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{item.category}</div>
                  <h4 className="font-serif text-sm text-stone-900 truncate font-light tracking-wide">{item.name}</h4>
                  <div className="pt-2 flex justify-between items-center text-xs font-sans mt-2 border-t border-stone-100/60">
                    <span className="text-stone-950 font-medium">${item.price.toLocaleString()}</span>
                    <span className="text-[9px] tracking-[0.15em] uppercase text-[#c5a880]">Explore</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}