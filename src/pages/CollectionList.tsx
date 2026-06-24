import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. UPDATED PRODUCT SCHEMA
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  main_image: string;
  category: string;
  size_stock?: Record<string, number>;
  polish?: string;
}

interface CollectionListProps {
  onSelectProduct: (product: Product) => void;
  initialCategory: string;
  onBack: () => void;
}

export default function CollectionList({ onSelectProduct, initialCategory, onBack }: CollectionListProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Core Filtering States
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [selectedPolish, setSelectedPolish] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('One Size'); // New Size Tracker
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Dropdown Accordion Toggle States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPolishDropdownOpen, setIsPolishDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false); // New Size Dropdown state
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    async function fetchCompleteCatalog() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
          setAllProducts(data);
          setFilteredProducts(data);
        }
      } catch (err) {
        console.error("Error connecting matrix keys:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompleteCatalog();
  }, []);

  // A. Dynamic Categories extracted directly from unique DB rows
  const dynamicCategories = useMemo(() => {
    const categories = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    // Converts to normal array and capitalizes properly
    return ['All', ...Array.from(categories)];
  }, [allProducts]);

  // B. Dynamic Polishes extracted directly from your new DB column
  const dynamicPolishes = useMemo(() => {
    const polishes = new Set<string>();
    allProducts.forEach(p => {
      if (p.polish) polishes.add(p.polish);
    });
    return ['All', ...Array.from(polishes)];
  }, [allProducts]);

  // 2. DYNAMIC SIZE OPTIONS ENGINE
  const dynamicSizeOptions = useMemo(() => {
    const uniqueSizes = new Set<string>(['One Size']);
    allProducts.forEach(product => {
      if (activeCategory === 'All' || product.category?.toLowerCase() === activeCategory.toLowerCase()) {
        if (product.size_stock) {
          Object.keys(product.size_stock).forEach(sizeKey => uniqueSizes.add(sizeKey));
        }
      }
    });
    return Array.from(uniqueSizes);
  }, [allProducts, activeCategory]);

  // Dependent Filter Reset Guard
  useEffect(() => {
    if (!dynamicSizeOptions.includes(selectedSize)) {
      setSelectedSize('One Size');
    }
  }, [dynamicSizeOptions, selectedSize]);

  useEffect(() => {
    if (!dynamicPolishes.includes(selectedPolish)) {
      setSelectedPolish('All');
    }
  }, [dynamicPolishes, selectedPolish]);

  // 3. MULTI-TIER FILTER COMPUTATION
  useEffect(() => {
    let result = [...allProducts];

    // Category Filter
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Polish Variant Filter
    if (selectedPolish !== 'All') {
      result = result.filter(p => (p as any).polish?.toLowerCase() === selectedPolish.toLowerCase());
    }

    // Dynamic Size Filter
    if (selectedSize !== 'One Size') {
      result = result.filter(p => p.size_stock && p.size_stock[selectedSize] !== undefined);
    }

    // Price Ceiling Limits
    result = result.filter(p => p.price <= maxPrice);

    // FIXED QUANTITY/AVAILABILITY CHECK (Reads from JSONB map instead of non-existent global property)
    if (hideOutOfStock) {
      result = result.filter(p => {
        if (!p.size_stock) return false;
        if (selectedSize !== 'One Size') {
          return (p.size_stock[selectedSize] || 0) > 0;
        }
        const combinedTotalStock = Object.values(p.size_stock).reduce((a, b) => a + b, 0);
        return combinedTotalStock > 0;
      });
    }

    // Sort Processing
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [activeCategory, selectedPolish, selectedSize, maxPrice, hideOutOfStock, sortBy, allProducts]);

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 space-y-8">

      <button onClick={onBack} className="group flex items-center gap-2 text-xs tracking-widest uppercase font-sans font-light text-stone-500 hover:text-stone-950 transition-colors">
        ← Return to Maison Atelier
      </button>
      
      <div className="flex justify-between items-end border-b border-stone-200/60 pb-5">
        <div>
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Atelier Curations</p>
          <h2 className="font-serif text-2xl uppercase tracking-widest text-stone-900 font-light mt-1">The Collection Registry</h2>
        </div>
        
        <div className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 rounded-xs text-xs font-sans">
          <SlidersHorizontal size={11} className="text-stone-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none outline-none text-stone-700 p-0">
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ==========================================
    LEFT SIDEBAR FILTER: LUXURY ANIMATED MATRIX
    ========================================== */}
