import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingBag, Loader2, Save, Trash2, TriangleAlertIcon } from 'lucide-react';

interface UserProfileProps {
  user: { id: string; email: string } | null;
  navigateToView: (targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details", targetCategory?: string, targetProduct?: any) => void;
}

interface NestedProductData {
  id: string;
  name: string;
  main_image: string;
  price: number;
  discount_rate?: number;
  category: string;
}

interface OrderItem {
  size: string;
  quantity: number;
  product?: NestedProductData;
}

interface Order {
  id: string;
  created_at: Date;
  items: OrderItem[];
  total_paid: number;
  delivery_date: Date;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'return_accepted';
}

export default function UserProfilePage({ user, navigateToView }: UserProfileProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPinCode] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [liveProductIds, setLiveProductIds] = useState<Set<string>>(new Set());

  const [confirmationModal, setConfirmationModal] = useState<{
      isOpen: boolean;
      orderId: string;
      type: 'cancel' | 'return' | 'delete' | null;
      title: string;
      message: string;
    }>({
      isOpen: false,
      orderId: '',
      type: null,
      title: '',
      message: ''
    });

  // Initialize profile and orders together once user context is ready
  useEffect(() => {
     if (!user?.id) {
      setLoadingData(false);
      navigateToView('auth', 'All', null);
    }
    loadProfileAndOrdersData();
  }, [user?.id]);

