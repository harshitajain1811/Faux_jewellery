import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Edit3, Search, Star, Sparkles, CheckCircle2, Box, Upload, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  main_image: string;
  sub_images?: string[];
  category: string;
  polish?: string;
  is_featured: boolean;
  is_most_selling: boolean;
  is_new: boolean;
  discount_rate: number;
  size_stock?: Record<string, number>;
}

interface AdminDashboardProps {
  navigateToView: (
    targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details", 
    targetCategory?: string, targetProduct?: any, replace?: boolean) => void;
}

export default function AdminDashboard({ navigateToView }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'atelier' | 'orders'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderDaysFilter, setOrderDaysFilter] = useState('ALL');
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const ordersPerPage = 10;

// Fetch function to load order logs directly from Supabase
const fetchOrders = async () => {
  setOrdersLoading(true);
  try {
    const { data, error } = await supabase
      .from('orders') 
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    } else if (error) {
      console.error("Error pulling history logs:", error.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setOrdersLoading(false);
  }
};

// Synchronize database loads when shifting tabs
useEffect(() => {
  if (activeTab === 'orders') {
    fetchOrders();
    setOrdersCurrentPage(1);
  }
}, [activeTab]);

  // Core Options Cache
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>(['Rings', 'Necklaces', 'Earrings', 'Bracelets']);
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);

  const dynamicPolishes = useMemo(() => {
    const set = new Set<string>(['Gold', 'Silver', 'Rose Gold']);
    products.forEach(p => { if (p.polish) set.add(p.polish); });
    return Array.from(set);
  }, [products]);

  // Combined Form Memory Matrix
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Rings',
    newCategory: '',
    polish: 'Gold',
    newPolish: '',
    is_featured: false,
    is_most_selling: false,
    is_new: false,
    discount_rate: '0'
  });

  // Comprehensive Multi-Image Workspace state
  // We combine existing URLs and newly chosen Files into a single uniform preview array
  interface ImageItem {
    id: string;
    url: string;
    file: File | null;
  }
  const [imageWorkspace, setImageWorkspace] = useState<ImageItem[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);

  const [sizeVariants, setSizeVariants] = useState<{ size: string; quantity: number }[]>([]);
  const [hasSizes, setHasSizes] = useState<boolean>(true);
  const [noSizeQuantity, setNoSizeQuantity] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
  };

  // Process incoming raw file listings
  const processIncomingFiles = (files: File[]) => {
    const spaceLeft = 4 - imageWorkspace.length;
    if (spaceLeft <= 0) return;
    
    const validFiles = files.slice(0, spaceLeft);
    const mapped: ImageItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file: file
    }));

    setImageWorkspace(prev => {
      const updated = [...prev, ...mapped];
      if (!primaryImageId && updated.length > 0) setPrimaryImageId(updated[0].id);
      return updated;
    });
  };

  // --- Drag and Drop Receivers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleEditInitiate = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      newCategory: '',
      polish: product.polish || 'Gold',
      newPolish: '',
      is_featured: product.is_featured,
      is_most_selling: product.is_most_selling,
      is_new: product.is_new || false,
      discount_rate: product.discount_rate.toString()
    });

    const initialWorkspace: ImageItem[] = [];
    if (product.main_image) {
      initialWorkspace.push({ id: 'main-edit', url: product.main_image, file: null });
    }
    if (product.sub_images && product.sub_images.length > 0) {
      product.sub_images.forEach((img, idx) => {
        initialWorkspace.push({ id: `sub-edit-${idx}`, url: img, file: null });
      });
    }

    setImageWorkspace(initialWorkspace);
    if (initialWorkspace.length > 0) setPrimaryImageId(initialWorkspace[0].id);

    if (product.size_stock && Object.keys(product.size_stock).length > 0) {
      if (Object.keys(product.size_stock).includes('Universal Size')) {
        setHasSizes(false);
        setNoSizeQuantity(product.size_stock['Universal Size'] || 0);
      } else {
        setHasSizes(true);
        setSizeVariants(Object.entries(product.size_stock).map(([size, quantity]) => ({ size, quantity })));
      }
    } else {
      setHasSizes(false);
      setNoSizeQuantity(0);
    }
    setActiveTab('atelier');
  };

  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  // 1. Core Validation: Ensure at least one image exists in the workspace layout
  if (imageWorkspace.length === 0) {
    alert("Media Missing: Please drop or upload at least one image asset to serve as the product centerpiece.");
    return;
  }
  
  setIsSubmitting(true);
  setStatusMessage("Initiating upload transaction pipeline...");

  try {
    const absoluteCategory = productForm.category === 'ADD_NEW' ? productForm.newCategory : productForm.category;
    const absolutePolish = productForm.polish === 'ADD_NEW' ? productForm.newPolish : productForm.polish;

    // 2. Identify the active primary image item, positioning it first in line
    const sortedWorkspace = [...imageWorkspace].sort((a, b) => {
      if (a.id === primaryImageId) return -1;
      if (b.id === primaryImageId) return 1;
      return 0;
    });

    // 3. Process image assets (Preserve URLs or upload fresh File payloads)
    const totalUploadedUrls: string[] = [];
    for (const item of sortedWorkspace) {
      if (item.file) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `vault-inventory/${fileName}`;

        // Attempting transmission block to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-assets')
          .upload(filePath, item.file);
          
        if (uploadError) {
          throw new Error(`Storage Upload Failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('product-assets').getPublicUrl(filePath);
        if (data?.publicUrl) totalUploadedUrls.push(data.publicUrl);
      } else {
        // Carry forward pre-existing static URLs safely if editing
        totalUploadedUrls.push(item.url);
      }
    }

    const primaryMainImage = totalUploadedUrls[0] || '';
    const supportingSubImages = totalUploadedUrls.slice(1);

    // 4. Transform sizing matrix structure fields
    const finalStockMap: Record<string, number> = {};
    if (hasSizes) {
      sizeVariants.forEach(v => { 
        if (v.size.trim()) finalStockMap[v.size.trim()] = v.quantity; 
      });
    } else {
      finalStockMap['Universal Size'] = noSizeQuantity;
    }

    // 5. Structure payload fields explicitly
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price) || 0,
      category: absoluteCategory || 'Uncategorized',
      polish: absolutePolish || 'Standard',
      main_image: primaryMainImage,
      sub_images: supportingSubImages,
      is_featured: productForm.is_featured,
      is_most_selling: productForm.is_most_selling,
      is_new: productForm.is_new,
      discount_rate: parseInt(productForm.discount_rate) || 0,
      size_stock: finalStockMap
    };

    console.log("Transmitting payload bundle to Supabase database:", payload);

    // 6. Select operational query track (Insert vs Overwrite)
    if (editingProductId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
      if (error) throw error;
      setStatusMessage("Maison catalog modifications committed successfully!");
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) throw error;
      setStatusMessage("Masterpiece registered to live database registry!");
    }

    // Reset interface variables smoothly on completion
    setTimeout(() => {
      resetDashboardWorkflow();
    }, 1500);

  } catch (err: any) {
    console.error("Critical Admin Dashboard Form Exception Context:", err);
    setStatusMessage(`Database Submission Error: ${err.message || err}`);
    alert(`Submission Failed: ${err.message || 'Check browser inspector for details.'}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const resetDashboardWorkflow = () => {
    setEditingProductId(null);
    setProductForm({ name: '', description: '', price: '', category: 'Rings', newCategory: '', polish: 'Gold', newPolish: '', is_featured: false, is_most_selling: false, is_new: false, discount_rate: '0' });
    setImageWorkspace([]);
    setPrimaryImageId(null);
    setSizeVariants([]);
    setHasSizes(true);
    fetchProducts();
    setActiveTab('ledger');
  };

  const currentPrimaryPreviewUrl = useMemo(() => {
    const found = imageWorkspace.find(i => i.id === primaryImageId);
    return found ? found.url : imageWorkspace[0]?.url || '';
  }, [imageWorkspace, primaryImageId]);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || p.category === selectedTypeFilter;
    return matchesSearch && matchesType;
  });
  // 1. Calculate matching subset parameters
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleLogout = async () => {
  const confirmSignOut = confirm("Are you sure you want to log out of the Maison Management Portal?");
  if (!confirmSignOut) return;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear operational local window parameters and escape back to login screen view
    navigateToView('auth', 'All', null, true);
  } catch (err: any) {
    alert(`Logout Failed: ${err.message || err}`);
  }
};

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 font-sans selection:bg-stone-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-stone-200 pb-6 mb-8 gap-4 select-none">
        <div>
          <span className="text-[9px] tracking-[0.3em] text-[#c5a880] uppercase font-medium">Aura Operations Control</span>
          <h2 className="font-serif text-3xl uppercase tracking-wider text-stone-900 font-light mt-1">Management Registry</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-5 items-center">
          {/* Screen Workspace Tab Selection Toggles */}
          <div className="bg-stone-100 p-1 flex gap-1 rounded-xs text-[10px] tracking-widest uppercase font-medium">
            <button 
              type="button"
              onClick={() => { setActiveTab('orders'); setEditingProductId(null); }} 
              className={`px-4 py-2 rounded-2xs transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Orders Table
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('ledger'); setEditingProductId(null); }} 
              className={`px-4 py-2 rounded-2xs transition-all cursor-pointer ${activeTab === 'ledger' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Ledger Table
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('atelier')} 
              className={`px-4 py-2 rounded-2xs transition-all cursor-pointer ${activeTab === 'atelier' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-400 hover:text-stone-700'}`}
            >
              {editingProductId ? "Modify Blueprint" : "Creation Atelier"}
            </button>
          </div>

          {/* Separator Pipe */}
          <span className="h-4 w-px bg-stone-300 hidden sm:block" />

          {/* Session Management Action Buttons */}
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleLogout} 
              className="text-xs uppercase tracking-widest text-red-600 font-medium hover:text-red-800 cursor-pointer border border-transparent hover:border-red-200 bg-red-50/0 hover:bg-red-50 px-2.5 py-1.5 rounded-2xs transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-3 bg-stone-900 text-white text-xs tracking-wide rounded-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={13} className="text-[#c5a880]" />
            <span>{statusMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setStatusMessage(null)} 
            className="text-stone-400 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ORDERS TAB VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* FILTER ENGINE CONTROLS BAR BOARD */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full select-none">
            
            {/* 1. Multi-Context Text Search Input field */}
            <div className="relative flex items-center flex-1 w-full">
              <Search size={14} className="absolute left-3.5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search by Order ID, Client Email, or Customer Name..." 
                value={orderSearchQuery} 
                onChange={(e) => { setOrderSearchQuery(e.target.value); setOrdersCurrentPage(1); }} 
                className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-2.5 text-xs rounded-xs outline-none focus:border-stone-950 focus:bg-white text-stone-900" 
              />
            </div>

            {/* 2. Order Status Selector Gate */}
            <div className="relative w-full md:w-44 shrink-0">
              <select
                value={orderStatusFilter}
                onChange={(e) => { setOrderStatusFilter(e.target.value); setOrdersCurrentPage(1); }}
                className="w-full bg-stone-50 border border-stone-200 pl-3 pr-8 py-2.5 text-xs rounded-xs outline-none focus:border-stone-950 focus:bg-white appearance-none cursor-pointer text-stone-800 font-medium tracking-wide"
              >
                <option value="ALL">All Status</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-400 text-[8px]">▼</div>
            </div>

            {/* 3. Relative Timeline History Range Selector */}
            <div className="relative w-full md:w-44 shrink-0">
              <select
                value={orderDaysFilter}
                onChange={(e) => { setOrderDaysFilter(e.target.value); setOrdersCurrentPage(1); }}
                className="w-full bg-stone-50 border border-stone-200 pl-3 pr-8 py-2.5 text-xs rounded-xs outline-none focus:border-stone-950 focus:bg-white appearance-none cursor-pointer text-stone-800 font-medium tracking-wide"
              >
                <option value="ALL">All Time</option>
                <option value="1">Past 24 Hours</option>
                <option value="7">Past Week</option>
                <option value="30">Past Month</option>
                <option value="90">Past 3 Months</option>
                <option value="180">Past 6 Months</option>
                <option value="365">Past Year</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-400 text-[8px]">▼</div>
            </div>

          </div>

          {/* DATA INTERPRETATION FILTER COMPUTATION LOGIC */}
          {(() => {
            // Filter out records based on structural selections
            const filteredOrders = orders.filter(ord => {
              // A. Match Search String Metrics
              const query = orderSearchQuery.toLowerCase().trim();
              const matchesSearch = query === '' || 
                ord.id.toLowerCase().includes(query) || 
                (ord.customer_email || '').toLowerCase().includes(query) ||
                (ord.customer_name || '').toLowerCase().includes(query);

              // B. Match Status Flag
              const matchesStatus = orderStatusFilter === 'ALL' || ord.status === orderStatusFilter;

              // C. Match Dynamic Relative Timeline Constraints
              let matchesTime = true;
              if (orderDaysFilter !== 'ALL') {
                const limitDays = parseInt(orderDaysFilter, 10);
                const orderDate = new Date(ord.created_at).getTime();
                const cutoffDate = Date.now() - (limitDays * 24 * 60 * 60 * 1000);
                matchesTime = orderDate >= cutoffDate;
              }

              return matchesSearch && matchesStatus && matchesTime;
            });

            // Pagination slice windows parameters
            const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
            const paginatedOrders = filteredOrders.slice(
              (ordersCurrentPage - 1) * ordersPerPage,
              ordersCurrentPage * ordersPerPage
            );

            if (ordersLoading) {
              return (
                <div className="flex flex-col items-center justify-center p-24 border border-stone-200/80 rounded-xs bg-white text-xs font-sans text-stone-400 gap-2">
                  <span className="animate-spin text-stone-700">⚙️</span>
                  <span>Parsing accounting order ledgers safely...</span>
                </div>
              );
            }

            return (
              <>
                <div className="w-full border overflow-x-auto border-stone-200/80 rounded-xs overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/70 border-b border-stone-200 text-[10px] tracking-wider uppercase text-stone-400 font-medium font-sans p-4">
                        <th className="p-4 w-32">Order Identifier</th>
                        <th className="p-4">Placement Date</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Items Summary</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Fulfillment Status</th>
                        <th className="p-4 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((ord) => {
                          const formattedDate = new Date(ord.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          });

                          // Parse order item strings dynamically depending on JSON / Array schema setup
                          const itemsList = Array.isArray(ord.items) ? ord.items : [];

                          return (
                            <tr key={ord.id} className="hover:bg-stone-50/20">
                              {/* ID */}
                              <td className="p-4 font-mono text-[11px] text-stone-500 uppercase tracking-tight select-all">
                                #{ord.id.substring(0, 8)}...
                              </td>
                              
                              {/* Placement Date */}
                              <td className="p-4 font-sans font-light text-stone-500">{formattedDate}</td>
                              
                              {/* Customer Info */}
                              <td className="p-4 space-y-0.5">
                                <div className="font-sans font-medium text-stone-900">{ord.user_details?.first_name} {ord.user_details?.last_name || 'Guest User'}</div>
                                <div className="text-[10px] text-stone-400 font-sans">{ord.user_email || 'No email log'}</div>
                              </td>
                              
                              {/* Items Breakdown summary count string representation */}
                              <td className="p-4 font-sans text-stone-600 max-w-xs">
                                {itemsList.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    {itemsList.map((i: any, idx: number) => {
                                      // Handle both flattened or deeply nested JSON/Relational structures safely
                                      const imgUrl = i.product?.main_image;
                                      const nameText = i.product?.name || 'Item';
                                      
                                      return (
                                        <div key={idx} className="flex items-center gap-2 group/item">
                                          {/* Thumbnail Box */}
                                          <div className="w-15 h-15 bg-stone-50 overflow-hidden shrink-0 border border-stone-200/60 rounded-2xs">
                                            {imgUrl ? (
                                              <img 
                                                src={imgUrl} 
                                                alt={nameText} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  // Fallback if image path fails to load properly
                                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Img';
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-stone-100 text-[8px] text-stone-400">
                                                N/A
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Text Specifications */}
                                          <div className="truncate text-[11px] leading-tight">
                                            <span className="font-medium text-stone-900">{nameText}</span>
                                            <span className="text-stone-400 font-light mx-1">({i.size || 'U'})</span>
                                            <span className="text-stone-500 font-mono text-[10px] bg-stone-100 px-1 rounded-2xs">x{i.quantity}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-stone-400 italic text-[11px]">No artifact items found</span>
                                )}
                              </td>
                              
                              {/* Valuation price total */}
                              <td className="p-4 font-sans font-semibold text-stone-900">
                                ₹{ord.total_paid?.toLocaleString('en-IN')}
                              </td>
                              
                              {/* Fulfillment Status Labels Matrix badge styling rendering options */}
                              <td className="p-4 font-sans">
                                <span className={`px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider ${
                                  ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/30' :
                                  ord.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                  ord.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                                  'bg-stone-100 text-stone-600'
                                }`}>
                                  {ord.status || 'pending'}
                                </span>
                              </td>
                              
                              {/* Status Mutation Ops Buttons triggers */}
                              <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  <select
                                    value={ord.status}
                                    onChange={async (e) => {
                                      const nextStatus = e.target.value.toLocaleLowerCase();
                                      if (confirm(`Transition status level profile configuration to ${nextStatus}?`)) {
                                        await supabase.from('orders').update({ status: nextStatus }).eq('id', ord.id);
                                        fetchOrders();
                                      }
                                    }}
                                    className="text-[10px] bg-stone-50 border border-stone-200 rounded-2xs p-1 outline-none text-stone-700 cursor-pointer focus:border-stone-400"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-stone-400 font-sans italic">
                            No customer ledger accounts matched active filter metrics blueprints.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls matrix panel board segment */}
                {totalOrdersPages > 1 && (
                  <div className="flex flex-col sm:flex-row gap-y-2.5 items-center justify-between border border-t-0 border-stone-200/80 bg-stone-50/50 px-4 py-3 rounded-b-xs select-none">
                    <div className="text-[11px] text-stone-500 font-sans">
                      Showing <span className="font-medium text-stone-900">{((ordersCurrentPage - 1) * ordersPerPage) + 1}</span> to{' '}
                      <span className="font-medium text-stone-900">
                        {Math.min(ordersCurrentPage * ordersPerPage, filteredOrders.length)}
                      </span>{' '}
                      of <span className="font-medium text-stone-900">{filteredOrders.length}</span> recorded orders
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={ordersCurrentPage === 1}
                        onClick={() => setOrdersCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 border border-stone-200 bg-white rounded-2xs text-[11px] font-medium tracking-wide text-stone-600 hover:text-stone-950 hover:border-stone-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        ← Previous
                      </button>
                      <div className="text-[11px] font-sans px-2 text-stone-400">
                        Page <span className="text-stone-950 font-medium">{ordersCurrentPage}</span> of {totalOrdersPages}
                      </div>
                      <button
                        type="button"
                        disabled={ordersCurrentPage === totalOrdersPages}
                        onClick={() => setOrdersCurrentPage(prev => Math.min(prev + 1, totalOrdersPages))}
                        className="px-3 py-1.5 border border-stone-200 bg-white rounded-2xs text-[11px] font-medium tracking-wide text-stone-600 hover:text-stone-950 hover:border-stone-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* LEDGER TAB VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-2xl select-none">
            
            <div className="relative flex items-center flex-1 w-full">
              <Search size={14} className="absolute left-3.5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search items by title context..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-2.5 text-xs rounded-xs outline-none focus:border-stone-950 focus:bg-white text-stone-900" 
              />
            </div>

            <div className="relative w-full md:w-44 shrink-0">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 pl-3 pr-8 py-2.5 text-xs rounded-xs outline-none focus:border-stone-950 focus:bg-white appearance-none cursor-pointer text-stone-800 font-medium tracking-wide"
              >
                <option value="ALL">All Categories</option>
                {dynamicCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {/* Clean, absolute positioned minimal chevron dropdown element indicator */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-400 text-[8px] tracking-tighter">
                ▼
              </div>
            </div>

          </div>

          <div className="w-full overflow-x-auto border border-stone-200/80 rounded-xs overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-[10px] tracking-wider uppercase text-stone-400 font-medium font-sans p-4">
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Polish</th>
                  <th className="p-4">Valuation</th>
                  <th className="p-4">Sizes Matrix</th>
                  <th className="p-4">Net Quantity</th>
                  <th className="p-4 text-right w-20">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {paginatedProducts.map((product) => {
                  const sizesArray = product.size_stock ? Object.keys(product.size_stock) : [];
                  const combinedTotalStock = product.size_stock ? Object.values(product.size_stock).reduce((a, b) => a + b, 0) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/20">
                      <td className="p-4">
                        <img src={product.main_image} className="w-10 h-10 object-cover bg-stone-50 border border-stone-200/60 rounded-2xs" />
                      </td>
                      <td className="p-4 font-serif font-light text-sm text-stone-900 tracking-wide">{product.name}</td>
                      <td className="p-4 font-sans font-light text-stone-500">{product.category}</td>
                      <td className="p-4 font-sans font-light text-stone-500">{product.polish || '—'}</td>
                      <td className="p-4 font-sans font-medium text-stone-900">
                        {product.discount_rate > 0 ? (
                          <div className="space-y-0.5">
                            <div className="text-stone-900 font-semibold">₹{(product.price * (1 - product.discount_rate / 100)).toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-red-600 line-through font-normal">₹{product.price.toLocaleString('en-IN')}</div>
                          </div>
                        ) : (
                          `₹${product.price.toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td className="p-4 font-sans max-w-xs truncate">
                        {sizesArray.includes('Universal Size') ? (
                          <span className="text-stone-400 italic">No sizing context (Universal)</span>
                        ) : (
                          <span className="font-medium text-stone-800">{sizesArray.join(', ') || '—'}</span>
                        )}
                      </td>
                      <td className="p-4 font-sans">
                        <span className={`px-2 py-0.5 rounded-2xs font-medium ${combinedTotalStock <= 0 ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-900'}`}>
                          {combinedTotalStock} units
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleEditInitiate(product)} className="text-stone-500 hover:text-stone-950 p-1 cursor-pointer"><Edit3 size={13} /></button>
                          <button onClick={async () => { if(confirm(`Delete product ${product.name} ?`)) { await supabase.from('products').delete().eq('id', product.id); fetchProducts(); } }} className="text-stone-300 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Display Box Container Ends Above... Now Pagination Controls: */}
    {totalPages > 1 && (
      <div className="flex flex-col sm:flex-row gap-y-2.5 items-center justify-between border border-t-0 border-stone-200/80 bg-stone-50/50 px-4 py-3 rounded-b-xs select-none">
        
        {/* Left Side: Summary Metrics */}
        <div className="text-[11px] text-stone-500 font-sans">
          Showing <span className="font-medium text-stone-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
          <span className="font-medium text-stone-900">
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
          </span>{' '}
          of <span className="font-medium text-stone-900">{filteredProducts.length}</span> luxury masterworks
        </div>

        {/* Right Side: Directional Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 border border-stone-200 bg-white rounded-2xs text-[11px] font-medium tracking-wide text-stone-600 hover:text-stone-950 hover:border-stone-400 disabled:opacity-40 disabled:hover:text-stone-600 disabled:hover:border-stone-200 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
          >
            ← Previous
          </button>
          
          <div className="text-[11px] font-sans px-2 text-stone-400">
            Page <span className="text-stone-950 font-medium">{currentPage}</span> of {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 border border-stone-200 bg-white rounded-2xs text-[11px] font-medium tracking-wide text-stone-600 hover:text-stone-950 hover:border-stone-400 disabled:opacity-40 disabled:hover:text-stone-600 disabled:hover:border-stone-200 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
          >
            Next →
          </button>
        </div>

      </div>
    )}
        </div>
      )}

      {/* CREATION ATELIER TAB VIEW */}
      {activeTab === 'atelier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in duration-200">
          
          {/* LEFT: MASTER ENTRY WORKFLOW FORM */}
          <form onSubmit={handleFormSubmit} className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-400 border-b border-stone-100 pb-2">01. Blueprint Core Context</h3>
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500">Masterpiece Model Signature Title</label>
                <input required type="text" name="name" value={productForm.name} onChange={(e) => setProductForm(p=>({...p, name: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs text-stone-800 rounded-xs outline-none focus:border-stone-950" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500">Extended Profile Description (8 Rows)</label>
                <textarea required rows={8} name="description" value={productForm.description} onChange={(e) => setProductForm(p=>({...p, description: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs text-stone-800 rounded-xs outline-none resize-none leading-relaxed focus:border-stone-950" placeholder="Narrate the full architectural story..." />
              </div>
            </div>

            {/* Ingestion Dropdown Sets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500">Valuation (₹ INR)</label>
                <input required type="number" name="price" value={productForm.price} onChange={(e) => setProductForm(p=>({...p, price: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs text-stone-800 rounded-xs outline-none focus:border-stone-950" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500">Jewellery Type Category</label>
                <select value={productForm.category} onChange={(e) => setProductForm(p=>({...p, category: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs text-stone-800 rounded-xs outline-none focus:border-stone-950">
                  {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="ADD_NEW">+ Create Custom Type...</option>
                </select>
                {productForm.category === 'ADD_NEW' && (
                  <input required type="text" placeholder="Specify Category Name" value={productForm.newCategory} onChange={(e) => setProductForm(p=>({...p, newCategory: e.target.value}))} className="w-full bg-white border border-stone-200 p-2 mt-1.5 text-xs rounded-xs outline-none text-stone-900 border-amber-600" />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-wider uppercase text-stone-500">Polish Tone Finish</label>
                <select value={productForm.polish} onChange={(e) => setProductForm(p=>({...p, polish: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs text-stone-800 rounded-xs outline-none focus:border-stone-950">
                  {dynamicPolishes.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="ADD_NEW">+ Create Custom Tone...</option>
                </select>
                {productForm.polish === 'ADD_NEW' && (
                  <input required type="text" placeholder="Specify Polish Name" value={productForm.newPolish} onChange={(e) => setProductForm(p=>({...p, newPolish: e.target.value}))} className="w-full bg-white border border-stone-200 p-2 mt-1.5 text-xs rounded-xs outline-none text-stone-900 border-amber-600" />
                )}
              </div>
            </div>

            {/* DRAG & DROP MULTI-IMAGE HANDLER MODULE */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-400">02. Media Assets (Max 4 • Click to make Main Image)</h3>
                <span className="text-[10px] font-sans text-stone-400">{imageWorkspace.length}/4 Slots Filled</span>
              </div>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-xs p-8 flex flex-col justify-center items-center gap-2 transition-all ${
                  isDragging ? 'border-amber-600 bg-amber-50/20 text-amber-950' : 'border-stone-200 bg-stone-50/40 text-stone-400 hover:border-stone-400'
                }`}
              >
                <Upload size={20} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-xs text-stone-800 font-medium font-sans">Drag and drop assets here, or <label className="text-amber-800 underline cursor-pointer hover:text-amber-950">browse local files<input type="file" multiple accept="image/*" className="sr-only" onChange={(e)=> { if(e.target.files) processIncomingFiles(Array.from(e.target.files)); }} /></label></p>
                  <p className="text-[10px] text-stone-400 mt-1">PNG, JPG, or WEBP. Max 4 total configurations.</p>
                </div>
              </div>

              {imageWorkspace.length > 0 && (
                <div className="grid grid-cols-4 gap-4 pt-2">
                  {imageWorkspace.map((item) => {
                    const isMain = item.id === primaryImageId;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setPrimaryImageId(item.id)}
                        className={`relative aspect-square border rounded-xs overflow-hidden group cursor-pointer transition-all ${
                          isMain ? 'border-stone-950 ring-2 ring-stone-950/20 scale-[1.02] shadow-sm' : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <img src={item.url} className="w-full h-full object-cover select-none" />
                        <div className={`absolute top-1.5 left-1.5 text-[7px] tracking-widest uppercase px-1.5 py-0.5 rounded-3xs font-sans font-medium transition-colors ${
                          isMain ? 'bg-stone-950 text-white' : 'bg-white/90 text-stone-500 backdrop-blur-3xs group-hover:bg-stone-950 group-hover:text-white'
                        }`}>
                          {isMain ? '★ Main' : 'Gallery'}
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageWorkspace(prev => {
                              const filtered = prev.filter(i => i.id !== item.id);
                              if (item.id === primaryImageId && filtered.length > 0) setPrimaryImageId(filtered[0].id);
                              return filtered;
                            });
                          }} 
                          className="absolute top-1 right-1 bg-white border border-stone-100 text-stone-500 rounded-full p-0.5 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* VOLUMETRIC INVENTORY SIZE SYSTEM */}
            <div className="space-y-4 bg-stone-50/60 p-5 border border-stone-200/60 rounded-xs">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-900 flex items-center gap-2"><Box size={14} /> 03. Dimensional Volumetric Allocation</h3>
                <div className="flex gap-4 text-xs font-sans">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-700"><input type="radio" checked={hasSizes === true} onChange={() => setHasSizes(true)} className="accent-stone-950" /> Sizing Matrix Array</label>
                  <label className="flex items-center gap-2 cursor-pointer text-stone-700"><input type="radio" checked={hasSizes === false} onChange={() => setHasSizes(false)} className="accent-stone-950" /> Universal / No Size</label>
                </div>
              </div>

              {hasSizes ? (
                <div className="space-y-3">
                  {sizeVariants.map((v, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <input required type="text" placeholder="e.g., US 7" value={v.size} onChange={(e) => { const copy = [...sizeVariants]; copy[i].size = e.target.value; setSizeVariants(copy); }} className="w-32 bg-white border border-stone-200 p-2 text-xs rounded-xs outline-none" />
                      <input required type="number" min="0" placeholder="Qty" value={v.quantity || ''} onChange={(e) => { const copy = [...sizeVariants]; copy[i].quantity = parseInt(e.target.value) || 0; setSizeVariants(copy); }} className="w-32 bg-white border border-stone-200 p-2 text-xs rounded-xs outline-none" />
                      <button type="button" onClick={() => setSizeVariants(prev => prev.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-700 p-1.5 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSizeVariants(prev => [...prev, { size: '', quantity: 1 }])} className="text-[10px] tracking-widest font-sans uppercase text-[#c5a880] hover:text-stone-950 font-medium flex items-center gap-1.5 pt-1 cursor-pointer">+ Append Dimensional Row Attribute</button>
                </div>
              ) : (
                <div className="space-y-1 max-w-xs">
                  <label className="text-[10px] tracking-wider uppercase text-stone-500">Universal Unit Capacity</label>
                  <input required type="number" min="0" value={noSizeQuantity} onChange={(e) => setNoSizeQuantity(parseInt(e.target.value) || 0)} className="w-full bg-white border border-stone-200 p-2 text-xs rounded-xs outline-none" />
                </div>
              )}
            </div>

            {/* DYNAMIC COMPOSITE PROMOTIONAL FLAG TOGGLES */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-400 border-b border-stone-100 pb-2">04. Visual Exhibition Allocations</h3>
              <div className="grid grid-cols-3 gap-4 select-none">
                
                {/* 1. SPARKLING EMERALD LIGHT THEME BADGE FOR NEW CURATIONS */}
                <div 
                  onClick={() => setProductForm(p=>({...p, is_new: !p.is_new}))} 
                  className={`p-4 border border-dashed rounded-xs cursor-pointer flex flex-col justify-between h-24 transition-all ${
                    productForm.is_new 
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-700/10' 
                      : 'border-stone-200 text-stone-400 hover:border-stone-400'
                  }`}
                >
                  <Sparkles size={16} className={productForm.is_new ? 'text-emerald-700' : ''} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-stone-900">New Curation</h4>
                    <p className="text-[9px] text-stone-400 mt-0.5">Applies an active 'New Arrival' metadata badge.</p>
                  </div>
                </div>

                {/* 2. GOLD BADGE FOR FEATURED BANNERS */}
                <div 
                  onClick={() => setProductForm(p=>({...p, is_featured: !p.is_featured}))} 
                  className={`p-4 border border-dashed rounded-xs cursor-pointer flex flex-col justify-between h-24 transition-all ${
                    productForm.is_featured 
                      ? 'border-[#c5a880] bg-[#c5a880]/5 text-stone-950 shadow-xs ring-1 ring-[#c5a880]/20' 
                      : 'border-stone-200 text-stone-400 hover:border-stone-400'
                  }`}
                >
                  <Plus size={16} className={productForm.is_featured ? 'text-[#c5a880]' : ''} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-stone-900">Featured Loop</h4>
                    <p className="text-[9px] text-stone-400 mt-0.5">Pushes asset onto the home showcase carousel.</p>
                  </div>
                </div>

                {/* 3. AMBER BADGE FOR BEST SELLERS */}
                <div 
                  onClick={() => setProductForm(p=>({...p, is_most_selling: !p.is_most_selling}))} 
                  className={`p-4 border border-dashed rounded-xs cursor-pointer flex flex-col justify-between h-24 transition-all ${
                    productForm.is_most_selling 
                      ? 'border-amber-600 bg-amber-50/40 text-stone-950 shadow-xs ring-1 ring-amber-600/10' 
                      : 'border-stone-200 text-stone-400 hover:border-stone-400'
                  }`}
                >
                  <Star size={16} className={productForm.is_most_selling ? 'text-amber-600' : ''} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-stone-900">Most Selling Grid</h4>
                    <p className="text-[9px] text-stone-400 mt-0.5">Prioritizes sorting order algorithm weightings.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Discount Inputs */}
            <div className="space-y-2 max-w-xs">
              <label className="text-[10px] tracking-wider uppercase text-stone-500">Active Campaign Discount (% Off)</label>
              <input type="number" min="0" max="100" value={productForm.discount_rate} onChange={(e) => setProductForm(p=>({...p, discount_rate: e.target.value}))} className="w-full bg-white border border-stone-200 p-2.5 text-xs rounded-xs outline-none focus:border-stone-950" />
            </div>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              {editingProductId && (
                <button type="button" onClick={resetDashboardWorkflow} className="px-6 bg-transparent text-stone-500 border border-stone-200 py-4 text-xs font-sans tracking-widest uppercase rounded-xs hover:text-stone-950 hover:bg-stone-50 transition-colors cursor-pointer">Cancel</button>
              )}
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-stone-950 text-white py-4 text-xs font-sans tracking-widest uppercase hover:bg-stone-800 transition-colors disabled:bg-stone-200 disabled:cursor-not-allowed rounded-xs cursor-pointer">
                {isSubmitting ? "Syncing Workspace Assets..." : editingProductId ? "Overwrite Live Asset File" : "Register Curated Product Design"}
              </button>
            </div>
          </form>

          {/* =====================================================================
             RIGHT: THE RETURNING PREVIEW MOCKUP CARD (STAYS STICKY ON SCROLL)
             ===================================================================== */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32 select-none animate-in fade-in duration-300">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-400 border-b border-stone-100 pb-2">Real-Time Interface Mockup</h3>
            <div className="border border-stone-200/80 p-6 bg-white space-y-4 shadow-sm rounded-xs">
              
              {/* Image Frame Holder */}
              <div className="aspect-square bg-stone-50 w-full flex items-center justify-center overflow-hidden border border-stone-100 rounded-2xs relative">
                {currentPrimaryPreviewUrl ? (
                  <img src={currentPrimaryPreviewUrl} alt="Live Preview" className="w-full h-full object-cover transition-all duration-300 animate-fade-in" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-stone-400">
                    <Upload size={16} strokeWidth={1.2} />
                    <span className="text-[9px] uppercase tracking-widest font-sans font-light">Awaiting Media Payload</span>
                  </div>
                )}

                {/* Composite Combination Badges Loop */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                  {productForm.is_new && (
                    <span className="bg-emerald-700 text-white text-[7px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-3xs shadow-xs flex items-center gap-0.5">
                      <Sparkles size={7} /> NEW
                    </span>
                  )}
                  {productForm.is_featured && (
                    <span className="bg-stone-950 text-white text-[7px] font-sans font-medium tracking-widest uppercase px-1.5 py-0.5 rounded-3xs shadow-xs">
                      FEATURED
                    </span>
                  )}
                  {productForm.is_most_selling && (
                    <span className="bg-[#c5a880] text-white text-[7px] font-sans font-medium tracking-widest uppercase px-1.5 py-0.5 rounded-3xs shadow-xs flex items-center gap-0.5">
                      <Star size={7} fill="currentColor" /> BEST SELLER
                    </span>
                  )}
                </div>
              </div>

              {/* Text Meta Container */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-[9px] tracking-widest text-stone-400 uppercase font-medium">
                  <span>{productForm.category === 'ADD_NEW' ? productForm.newCategory || 'Custom Category' : productForm.category}</span>
                </div>
                
                <h4 className="font-serif text-lg text-stone-900 font-light truncate tracking-wide">{productForm.name || "Untitled Masterpiece"}</h4>
                
                <div className="flex gap-2 items-baseline pt-0.5">
                  <span className="text-stone-950 font-sans font-semibold text-sm">
                    {parseInt(productForm.discount_rate) > 0 
                      ? `₹${(parseFloat(productForm.price || '0') * (1 - parseInt(productForm.discount_rate) / 100)).toLocaleString('en-IN')}`
                      : `₹${(parseFloat(productForm.price) || 0).toLocaleString('en-IN')}`
                    }
                  </span>
                  {parseInt(productForm.discount_rate) > 0 && (
                    <span className="text-[11px] text-red-600 font-light tracking-wide line-through font-sans">₹{(parseFloat(productForm.price) || 0).toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}