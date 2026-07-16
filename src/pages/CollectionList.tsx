import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, SlidersHorizontal, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface CollectionListProps {
  initialCategory: string;
  navigateToView: (
    targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details" | "wishlist" | "about" | "contact" | "faq" | "privacy-policy" | "terms-of-service" | "return-and-refund" | "shipping-delivery" | "cancellation-refund", 
    targetCategory?: string, 
    targetProduct?: any
  ) => void;
}

export default function CollectionList({ initialCategory, navigateToView }: CollectionListProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [selectedPolish, setSelectedPolish] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>(() => {
    const savedSort = sessionStorage.getItem('collection_initial_sort');  
    if (savedSort) {
      sessionStorage.removeItem('collection_initial_sort');
      return savedSort;
    }  
    return 'featured';
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPolishDropdownOpen, setIsPolishDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .range(0, 200)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllProducts(data as Product[]);
        setFilteredProducts(data as Product[]);
      } else if (error) {
        setFetchError('Unable to load the collection. Please try again.');
      }
    } catch (err) {
      console.error('Error connecting matrix keys:', err);
      setFetchError('Unable to load the collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobileFilterOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination index whenever any filter value alterations are performed
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeCategory, selectedPolish, maxPrice, hideOutOfStock, sortBy]);

  // Dynamic Categories Extraction
  const dynamicCategories = useMemo(() => {
    const categories = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return ['All', ...Array.from(categories)];
  }, [allProducts]);

  // Dynamic Polishes Extraction
  const dynamicPolishes = useMemo(() => {
    const polishes = new Set<string>();
    allProducts.forEach(p => {
      if (p.polish) polishes.add(p.polish);
    });
    return ['All', ...Array.from(polishes)];
  }, [allProducts]);

  const handleMaxPriceChange = (value: number) => {
    const clamped = Math.min(10000, Math.max(100, Number.isNaN(value) ? 100 : value));
    setMaxPrice(clamped);
  };

  // Multi-Tier Filter and Sorting Layout Computation Engine
  useEffect(() => {
    let result = [...allProducts];

    if (debouncedSearch.trim() !== '') {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (selectedPolish !== 'All') {
      result = result.filter(p => p.polish?.toLowerCase() === selectedPolish.toLowerCase());
    }

    result = result.filter(p => {
      const finalPrice = p.discount_rate && p.discount_rate > 0 ? p.price * (1 - p.discount_rate / 100) : p.price;
      return finalPrice <= maxPrice;
    });

    if (hideOutOfStock) {
      result = result.filter(p => {
        if (!p.size_stock) return false;
        const combinedTotalStock = Object.values(p.size_stock).reduce((a, b) => a + b, 0);
        return combinedTotalStock > 0;
      });
    }

    if (sortBy === 'featured') {
      const featuredProductsList = result.filter(p => p.is_featured === true);
      const regularProductsList = result.filter(p => !p.is_featured);
      result = [...featuredProductsList, ...regularProductsList];
    } else if (sortBy === 'new') {
      const newProductsList = result.filter(p => p.is_new === true);
      const regularProductsList = result.filter(p => !p.is_new);
      result = [...newProductsList, ...regularProductsList];
    } else if (sortBy === 'most_selling') {
      const mostSellingProductsList = result.filter(p => p.is_most_selling === true);
      const regularProductsList = result.filter(p => !p.is_most_selling);
      result = [...mostSellingProductsList, ...regularProductsList];
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => {
        const pA = a.discount_rate && a.discount_rate > 0 ? a.price * (1 - a.discount_rate / 100) : a.price;
        const pB = b.discount_rate && b.discount_rate > 0 ? b.price * (1 - b.discount_rate / 100) : b.price;
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => {
        const pA = a.discount_rate && a.discount_rate > 0 ? a.price * (1 - a.discount_rate / 100) : a.price;
        const pB = b.discount_rate && b.discount_rate > 0 ? b.price * (1 - b.discount_rate / 100) : b.price;
        return pB - pA;
      });
    }

    setFilteredProducts(result);
  }, [debouncedSearch, activeCategory, selectedPolish, maxPrice, hideOutOfStock, sortBy, allProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 space-y-6 select-none">
      <div>
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-stone-400">Vault Curations</p>
          <h2 className="font-serif text-2xl uppercase tracking-widest text-stone-900 font-light mt-1">The Collection Registry</h2>
      </div>
      
      <div className="flex flex-col gap-6 items-start sm:flex-row justify-between sm:items-end border-b border-stone-200/60 pb-5 pt-2">
        {/* SEARCH INPUT BAR */}
        <div className="w-full sm:flex-1 bg-white border border-stone-200 rounded-xs flex items-center px-3 py-2 shadow-2xs focus-within:border-stone-950 transition-colors">
          <Search size={16} className="text-stone-400 mr-3 shrink-0" />
          <input 
            type="text"
            placeholder="Search collection catalog by name..."
            aria-label="Search collection catalog by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-sans outline-none text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[10px] text-stone-400 hover:text-stone-900 uppercase tracking-wider pl-2 font-sans cursor-pointer">
              Clear
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 rounded-xs text-xs font-sans shadow-2xs">
          <SlidersHorizontal size={11} className="text-stone-400" />
          <select value={sortBy} aria-label="Sort products" onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none outline-none text-stone-700 p-0 cursor-pointer">
            <option value="featured">Sort: Featured</option>
            <option value="new">Sort: New Arrival</option>
            <option value="most_selling">Sort: Most Selling</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
      {/*  MOBILE TOGGLE TRIGGER  */}
      <div className="lg:hidden w-full mb-4">
        <button 
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200 p-4 rounded-xs text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-stone-900 active:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal size={13} className="text-stone-500" />
          Filter Options
        </button>
      </div>

      {/* SIDEBAR FILTER PANEL */}
      {isMobileFilterOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setIsMobileFilterOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`
        /* Desktop Sticky Layout Configuration */
        lg:col-span-4 xl:col-span-3 lg:sticky lg:top-32 lg:block space-y-3 bg-stone-50/60 backdrop-blur-md p-6 border border-stone-200/50 rounded-sm shadow-xs
        
        /* Responsive Mobile Drawer Morphing System */
        ${isMobileFilterOpen ? 'fixed inset-0 z-50 bg-[#ffffffe8] block overflow-y-auto p-8 overscroll-contain' : 'hidden'}
      `}
        role={isMobileFilterOpen ? 'dialog' : undefined}
        aria-modal={isMobileFilterOpen ? 'true' : undefined}
        araia-label={isMobileFilterOpen ? 'Filter Options' : undefined}
      >
        
        <div className="flex justify-between items-center border-b border-stone-200/80 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-stone-900 max-lg:block hidden" />
            <h3 className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-stone-900">Filter Options</h3>
          </div>
          
          <button 
            onClick={() => setIsMobileFilterOpen(false)}
            className="lg:hidden text-stone-600 hover:text-stone-950 p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

          {/* CATEGORIES DRAWER */}
          <div className="border-b border-stone-200/40 pb-3">
            <button aria-expanded={isCategoryDropdownOpen} aria-controls="cat-panel" onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsPolishDropdownOpen(false); }} className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group cursor-pointer">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Jewellery Type</span>
                <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">{activeCategory}</span>
              </div>
              <motion.span animate={{ rotate: isCategoryDropdownOpen ? 180 : 0, color: isCategoryDropdownOpen ? '#c5a880' : '#a8a29e' }} transition={{ duration: 0.4 }} className="text-[9px] origin-center px-1">▼</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isCategoryDropdownOpen && (
                <motion.div id="cat-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/60 border border-stone-200/40 mt-1 rounded-xs">
                  <div className="flex flex-col space-y-0.5 p-1.5 max-h-48 overflow-y-auto">
                    {dynamicCategories.map((cat) => (
                      <button key={cat} onClick={() => { setActiveCategory(cat); setIsCategoryDropdownOpen(false); }} className={`text-left text-xs py-2 px-3 rounded-xs font-sans tracking-wide cursor-pointer transition-all ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'bg-stone-950 text-white font-medium pl-4' : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-950'}`}>{cat}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* POLISH FINISH DRAWER */}
          <div className="border-b border-stone-200/40 pb-3">
            <button aria-expanded={isPolishDropdownOpen} aria-controls="polish-panel" onClick={() => { setIsPolishDropdownOpen(!isPolishDropdownOpen); setIsCategoryDropdownOpen(false); }} className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group cursor-pointer">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Polish Finish</span>
                <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">{selectedPolish === 'All' ? 'All Tones' : `${selectedPolish} Tone`}</span>
              </div>
              <motion.span animate={{ rotate: isPolishDropdownOpen ? 180 : 0, color: isPolishDropdownOpen ? '#c5a880' : '#a8a29e' }} transition={{ duration: 0.4 }} className="text-[9px] origin-center px-1">▼</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isPolishDropdownOpen && (
                <motion.div id="polish-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/60 border border-stone-200/40 mt-1 rounded-xs">
                  <div className="flex flex-col space-y-0.5 p-1.5">
                    {dynamicPolishes.map((polish) => (
                      <button key={polish} onClick={() => { setSelectedPolish(polish); setIsPolishDropdownOpen(false); }} className={`text-left text-xs py-2 px-3 rounded-xs font-sans tracking-wide cursor-pointer transition-all ${selectedPolish.toLowerCase() === polish.toLowerCase() ? 'bg-stone-950 text-white font-medium pl-4' : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-950'}`}>{polish === 'All' ? 'All Tones' : `${polish}`}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PRICE SLIDER PANEL */}
          <div className="border-b border-stone-200/40 pb-4">
            <button aria-expanded={isPriceDropdownOpen} aria-controls="price-panel" onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)} className="w-full flex justify-between items-center py-2.5 text-left focus:outline-none group cursor-pointer">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-medium group-hover:text-stone-950 transition-colors">Price Range</span>
                <span className="text-[11px] font-sans uppercase text-stone-900 tracking-wider">₹{maxPrice} Max Range</span>
              </div>
              <motion.span animate={{ rotate: isPriceDropdownOpen ? 180 : 0, color: isPriceDropdownOpen ? '#c5a880' : '#a8a29e' }} transition={{ duration: 0.4 }} className="text-[9px] origin-center px-1">▼</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isPriceDropdownOpen && (
                <motion.div id="price-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-3 px-1 pt-2 pb-1">
                    <input type="range" min="100" max="10000" step="25" value={maxPrice} onChange={(e) => handleMaxPriceChange(Number(e.target.value))} className="w-full accent-stone-950 h-0.75 bg-stone-200 rounded-lg cursor-pointer appearance-none" />
                    <input
                      type="number" min={100} max={10000} step={25}
                      value={maxPrice}
                      onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                      className="w-full border border-stone-200 rounded-xs px-2 py-1 text-xs font-sans text-stone-800 outline-none focus:border-stone-950"
                      aria-label="Enter maximum price"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AVAILABILITY TOGGLE */}
          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer group text-[11px] font-sans tracking-wide text-stone-600 hover:text-stone-950 transition-colors">
              <span>Hide Vault Out-of-Stock</span>
              <div className="relative w-7 h-4 bg-stone-200 rounded-full p-0.5 flex items-center">
                <input aria-label="Hide out-of-stock items" type="checkbox" checked={hideOutOfStock} onChange={(e) => setHideOutOfStock(e.target.checked)} className="sr-only" />
                <motion.div animate={{ x: hideOutOfStock ? 12 : 0 }} className={`w-3 h-3 rounded-full shadow-xs ${hideOutOfStock ? 'bg-stone-950' : 'bg-white'}`} />
              </div>
            </label>
          </div>

          {/* RESET ALL ACTION BUTTON */}
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setSelectedPolish('All');
                setMaxPrice(10000);
                setHideOutOfStock(false);
                setSortBy('featured');
              }}
              className="w-full text-center py-3 text-[10px] uppercase tracking-[0.25em] font-sans font-light text-stone-500 bg-stone-100 hover:bg-stone-200/60 hover:text-amber-900 transition-all duration-300 cursor-pointer rounded-xs"
            >
              Reset All Modifiers
            </button>

            {/* Mobile view-only Confirmation baseline hook */}
            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="lg:hidden w-full text-center py-3 text-[10px] uppercase tracking-[0.25em] font-sans font-medium text-white bg-stone-950 rounded-xs"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* PRODUCTS REGISTRY GRID */}
        <div className="xl:col-span-9 lg:col-span-8">
          {loading ? (
            <div className="py-32 text-center text-xs tracking-widest text-stone-400 uppercase font-sans animate-pulse">
              Syncing active vault ledgers...
            </div>
          ) : fetchError ? (
            <div className="py-24 text-center space-y-3 border border-dashed border-rose-200 bg-rose-50/50 rounded-sm">
              <p className="font-serif text-sm text-rose-600 italic">{fetchError}</p>
              <button
                onClick={() => loadCatalog()}
                className="text-[10px] uppercase font-sans tracking-widest text-[#c5a880] underline pt-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => {
                const hasDiscount = product.discount_rate && product.discount_rate > 0;
                const finalPrice = hasDiscount ? product.price * (1 - (product.discount_rate || 0) / 100) : product.price;

                return (
                  <div key={product.id} 
                    role="button" tabIndex={0}
                    aria-label={`View details for ${product.name}`}
                    onClick={() => navigateToView('product-details', product.category, product)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' || e.key === ' ') { 
                        e.preventDefault();
                        navigateToView('product-details', product.category, product); 
                      } 
                    }}
                    className="group cursor-pointer bg-white p-3 border border-stone-200/20 hover:border-stone-200/80 shadow-xs transition-all duration-300 rounded-sm relative">
                    
                    <div className="absolute top-5 left-5 z-10 flex flex-col gap-1 pointer-events-none">
                      {product.is_featured && sortBy === 'featured' && (
                        <span className="bg-amber-800 text-white text-[8px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-xs shadow-md">
                          FEATURED
                        </span>
                      )}
                      {product.is_new && sortBy === 'new' && (
                        <span className="bg-stone-950 text-white text-[8px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-xs shadow-md">
                          NEW
                        </span>
                      )}
                      {product.is_most_selling && sortBy === 'most_selling' && (
                        <span className="bg-[#c5a880] text-white text-[8px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-xs shadow-md">
                          MOST SELLING
                        </span>
                      )}
                    </div>

                    <div className="aspect-square w-full overflow-hidden bg-stone-50 mb-3 relative">
                      <img src={product.main_image} alt={product.name} loading="lazy" decoding="async" 
                      onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} 
                      className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500" />
                    </div>

                    <div className="space-y-1 px-0.5">
                      <span className="text-[9px] tracking-widest font-sans uppercase text-stone-400">{product.category}</span>
                      <h4 className="font-serif text-sm text-stone-900 group-hover:text-[#c5a880] truncate font-light tracking-wide">{product.name}</h4>
                      <div className="pt-2 flex justify-between items-center text-xs font-sans border-t border-stone-100 mt-2">
                        
                        {/* PRICING AND DISCOUNT SYSTEM DISPLAY */}
                        <div className="flex items-center gap-1.5">
                          {hasDiscount ? (
                            <>
                              <span className="text-stone-950 font-medium">₹{Math.round(finalPrice).toLocaleString()}</span>
                              <span className="text-[10px] text-stone-400 line-through">₹{product.price.toLocaleString()}</span>
                              <span className="text-[9px] text-emerald-700 font-medium bg-emerald-50 px-1 rounded-3xs">
                                (-{product.discount_rate}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-stone-950 font-medium">₹{product.price.toLocaleString()}</span>
                          )}
                        </div>

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
              <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); setSelectedPolish('All'); setMaxPrice(10000); setHideOutOfStock(false); }} className="text-[10px] uppercase font-sans tracking-widest text-[#c5a880] underline pt-2 block mx-auto cursor-pointer">
                Reset Filters
              </button>
            </div>
          )}

          {/* FOOTER PAGINATION SYSTEM BAR */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 pt-12 border-t border-stone-200 select-none mt-12">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-950 disabled:opacity-20 disabled:hover:text-stone-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                ← Previous Page
              </button>
              
              <span className="font-serif text-xs tracking-wide text-stone-400">
                Page <span className="text-stone-900 font-medium">{currentPage}</span> of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-950 disabled:opacity-20 disabled:hover:text-stone-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                Next Page →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}