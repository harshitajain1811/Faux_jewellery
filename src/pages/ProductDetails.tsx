import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Heart, ShieldCheck, RefreshCw, Truck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  main_image: string;
  category: string;
  sizes: string[];
}

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  onAddToBag: (quantity: number, size: string) => void;
}

export default function ProductDetails({ product, onBack, wishlist, onToggleWishlist, onAddToBag }: ProductDetailsProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const isWishlisted = wishlist.some(item => item.id === product.id);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'Standard / Adjustable');

// Put this right inside your file component structure
useEffect(() => {
  async function fetchSimilar() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('id', 'eq', product.id) // Security filter: Don't show the exact product currently being viewed
        .limit(4);

      if (!error && data) {
        setSimilarProducts(data);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  }
  fetchSimilar();
}, [product.id]); // Reload recommendations if the user switches items

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 antialiased">
      {/* Main Layout Container */}
      <main className="max-w-7xl w-full mx-auto px-8 py-16">
        {/* Back button link indicator */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-xs tracking-widest uppercase font-sans font-light text-stone-500 hover:text-stone-950 transition-colors mb-10 "
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Atelier Collection
      </button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* LEFT CONTAINER: Premium Image Viewer (Sticky & Multi-Angle) */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4 lg:sticky lg:top-28">
            
            {/* Extreme Left: Vertical Angle Thumbnails */}
            <div className="col-span-2 space-y-3 hidden sm:flex flex-col">
              {[product.main_image, product.main_image, product.main_image, product.main_image].map((imgUrl, index) => (
                <div 
                  key={index} 
                  className="aspect-square w-full bg-white border border-stone-200/60 rounded-sm overflow-hidden cursor-pointer hover:border-stone-950 transition-colors"
                >
                  <img 
                    src={imgUrl} 
                    alt={`Angle view ${index + 1}`} 
                    className="w-full h-full object-cover brightness-[0.98] contrast-[1.02]" 
                  />
                </div>
              ))}
            </div>

            {/* Main Featured Image Display */}
            <div className="col-span-10">
              <div className="aspect-square w-full overflow-hidden bg-white border border-stone-200/40 rounded-sm relative group">
                <img 
                  src={product.main_image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
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
            {/* Title & Core Meta */}
            <div className="space-y-3 border-b border-stone-200/50 pb-6">
              <div className="flex items-center gap-1 text-[#c5a880]">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" stroke="none" />)}
                <span className="text-[10px] tracking-wider text-stone-400 font-sans pl-1.5">(4.9/5 Genuine Atelier Reviews)</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl tracking-wide uppercase font-light text-stone-900">
                {product.name}
              </h2>
              <div className="font-sans text-2xl font-light text-stone-950 pt-1">
                ${product.price.toLocaleString()}
              </div>
            </div>
            

            {/* Sizing Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Select Size</h4>
                <button className="text-[10px] uppercase tracking-wider text-[#c5a880] underline font-sans font-light">Size Guide</button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {product.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((size) => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)} // Updates your tracking slot
                      className={`px-3 py-2 text-xs font-sans border rounded-xs transition-colors ${
                        selectedSize === size
                          ? 'border-stone-900 bg-stone-950 text-white' // Dark active highlight state
                          : 'border-stone-200 hover:border-stone-950 text-stone-600 hover:text-stone-950 bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  // Fallback if a database row doesn't have an explicit size list
                  <button className="px-3 py-2 text-xs font-sans border border-stone-900 bg-stone-950 text-white rounded-xs">
                    Standard / Adjustable
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Quantity Stepper */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Quantity</h4>
              <div className="inline-flex items-center border border-stone-200 rounded-xs bg-white">
                <span className="px-4 text-sm font-sans font-light w-12 text-center">{selectedQuantity}</span>
                <div className="flex flex-col border-l border-stone-200">
                  <button 
                    onClick={() => setSelectedQuantity(prev => prev + 1)}
                    className="px-2 py-1 text-stone-500 hover:text-stone-950 border-b border-stone-200 text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
                    className="px-2 py-1 text-stone-500 hover:text-stone-950 text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Maison Guarantees Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-200/50 pt-6 text-[11px] font-sans font-light text-stone-500">
              <div className="flex gap-2 items-center">
                <Truck size={14} strokeWidth={1.2} className="text-stone-400 shrink-0" />
                <span>Insured Global Freight</span>
              </div>
              <div className="flex gap-2 items-center">
                <RefreshCw size={14} strokeWidth={1.2} className="text-stone-400 shrink-0" />
                <span>30-Day Exchange Privileges</span>
              </div>
              <div className="flex gap-2 items-center">
                <ShieldCheck size={14} strokeWidth={1.2} className="text-stone-400 shrink-0" />
                <span>Anti-Tarnish Seal Assured</span>
              </div>
            </div>

            {/* THE RESTRUCTURED COMPOSITION & INSTRUCTION ARTIFACTS (Now safely below the button) */}
            <div className="space-y-6 pt-4 border-t border-stone-200/50">
              
              {/* Description with Collapsible "See More" Toggle */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Design Overview</h4>
                <p className={`font-sans text-sm leading-relaxed text-stone-600 font-light tracking-wide transition-all duration-300 ${
                  isDescExpanded ? 'line-clamp-none' : 'line-clamp-5'
                }`}>
                  {product.description} This curated statement jewelry piece represents exceptional artisan layout composition. Engineered utilizing skin-safe hypoallergenic alloy bases and triple-dipped in an advanced protection matrix to guarantee premium anti-tarnish brilliance. Designed to match seamlessly with contemporary formal ensembles while providing a completely weightless jewelry wear experience.
                </p>
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-[11px] uppercase  tracking-wider text-[#c5a880] hover:text-stone-950 transition-colors font-sans font-normal block pt-1 focus:outline-none"
                >
                  {isDescExpanded ? 'See Less —' : 'See More +'}
                </button>
              </div>

              {/* Crucial Artificial Care instructions */}
              {/* <div className="space-y-1">
                <h4 className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400">Maison Care Instructions</h4>
                <p className="font-sans text-xs leading-relaxed text-amber-700/90 font-light tracking-wide bg-amber-50/40 p-3 border border-amber-200/20 rounded-xs">
                  To preserve the high-intensity protective micro-sealing layer, avoid direct contact with high-moisture elements, heavy alcohol perfumes, or sanitizers. Store within your complimentary anti-tarnish velvet pouch when resting.
                </p>
              </div> */}
            </div>

            {/* Action Buttons are placed here first */}
            <div className="flex gap-4 pt-2">
              <button onClick={() => onAddToBag(selectedQuantity, selectedSize)} className="grow group flex items-center justify-center gap-3 bg-stone-950 text-white border border-stone-900 px-8 py-4 text-xs tracking-widest uppercase  hover:bg-transparent hover:text-stone-950 transition-all duration-300 shadow-sm">
                Acquire To Bag
              </button>
              {/* Wishlist Button... */}
              <button 
              onClick={() => onToggleWishlist(product)}
              className={`p-4 border rounded-xs  transition-colors duration-300 ${
                isWishlisted ? 'border-red-200 bg-red-50/40 text-red-500' : 'border-stone-200 text-stone-600 hover:text-stone-950 hover:border-stone-400'
              }`}
            >
              <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
            </div>

          </motion.div>
        </div>

        {/* =========================================================
          SIMILAR PRODUCTS SECTION (Placed below independent columns)
          ========================================================= */}
      <section className="mt-24 pt-16 border-t border-stone-200/60 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Atelier Curations</p>
            <h3 className="font-serif text-2xl uppercase tracking-wider text-stone-900 font-light">Complete The Look</h3>
          </div>
          <button className="text-xs uppercase tracking-widest font-sans font-light text-stone-500 hover:text-stone-950 transition-colors flex items-center gap-1.5 self-start sm:self-auto">
            View Full Vault <ArrowRight size={12} />
          </button>
        </div>

        {/* Dynamic Card Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {similarProducts.length > 0 ? (
            similarProducts.map((item) => (
              <div 
                key={item.id} 
                className="group cursor-pointer bg-white p-3 border border-stone-200/20 hover:border-stone-200 shadow-xs hover:shadow-sm transition-all duration-300"
              >
                <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-4 relative">
                  <img 
                    src={item.main_image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
                  />
                </div>
                <div className="space-y-1 px-1">
                  <div className="text-[9px] tracking-[0.2em] font-sans uppercase text-stone-400">{item.category}</div>
                  <h4 className="font-serif text-sm text-stone-900 group-hover:text-[#c5a880] transition-colors truncate font-light tracking-wide">
                    {item.name}
                  </h4>
                  <div className="pt-2 flex justify-between items-center text-xs font-light font-sans mt-2 border-t border-stone-100/60">
                    <span className="text-stone-950 font-medium">${item.price.toLocaleString()}</span>
                    <span className="text-[9px] tracking-[0.15em] uppercase text-[#c5a880] font-normal">
                      Explore
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Elegant placeholder row if database returns empty
            [...Array(4)].map((_, idx) => (
              <div key={idx} className="border border-stone-100 p-4 bg-stone-50 animate-pulse h-64 rounded-sm"></div>
            ))
          )}
        </div>
      </section>
      </main>
    </div>
  );
}