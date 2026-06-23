import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  main_image: string;
  category: string;
  sizes: string[];
  stock: number;
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
  
  // 1. Core Filtering States
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [selectedPolish, setSelectedPolish] = useState<string>('All'); // New Polish Option tracker
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // 2. Dropdown Accordion Toggle States (Controls which menus are open)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(true);
  const [isPolishDropdownOpen, setIsPolishDropdownOpen] = useState(true);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(true);

  useEffect(() => {
    // Synchronize filters if user clicked an external lookbook card link
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

  // Multi-tier Relational Computation Logic
  useEffect(() => {
    let result = [...allProducts];

    // 1. Chapter Types Filter
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // 2. Polish Variant Filter (New)
    if (selectedPolish !== 'All') {
      // Looks for exact match or checks if the product data model contains it
      result = result.filter(p => (p as any).polish?.toLowerCase() === selectedPolish.toLowerCase());
    }

    // 3. Price Ceiling Limits
    result = result.filter(p => p.price <= maxPrice);

    // 4. Quantity/Availability Check
    if (hideOutOfStock) {
      result = result.filter(p => p.stock > 0);
    }

    // 5. Sort Bar Processing
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [activeCategory, selectedPolish, maxPrice, hideOutOfStock, sortBy, allProducts]);

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 space-y-8">

      <button 
      onClick={onBack}
      className="group flex items-center gap-2 text-xs tracking-widest uppercase font-sans font-light text-stone-500 hover:text-stone-950 transition-colors"
    >
      ← Return to Maison Atelier
    </button>
      
      {/* Horizontal Top Row Summary Bar */}
      <div className="flex justify-between items-end border-b border-stone-200/60 pb-5">
        <div>
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Atelier Curations</p>
          <h2 className="font-serif text-2xl uppercase tracking-widest text-stone-900 font-light mt-1">The Collection Registry</h2>
        </div>
        
        {/* Isolated Sort Controller */}
        <div className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 rounded-xs text-xs font-sans">
          <SlidersHorizontal size={11} className="text-stone-400" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none outline-none text-stone-700  p-0"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Structural Screen Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ==========================================
    LEFT SIDEBAR FILTER DROPDOWNS
    ========================================== */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-32 bg-white p-5 border border-stone-200/50 rounded-sm select-none">
  
  {/* TOP LEVEL ACTION ROW: Header & Global Reset */}
  <div className="flex justify-between items-center border-b border-stone-100 pb-4">
    <h3 className="text-xs font-sans font-medium uppercase tracking-wider text-stone-900">Refine Matrix</h3>
    <button 
      onClick={() => {
        setActiveCategory('All');
        setSelectedPolish('All');
        setMaxPrice(3000);
        setHideOutOfStock(false);
        setSortBy('featured');
      }}
      className="text-[10px] uppercase tracking-widest font-sans font-light text-amber-700/90 hover:text-stone-950 underline  transition-colors"
    >
      Reset All
    </button>
  </div>

  {/* 1. COLLAPSIBLE JEWELLERY TYPES DROPDOWN */}
  <div className="space-y-2 overflow-hidden">
    <button 
      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
      className="w-full flex justify-between items-center py-1 text-left focus:outline-none group "
    >
      <h4 className="text-[10px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Jewellery Types</h4>
      <motion.span 
        animate={{ rotate: isCategoryDropdownOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="text-stone-400 text-[9px] inline-block origin-center"
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
          className="overflow-hidden"
        >
          <div className="flex flex-col space-y-1 pl-1 pt-1 pb-2 max-h-48 overflow-y-auto custom-scrollbar">
            {['All', 'Rings', 'Necklaces', 'Bangles', 'Earrings', 'Chokers', 'Anklets'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-left text-xs py-1.5 px-2 rounded-xs font-sans tracking-wide transition-colors  ${
                  activeCategory === cat 
                    ? 'bg-stone-950 text-white font-medium' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-950'
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

  {/* 2. COLLAPSIBLE POLISH FINISH DROPDOWN */}
  <div className="space-y-2 border-t border-stone-100 pt-4 overflow-hidden">
    <button 
      onClick={() => setIsPolishDropdownOpen(!isPolishDropdownOpen)}
      className="w-full flex justify-between items-center py-1 text-left focus:outline-none group "
    >
      <h4 className="text-[10px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Polish Finish</h4>
      <motion.span 
        animate={{ rotate: isPolishDropdownOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="text-stone-400 text-[9px] inline-block origin-center"
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
          className="overflow-hidden"
        >
          <div className="flex flex-col space-y-1 pl-1 pt-1 pb-2">
            {['All', 'Gold', 'Silver', 'Rose Gold', 'Copper', 'Oxidised'].map((polish) => (
              <button
                key={polish}
                onClick={() => setSelectedPolish(polish)}
                className={`text-left text-xs py-1.5 px-2 rounded-xs font-sans transition-colors  ${
                  selectedPolish === polish 
                    ? 'bg-stone-950 text-white font-medium' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-950'
                }`}
              >
                {polish} Tone
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 3. COLLAPSIBLE PRICE SLIDER DROPDOWN */}
  <div className="space-y-2 border-t border-stone-100 pt-4 overflow-hidden">
    <button 
      onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
      className="w-full flex justify-between items-center py-1 text-left focus:outline-none group "
    >
      <h4 className="text-[10px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Price Range</h4>
      <motion.span 
        animate={{ rotate: isPriceDropdownOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="text-stone-400 text-[9px] inline-block origin-center"
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
          <div className="space-y-3 pl-1 pt-2 pb-2">
            <div className="flex justify-between items-baseline font-sans text-xs text-stone-600">
              <span>Max Ceiling:</span>
              <span className="font-medium text-stone-950">${maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="3000" 
              step="25"
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-stone-950 h-1 bg-stone-100 rounded-lg "
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* 4. REAL-TIME AVAILABILITY FLAG */}
  <div className="border-t border-stone-100 pt-4">
    <label className="flex items-center gap-2.5 cursor-pointer select-none group text-xs font-sans text-stone-600 hover:text-stone-950">
      <div className="relative w-4 h-4 border border-stone-300 rounded-xs bg-white flex items-center justify-center group-hover:border-stone-400 transition-colors">
        <input 
          type="checkbox" 
          checked={hideOutOfStock}
          onChange={(e) => setHideOutOfStock(e.target.checked)}
          className="sr-only"
        />
        {hideOutOfStock && <span className="text-[10px] font-bold text-stone-950">✓</span>}
      </div>
      Hide Vault Out-of-Stock
    </label>
  </div>
</aside>

        {/* ==========================================
            RIGHT CONTENT DISPLAY GRID
            ========================================== */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="py-32 text-center text-xs tracking-widest text-stone-400 uppercase font-sans animate-pulse">
              Syncing active vault ledgers...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => onSelectProduct(product)}
                  className="group cursor-pointer bg-white p-3 border border-stone-200/20 hover:border-stone-200/80 shadow-xs transition-all duration-300 rounded-sm"
                >
                  <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-3 relative">
                    <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500" />
                    {product.stock === 0 && (
                      <span className="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-xs text-white text-[8px] font-sans uppercase tracking-widest px-2 py-0.5">
                        Awaiting Casting
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
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-2 border border-dashed border-stone-200 bg-stone-50/50 rounded-sm">
              <p className="font-serif text-sm text-stone-400 italic">No inventory allocations match your active configuration state.</p>
              <button 
                onClick={() => { setActiveCategory('All'); setSelectedPolish('All'); setMaxPrice(3000); setHideOutOfStock(false); }}
                className="text-[10px] uppercase font-sans tracking-widest text-[#c5a880] underline pt-2 block mx-auto "
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}