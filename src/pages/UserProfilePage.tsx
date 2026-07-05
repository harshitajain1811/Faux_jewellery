import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingBag, Loader2, Save } from 'lucide-react';

interface UserProfileProps {
  user: { id: string; email: string } | null;
  navigateToView: (targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details", targetCategory?: string, targetProduct?: any) => void;
}

interface NestedProductData {
  name: string;
  main_image: string;
  price: number;
}

interface OrderItem {
  product_id: string;
  size: string;
  quantity: number;
  product?: NestedProductData;
}

interface Order {
  id: string;
  created_at: string;
  items: OrderItem[];
  total_paid: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
}

export default function UserProfilePage({ user, navigateToView }: UserProfileProps) {
  // Profiles explicit state hooks
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

  const [confirmationModal, setConfirmationModal] = useState<{
      isOpen: boolean;
      orderId: string;
      type: 'cancel' | 'return' | null;
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
    if (user?.id) {
      loadProfileAndOrdersData();
    }
  }, [user?.id]);

  const loadProfileAndOrdersData = async (justRefreshOrders = false) => {
  try {
    // Only turn on the full-screen loader if it's the initial page setup load
    if (!justRefreshOrders) setLoadingData(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const activeUserId = user?.id || sessionData?.session?.user?.id;

    if (!activeUserId) {
      if (!justRefreshOrders) setLoadingData(false);
      return;
    }

    // 1. CONDITIONAL PROFILE FETCH: Skip if we are just refreshing the order status cards
    if (!justRefreshOrders) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, shipping_address, city, pincode')
        .eq('id', activeUserId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        await supabase.from('profiles').insert([{ id: activeUserId, first_name: '', last_name: '', phone_number: '', shipping_address: '', city: '', pincode: '' }]);
      } else if (profileData) {
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setPhone(profileData.phone_number || '');
        setAddress(profileData.shipping_address || '');
        setCity(profileData.city || '');
        setPinCode(profileData.pincode || '');
      }
    }

    // Compute dynamic time boundary for exactly 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 2. LOAD ORDERS: Updated to include your new return lifecycle tracking states!
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, created_at, items, total_paid, status')
      .eq('user_id', activeUserId) 
      .gte('created_at', sixMonthsAgo.toISOString()) 
      .order('created_at', { ascending: false });

    if (orderError) throw orderError;
    if (orderData) setDbOrders(orderData as unknown as Order[]);

  } catch (err) {
    console.error("Critical error mapping out profile workspace data:", err);
  } finally {
    if (!justRefreshOrders) setLoadingData(false);
  }
};

  const handleSaveProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    // Validations matching request guidelines
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

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          phone_number: phone.trim(),
          shipping_address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim() ? null : Number(pincode),
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
                        ord.status === 'returned' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {ord.status === 'return_requested' ? 'Return Requested' : ord.status || 'pending'}
                      </span>
                    </div>
                    
                    {/* Product Rows Mapping */}
                    <div className="space-y-3">
                      {ord.items?.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <img 
                            src={item.product?.main_image} 
                            alt={item.product?.name} 
                            className="w-12 h-12 object-cover bg-stone-100 rounded-xs border border-stone-200/40 shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-sans font-normal text-stone-900 truncate">
                              {item.product?.name}
                            </p>
                            <p className="text-[10px] font-sans text-stone-400 mt-0.5">
                              Quantity: {item.quantity} • Size: {item.size || 'One Size'}
                            </p>
                          </div>
                          {item.product?.price && (
                            <span className="text-xs font-sans text-stone-500 shrink-0">
                              ₹{item.product.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Total Footer Segment + User Interactive Action Controllers */}
                    <div className="border-t border-stone-100 pt-3 flex flex-col gap-3 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-stone-400">Total Charged</span>
                        <span className="text-sm font-sans font-semibold text-stone-950">
                          ₹{ord.total_paid.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Action Button Strip Node */}
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
                        {ord.status?.toLowerCase() === 'delivered' && (
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
                        {['shipped', 'cancelled', 'return_requested', 'returned'].includes(ord.status?.toLowerCase()) && (
                          <p className="text-[10px] font-sans italic text-stone-400 select-none py-1">
                            {ord.status === 'shipped' && "Order is in transit with carrier. Options locked."}
                            {ord.status === 'cancelled' && "This transaction order has been cancelled."}
                            {ord.status === 'return_requested' && "Return processing request is pending managerial review."}
                            {ord.status === 'returned' && "Return lifecycle finalized. Restock complete."}
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
              <h3 className="font-serif text-base text-stone-900 font-medium tracking-wide">
                {confirmationModal.title}
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
                  // Close modal overlay window interface immediately
                  setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                  
                  try {
                    setActionLoadingId(orderId);
                    const targetStatus = type === 'cancel' ? 'cancelled' : 'return_requested';

                    const { error } = await supabase
                      .from('orders')
                      .update({ status: targetStatus })
                      .eq('id', orderId);

                    if (error) throw error;
                    await loadProfileAndOrdersData(true); // Fire our optimized order card state refetch
                  } catch (err) {
                    console.error(`Protocol failure modifying transaction rows to ${type}:`, err);
                  } finally {
                    setActionLoadingId(null);
                  }
                }}
                className={`text-[10px] uppercase font-sans font-medium tracking-wider px-3 py-1.5 text-white rounded-2xs cursor-pointer transition-colors ${
                  confirmationModal.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-950 hover:bg-stone-800'
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