  const loadProfileAndOrdersData = async () => {
    if (!user?.id) return;
    setLoadingData(true);
  try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, shipping_address, city, pincode')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        await supabase.from('profiles').insert([{ id: user.id, first_name: '', last_name: '', phone_number: '', shipping_address: '', city: '', pincode: '' }]);
      } else if (profileData) {
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setPhone(profileData.phone_number || '');
        setAddress(profileData.shipping_address || '');
        setCity(profileData.city || '');
        setPinCode(profileData.pincode || '');
      
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, created_at, items, total_paid, status, delivery_date')
      .eq('user_id', user.id) 
      .gte('created_at', sixMonthsAgo.toISOString()) 
      .order('created_at', { ascending: false });

    if (orderError) throw orderError;
    if (orderData) setDbOrders(orderData as unknown as Order[]);

    const historyProductIds = Array.from(
      new Set(
        orderData.flatMap(order => 
          order.items?.map((item: any) => item.product?.id) || []
        )
      )
    ).filter(Boolean);

    if (historyProductIds.length > 0) {
      const { data: liveProducts } = await supabase
        .from('products')
        .select('id')
        .in('id', historyProductIds);

      if (liveProducts) {
        setLiveProductIds(new Set(liveProducts.map(p => p.id)));
      }
    }

  } catch (err) {
    console.error("Profile/orders loading error:", err);
  } finally {
     setLoadingData(false);
  }
};

  const handleSaveProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanPincode = pincode.trim();

    // Name validation
    if (cleanFirstName.length < 3 || cleanLastName.length < 3) {
      setValidationError("Your first and last names must contain at least 3 letters.");
      setIsSaving(false);
      return;
    }

    const alphabetRegex = /^[A-Za-z\s]+$/;
    if (!alphabetRegex.test(cleanFirstName) || !alphabetRegex.test(cleanLastName)) {
      setValidationError("Your first and last names must contain alphabetic characters only.");
      setIsSaving(false);
      return;
    }

     // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      setValidationError("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
      setIsSaving(false);
      return;
    }

    // Pincode validation
    const pincodeRegex = /^[1-9]\d{5}$/;
    if (cleanPincode && !pincodeRegex.test(cleanPincode)) {
      setValidationError("Please enter a valid 6-digit Indian pincode (first digit must be 1-9).");
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          phone_number: phone.trim(),
          shipping_address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setValidationError(`Database rejection profile update fail: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3 text-xs text-stone-400 font-sans">
        <Loader2 size={20} className="animate-spin text-[#c5a880]" />
        <span>Syncing customer account profiles with active catalog records...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8 select-none">

      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-serif text-2xl text-stone-900 uppercase tracking-wide">My Account Profile</h2>
        <p className="text-xs font-sans text-stone-500 mt-0.5">Manage your shipping information and look over your past orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PROFILE FORM */}        
      <form onSubmit={handleSaveProfile} className="md:col-span-5 bg-white p-6 border border-stone-200 rounded-sm space-y-4">
        <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Personal Details</h3>
        
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-sans text-emerald-800 rounded-xs">
            Profile modifications successfully committed to database!
          </div>
        )}

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs font-sans text-red-800 rounded-xs">
            {validationError}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Account Email</label>
          <input type="text" disabled value={user?.email || 'No email associated'} className="w-full bg-stone-50 border border-stone-200 text-stone-400 px-3 py-2 text-xs font-sans rounded-xs cursor-not-allowed" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">First Name</label>
          <input type="text" value={firstName} onChange={(e) => { setValidationError(null); setFirstName(e.target.value); }} required placeholder="Enter first name" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Last Name</label>
          <input type="text" value={lastName} onChange={(e) => { setValidationError(null); setLastName(e.target.value); }} required placeholder="Enter last name" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Phone Number</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Default Shipping Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Apartment, Street Name, City, State, Pincode" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs resize-none" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Pincode</label>
          <input type="text" value={pincode} onChange={(e) => setPinCode(e.target.value)} placeholder="Enter pincode" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-stone-950 text-white py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-stone-800 transition-colors rounded-xs mt-2 cursor-pointer flex items-center justify-center gap-2">
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {isSaving ? "Saving Profiles..." : "Save Details"}
        </button>

        <div className="pt-4 border-t border-stone-100 flex flex-col items-start gap-2">
          <span className="text-[9px] font-sans uppercase text-stone-400 tracking-wider">Danger Zone</span>
          <button 
            type="button" 
            onClick={() => setConfirmationModal({
              isOpen: true,
              orderId: '',
              type: 'delete',
              title: 'Are you sure you want to delete this account?',
              message: 'This action is permanent and cannot be undone. All your data, profile settings, and history will be permanently erased.'
            })}
            className="text-[10px] font-sans uppercase tracking-wider text-red-600 hover:text-red-800 transition-colors cursor-pointer font-medium flex items-center gap-1.5"
          >
            <Trash2 size={11} /> Delete Account
          </button>
        </div>
      </form>

        {/* RIGHT COLUMN: ORDERS HISTORY */}
        <div className="md:col-span-7 bg-white p-6 border border-stone-200 rounded-sm space-y-4">
          <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Order History (Past 6 Months)</h3>
          
          <div className="space-y-4">
            {dbOrders.length === 0 ? (
              <div className="border border-stone-200 bg-stone-50/20 rounded-xs p-10 text-center space-y-4">
                <div className="space-y-1">
                  <ShoppingBag className="mx-auto text-stone-300 font-light mb-2" size={24} strokeWidth={1} />
                  <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-stone-900">No Orders Within 6 Months</h4>
                  <p className="text-xs text-stone-400 font-sans max-w-xs mx-auto leading-relaxed">
                    Your personal jewelry vault has no orders recorded over the last 6 months.
                  </p>
                </div>
                <button type="button" onClick={() => navigateToView('collection', 'All', null)} className="bg-stone-900 text-white text-[11px] font-sans uppercase tracking-widest px-5 py-2.5 rounded-xs hover:bg-stone-800 transition-colors cursor-pointer">
                  Explore Collections
                </button>
              </div>
            ) : (
              dbOrders.map((ord) => {
                const isCurrentlyProcessing = actionLoadingId === ord.id;
                // Helper to check return eligibility
                const isWithinReturnWindow = () => {
                  if (ord.status !== 'delivered') return false;

                  const deliveryDate = new Date(ord.delivery_date || ord.created_at);
                  const today = new Date();
                  const daysSinceDelivery = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

                  return daysSinceDelivery <= 7;
                };

                return (
                  <div key={ord.id} className="p-4 border border-stone-200 rounded-xs flex flex-col gap-4 bg-stone-50/30 relative">
                    
                    {/* Card Header Info */}
                    <div className="flex justify-between items-start border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-medium text-stone-900 uppercase block">#{ord.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-sans text-stone-400 block">
                          {new Date(ord.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        </span>
                      </div>
                      
                      {/* Dynamic Fulfillment Status Badge Matrices */}
                      <span className={`text-[9px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded-xs border h-fit ${
                        ord.status === 'pending' ? 'bg-stone-100 text-stone-500 border-stone-200' : 
                        ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        ord.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                        ord.status === 'return_requested' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        ord.status === 'return_accepted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {ord.status === 'return_requested' ? 'Return Requested' : ord.status || 'pending'}
                      </span>
                    </div>
                    
                    {/* Product Rows Mapping */}
                    <div className="space-y-3">
                      {ord.items?.map((item, index) => {
                        const targetId = item.product?.id || '';
                        const productExists = liveProductIds.has(targetId);

                        return (
                          <div key={index} className="flex items-center gap-4">
                            <img 
                              src={productExists ? item.product?.main_image : "/placeholder.jpg"} 
                              alt={productExists ? item.product?.name : ""} 
                              className={`w-12 h-12 object-cover bg-stone-100 rounded-xs border border-stone-200/40 shrink-0 ${
                                productExists ? 'cursor-pointer hover:opacity-90 transition-opacity' : 'opacity-60'
                              }`}
                              onClick={() => productExists && navigateToView('product-details', 'All', item.product)}
                            />
                            
                            <div className="flex-1 min-w-0">
                              {productExists ? (
                                <p 
                                  onClick={() => navigateToView('product-details', 'All', item.product)}
                                  className="text-xs font-sans font-normal text-stone-900 truncate cursor-pointer hover:text-[#c5a880] hover:underline transition-colors"
                                >
                                  {item.product?.name}
                                </p>
                              ) : (
                                <p className="text-xs font-sans font-light text-stone-400 italic truncate">
                                  Archived Design (Unavailable)
                                </p>
                              )}
                              
                              <p className="text-[10px] font-sans text-stone-400 mt-0.5">
                                Quantity: {item.quantity} • Size: {item.size || 'One Size'}
                              </p>
                            </div>

                            {productExists && item.product?.price ? (
                              <span className="text-xs font-sans text-stone-500 shrink-0">
                                ₹{(item.product.price * (1 - (item.product.discount_rate || 0)/100)).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-sans text-stone-400 italic shrink-0">
                                Historical Record
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="border-t border-stone-100 pt-3 flex flex-col gap-3 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-stone-400">Total Charged</span>
                        <span className="text-sm font-sans font-semibold text-stone-950">
                          ₹{ord.total_paid.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-stone-100/60">
                        
                        {/* A. CUSTOM CANCELLATION TRIGGER */}
                        {ord.status?.toLowerCase() === 'pending' && (
                          <button
                            type="button"
                            disabled={isCurrentlyProcessing || actionLoadingId !== null}
                            onClick={() => setConfirmationModal({
                              isOpen: true,
                              orderId: ord.id,
                              type: 'cancel',
                              title: 'Cancel Order Reservation',
                              message: 'Are you absolutely sure you want to terminate this order? This operation cannot be undone.'
                            })}
                            className="w-full sm:w-auto text-[10px] uppercase font-sans font-medium tracking-wider px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-2xs cursor-pointer transition-colors disabled:opacity-40 text-center"
                          >
                            {isCurrentlyProcessing ? 'Processing...' : 'Cancel Order'}
                          </button>
                        )}

                        {/* B. CUSTOM RETURN TRIGGER */}
                        {ord.status?.toLowerCase() === 'delivered' && isWithinReturnWindow() && (
                          <button
                            type="button"
                            disabled={isCurrentlyProcessing || actionLoadingId !== null}
                            onClick={() => setConfirmationModal({
                              isOpen: true,
                              orderId: ord.id,
                              type: 'return',
                              title: 'Request Return Authorization',
                              message: 'Would you like to initiate a return request for this package window? A manager will audit the items for fulfillment verification.'
                            })}
                            className="w-full sm:w-auto text-[10px] uppercase font-sans font-medium tracking-wider px-3 py-1.5 bg-stone-950 text-white hover:bg-stone-800 rounded-2xs cursor-pointer transition-colors disabled:opacity-40 text-center"
                          >
                            {isCurrentlyProcessing ? 'Processing...' : 'Request Return'}
                          </button>
                        )}

                        {/* C. LOCKED STATUS CAPTION DISPLAY */}
                        {['shipped', 'cancelled', 'return_requested', 'return_accepted', 'delivered'].includes(ord.status?.toLowerCase()) && (
                          <p className="text-[10px] font-sans italic text-stone-400 select-none py-1">
                            {ord.status === 'shipped' && "Order is in transit with carrier."}
                            {ord.status === 'cancelled' && "This transaction order has been cancelled."}
                            {ord.status === 'return_requested' && "Return processing request is pending for review."}
                            {ord.status === 'return_accepted' && "Return finalized. You'll receive refund within 4-5 business working days."}
                            {ord.status === 'delivered' && !isWithinReturnWindow() && " Return period has expired."}
                          </p>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      {/* CUSTOM CONFIRMATION ACTION MODAL LAYER */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-stone-200 p-6 rounded-sm max-w-sm w-full space-y-4 shadow-xl">
            <div className="space-y-1.5">
              <h3 className="font-serif text-base text-stone-900 font-medium tracking-wide flex items-center gap-2">
                {(confirmationModal.type === 'delete') && (
                  <TriangleAlertIcon size={16} className="text-red-600 shrink-0" strokeWidth={2} />
                )}
                <span>{confirmationModal.title}</span>
              </h3>
              <p className="font-sans text-xs text-stone-500 font-light leading-relaxed">
                {confirmationModal.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                className="text-[10px] uppercase font-sans font-medium tracking-wider px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-2xs cursor-pointer transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { orderId, type } = confirmationModal;
                  setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                  
                  // Delete Account
                  if (type === 'delete') {
                    try {
                      
                      const { error } = await supabase.rpc('delete_user_account');
                      if (error) throw error;

                      await supabase.auth.signOut();
                      navigateToView('home'); 
                      
                      alert("Your account and data have been deleted successfully.");
                    } catch (err) {
                      console.error("Account erasure sequence interrupted:", err);
                      alert("Failed to delete account. Please try again or contact support.");
                    }
                    return;
                  }

                  // Order Actions (Cancel / Return)
                  try {
                    setActionLoadingId(orderId);
                    const targetStatus = type === 'cancel' ? 'cancelled' : 'return_requested';

                    const { error } = await supabase
                      .from('orders')
                      .update({ status: targetStatus })
                      .eq('id', orderId);

                    if (error) throw error;
                    await loadProfileAndOrdersData();
                  } catch (err) {
                    console.error(`Protocol failure modifying transaction rows to ${type}:`, err);
                  } finally {
                    setActionLoadingId(null);
                  }
                }}
                className={`text-[10px] uppercase font-sans font-medium tracking-wider px-3 py-1.5 text-white rounded-2xs cursor-pointer transition-colors ${
                  confirmationModal.type === 'cancel' || 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-stone-950 hover:bg-stone-800'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}