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
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
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

  // Initialize profile and orders together once user context is ready
  useEffect(() => {
    if (user?.id) {
      loadProfileAndOrdersData();
    }
  }, [user?.id]);

  const loadProfileAndOrdersData = async () => {
    try {
      setLoadingData(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const activeUserId = user?.id || sessionData?.session?.user?.id;

      if (!activeUserId) {
        setLoadingData(false);
        return;
      }

      // 1. Fetch data from your public profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, shipping_address, city, pincode')
        .eq('id', activeUserId)
        .single();

      // If the row doesn't exist yet for older accounts, insert a baseline placeholder row
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

      // Compute dynamic time boundary for exactly 6 months ago
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // 2. Load isolated order metrics restricted to past 6 months
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, created_at, items, total_paid, status')
        .eq('user_id', activeUserId) // Restrict query mapping strictly to logged-in user
        .gte('created_at', sixMonthsAgo.toISOString()) // Filter history up to past 6 months
        .in('status', ['pending', 'shipped', 'delivered', 'cancelled'])
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      if (orderData) setDbOrders(orderData as unknown as Order[]);

    } catch (err) {
      console.error("Critical error mapping out profile workspace data:", err);
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
              dbOrders.map((ord) => (
                <div key={ord.id} className="p-4 border border-stone-200 rounded-xs flex flex-col gap-4 bg-stone-50/30">
                  
                  {/* Card Header Info */}
                  <div className="flex justify-between items-start border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-medium text-stone-900 uppercase block">#{ord.id.slice(0, 8)}</span>
                      <span className="text-[10px] font-sans text-stone-400 block">
                        {new Date(ord.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </span>
                    </div>
                    <span className={`text-[9px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded-xs border h-fit ${
                      ord.status === 'pending' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                  
                  {/* Product Rows Mapping with corrected markup spacing layout */}
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
                  
                  {/* Total Footer Segment */}
                  <div className="border-t border-stone-100 pt-2 flex justify-between items-center mt-1">
                    <span className="text-[10px] font-sans uppercase tracking-wider text-stone-400">Total Charged</span>
                    <span className="text-sm font-sans font-semibold text-stone-950">
                      ₹{ord.total_paid.toLocaleString('en-IN')}
                    </span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}