<aside className="lg:col-span-3 space-y-3 lg:sticky lg:top-32 bg-stone-50/60 backdrop-blur-md p-6 border border-stone-200/50 rounded-sm select-none shadow-xs">
  
  {/* GLOBAL ADMINISTRATIVE NAVIGATION ROW */}
  <div className="flex justify-between items-center border-b border-stone-200/80 pb-4 mb-2">
    <h3 className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-stone-900">Refine Matrix</h3>
    <button 
      onClick={() => {
        setActiveCategory('All');
        setSelectedPolish('All');
        setSelectedSize('One Size');
        setMaxPrice(3000);
        setHideOutOfStock(false);
        setSortBy('featured');
      }}
      className="text-[10px] uppercase tracking-[0.25em] font-sans font-light text-stone-400 hover:text-amber-800 transition-colors duration-300"
    >
      Reset All
    </button>
  </div>

  {/* 1. DYNAMIC JEWELLERY TYPES DRAWER */}
  <div className="border-b border-stone-200/40 pb-3">
    <button 
      onClick={() => {
        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
        setIsPolishDropdownOpen(false);
        setIsSizeDropdownOpen(false);
      }}
      className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group"
    >
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Jewellery Type</span>
        <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">{activeCategory}</span>
      </div>
      <motion.span 
        animate={{ rotate: isCategoryDropdownOpen ? 180 : 0, color: isCategoryDropdownOpen ? '#861b1b' : '#a8a29e' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="text-[9px] origin-center px-1"
      >
        ▼
      </motion.span>
    </button>
    
    <AnimatePresence initial={false}>
      {isCategoryDropdownOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden bg-white/60 border border-stone-200/40 mt-1 rounded-xs"
        >
          <div className="flex flex-col space-y-0.5 p-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setIsCategoryDropdownOpen(false);
                }}
                className={`text-left text-xs py-2 px-3 rounded-xs font-sans tracking-wide transition-all duration-300 ${
                  activeCategory.toLowerCase() === cat.toLowerCase() 
                    ? 'bg-stone-950 text-white font-medium pl-4' 
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 hover:pl-4'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 2. DYNAMIC POLISH FINISH DRAWER */}
  <div className="border-b border-stone-200/40 pb-3">
    <button 
      onClick={() => {
        setIsPolishDropdownOpen(!isPolishDropdownOpen);
        setIsCategoryDropdownOpen(false);
        setIsSizeDropdownOpen(false);
      }}
      className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group"
    >
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Polish Finish</span>
        <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">
          {selectedPolish === 'All' ? 'All Tones' : `${selectedPolish} Tone`}
        </span>
      </div>
      <motion.span 
        animate={{ rotate: isPolishDropdownOpen ? 180 : 0, color: isPolishDropdownOpen ? '#861b1b' : '#a8a29e' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="text-[9px] origin-center px-1"
      >
        ▼
      </motion.span>
    </button>
    
    <AnimatePresence initial={false}>
      {isPolishDropdownOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden bg-white/60 border border-stone-200/40 mt-1 rounded-xs"
        >
          <div className="flex flex-col space-y-0.5 p-1.5">
            {dynamicPolishes.map((polish) => (
              <button
                key={polish}
                onClick={() => {
                  setSelectedPolish(polish);
                  setIsPolishDropdownOpen(false);
                }}
                className={`text-left text-xs py-2 px-3 rounded-xs font-sans tracking-wide transition-all duration-300 ${
                  selectedPolish.toLowerCase() === polish.toLowerCase() 
                    ? 'bg-stone-950 text-white font-medium pl-4' 
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 hover:pl-4'
                }`}
              >
                {polish === 'All' ? 'All Tones' : `${polish} Tone`}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 3. DYNAMIC SIZE DRAWER */}
  <div className="border-b border-stone-200/40 pb-3">
    <button 
      onClick={() => {
        setIsSizeDropdownOpen(!isSizeDropdownOpen);
        setIsCategoryDropdownOpen(false);
        setIsPolishDropdownOpen(false);
      }}
      className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group"
    >
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Available Size</span>
        <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">{selectedSize}</span>
      </div>
      <motion.span 
        animate={{ rotate: isSizeDropdownOpen ? 180 : 0, color: isSizeDropdownOpen ? '#861b1b' : '#a8a29e' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="text-[9px] origin-center px-1"
      >
        ▼
      </motion.span>
    </button>
    
    <AnimatePresence initial={false}>
      {isSizeDropdownOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden bg-white/60 border border-stone-200/40 mt-1 rounded-xs"
        >
          <div className="flex flex-col space-y-0.5 p-1.5 max-h-42 overflow-y-auto custom-scrollbar">
            {dynamicSizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  setIsSizeDropdownOpen(false);
                }}
                className={`text-left text-xs py-2 px-3 rounded-xs font-sans tracking-wide transition-all duration-300 ${
                  selectedSize === size 
                    ? 'bg-stone-950 text-white font-medium pl-4' 
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 hover:pl-4'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 4. DYNAMIC PRICE SLIDER PANEL */}
  <div className="border-b border-stone-200/40 pb-4">
    <button 
      onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
      className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group"
    >
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Price Range</span>
        <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">${maxPrice} Max Ceiling</span>
      </div>
      <motion.span 
        animate={{ rotate: isPriceDropdownOpen ? 180 : 0, color: isPriceDropdownOpen ? '#861b1b' : '#a8a29e' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="text-[9px] origin-center px-1"
      >
        ▼
      </motion.span>
    </button>
    
    <AnimatePresence initial={false}>
      {isPriceDropdownOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden"
        >
          <div className="space-y-3 px-1 pt-2 pb-1">
            <input 
              type="range" 
              min="50" 
              max="3000" 
              step="25" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))} 
              className="w-full accent-stone-950 h-[3px] bg-stone-200 rounded-lg cursor-pointer appearance-none transition-all" 
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 5. MINIMAL LUXURY TOGGLE FOR AVAILABILITY */}
  <div className="pt-2">
    <label className="flex items-center justify-between cursor-pointer select-none group text-[11px] font-sans tracking-wide text-stone-600 hover:text-stone-950 transition-colors duration-300">
      <span>Hide Vault Out-of-Stock</span>
      <div className="relative w-7 h-4 bg-stone-200 rounded-full p-0.5 group-hover:bg-stone-300/80 transition-colors duration-300 flex items-center">
        <input 
          type="checkbox" 
          checked={hideOutOfStock} 
          onChange={(e) => setHideOutOfStock(e.target.checked)} 
          className="sr-only" 
        />
        <motion.div 
          animate={{ x: hideOutOfStock ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`w-3 h-3 rounded-full shadow-xs ${hideOutOfStock ? 'bg-stone-950' : 'bg-white'}`}
        />
      </div>
    </label>
  </div>
</aside>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="py-32 text-center text-xs tracking-widest text-stone-400 uppercase font-sans animate-pulse">
              Syncing active vault ledgers...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                // Determine if out-of-stock badge should show based on context
                const isItemSoldOut = (() => {
                  if (!product.size_stock) return false;
                  const total = Object.values(product.size_stock).reduce((a, b) => a + b, 0);
                  return total <= 0;
                })();

                return (
                  <div key={product.id} onClick={() => onSelectProduct(product)} className="group cursor-pointer bg-white p-3 border border-stone-200/20 hover:border-stone-200/80 shadow-xs transition-all duration-300 rounded-sm">
                    <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-3 relative">
                      <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500" />
                      {isItemSoldOut && (
                        <span className="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-xs text-white text-[8px] font-sans uppercase tracking-widest px-2 py-0.5">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 px-0.5">
                      <span className="text-[9px] tracking-widest font-sans uppercase text-stone-400">{product.category}</span>
                      <h4 className="font-serif text-sm text-stone-900 group-hover:text-[#c5a880] truncate font-light tracking-wide">{product.name}</h4>
                      <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                        <span className="text-stone-950 font-medium">${product.price.toLocaleString()}</span>
                        <span className="text-[9px] tracking-wider uppercase text-stone-400 group-hover:text-stone-950 flex items-center gap-1">
                          Acquire <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center space-y-2 border border-dashed border-stone-200 bg-stone-50/50 rounded-sm">
              <p className="font-serif text-sm text-stone-400 italic">No inventory allocations match your active configuration state.</p>
              <button onClick={() => { setActiveCategory('All'); setSelectedPolish('All'); setSelectedSize('One Size'); setMaxPrice(3000); setHideOutOfStock(false); }} className="text-[10px] uppercase font-sans tracking-widest text-[#c5a880] underline pt-2 block mx-auto">
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}