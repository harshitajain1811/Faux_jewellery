import { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Truck, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    main_image: string;
    category: string;
  };
  quantity: number;
  size: string;
}

interface CheckoutProps {
  cartItems: CartItem[];
  user: { id?: string; email: string } | null;
  onOrderPlacedSuccess: () => void;
  navigateToView: (
    targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details", 
    targetCategory?: string, 
    targetProduct?: any, 
    replace?: boolean
  ) => void;
}

// 1. OUTER COMPONENT: Safely fetches profile data before mounting Stripe Canvas
export default function Checkout(props: CheckoutProps) {
  const [initialFormData, setInitialFormData] = useState({
    email: props.user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  useEffect(() => {
    async function prefillUserProfile() {
      // Check for user id instead of email since that is your relational primary key
      if (!props.user?.id) {
        setIsProfileLoaded(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone_number, shipping_address, city, pincode')
          .eq('id', props.user.id) // Querying using id instead of email
          .single();

        if (error) throw error;

        if (profile) {
          setInitialFormData({
            email: props.user.email || '', 
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            phone: profile.phone_number || '',
            address: profile.shipping_address || '',
            city: profile.city || '',
            postalCode: profile.pincode || ''
          });
        }
      } catch (err) {
        console.log("Profile row setup skipped:", err);
      } finally {
        setIsProfileLoaded(true);
      }
    }

    prefillUserProfile();
  }, [props.user]);

  // Keep the UI empty for just a split second while compiling DB rows
  if (!isProfileLoaded) {
    return <div className="max-w-7xl mx-auto px-8 py-32 text-center text-xs font-sans tracking-widest uppercase text-stone-400">Syncing Secure Environment...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormInterior {...props} structuralPreFill={initialFormData} />
    </Elements>
  );
}

// 2. INTERIOR COMPONENT: Handles the view presentation and interactive inputs
interface InteriorProps extends CheckoutProps {
  structuralPreFill: any;
}

function CheckoutFormInterior({ cartItems, user, onOrderPlacedSuccess, navigateToView, structuralPreFill }: InteriorProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [guestSuccessMessage, setGuestSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState(structuralPreFill);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const insuranceAndShipping = subtotal > 5000 ? 0 : 50;
  const estimatedTax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + insuranceAndShipping + estimatedTax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateShippingForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = "Provide a valid active email address.";
    }
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    if (!nameRegex.test(formData.firstName.trim())) errors.firstName = "Requires at least 3 letters.";
    if (!nameRegex.test(formData.lastName.trim())) errors.lastName = "Requires at least 3 letters.";
    
    if (formData.address.trim().length < 10) errors.address = "Minimum 10 characters required.";
    if (formData.city.trim().length < 2) errors.city = "Provide a valid city name.";
    
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(formData.postalCode.trim())) errors.postalCode = "Postal code must be 6 digits.";
    
    const phoneDigits = formData.phone.replace(/\D/g, ''); 
    if (phoneDigits.length !== 10) errors.phone = "Provide exactly 10 numerical digits.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (validateShippingForm()) {
      setPaymentError(null);
      setCheckoutStep('payment');
    }
  };

  const handleFinalPaymentSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isCardComplete) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const structuralPhoneNumberWithCountryPrefix = `+91${formData.phone.replace(/\D/g, '')}`;

      const response = await fetch('http://localhost:5000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount * 100, email: formData.email })
      });
      const { clientSecret } = await response.json();

      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            phone: structuralPhoneNumberWithCountryPrefix,
            email: formData.email.trim(),
          }
        }
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const { data: newOrder, error: dbError } = await supabase
          .from('orders')
          .insert([{
            user_id: user?.id || null,
            user_email: formData.email.trim(),
            user_details: {
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              phone: structuralPhoneNumberWithCountryPrefix
            },
            items: cartItems,
            shipping_address: {
              address_line: formData.address.trim(),
              city: formData.city.trim(),
              postal_code: formData.postalCode.trim()
            },
            total_paid: totalAmount,
            stripe_payment_id: paymentIntent.id
          }])
          .select('id, guest_token, total_paid, user_email')
          .single();

        if (dbError) {
          console.error("Database insert error:", dbError);
        } else if (newOrder) {
          supabase.functions.invoke('send-guest-order', {
            body: {
              email: newOrder.user_email,
              orderId: newOrder.id,
              guestToken: newOrder.guest_token, 
              totalAmount: newOrder.total_paid,
              isGuest: !user
            }
          });
        }

        try {
        for (const item of cartItems) {          
          // 1. Fetch current product sizes JSON configuration
          const { data: product } = await supabase
            .from('products')
            .select('size_stock')
            .eq('id', item.product.id) 
            .single();

          if (product && product.size_stock) {
            const updatedSizes = { ...product.size_stock };
            const currentQty = updatedSizes[item.size] || 0;
            
            // Subtract purchased quantity, making sure it doesn't drop below 0
            updatedSizes[item.size] = Math.max(0, currentQty - item.quantity);

            // 2. Push updated JSON back to database
            await supabase
              .from('products')
              .update({ size_stock: updatedSizes })
              .eq('id', item.product.id);
          }
          }
        } catch (stockError) {
          console.error("Non-blocking error syncing inventory metrics:", stockError);
        }

        if (user) {
          await supabase
          .from('user_carts')
          .delete()
          .eq('user_id', user.id);

          onOrderPlacedSuccess();
          navigateToView('profile'); 
        } else {
          setGuestSuccessMessage(`Success! Your order details have been securely transmitted to ${formData.email}.`);
          onOrderPlacedSuccess();
        }
      }

    } catch (err: any) {
      setPaymentError(err?.message || "An error occurred during submission.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && !guestSuccessMessage) {
    navigateToView('collection');
  }

  if (guestSuccessMessage) {
    return (
      <div className="max-w-xl w-full mx-auto px-8 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-950">
          <ShieldCheck size={28} />
        </div>
        <h2 className="font-serif italic text-2xl text-stone-900">Thank You For Your Order</h2>
        <p className="text-sm font-sans text-stone-600 leading-relaxed">{guestSuccessMessage}</p>
        <button onClick={() => navigateToView('collection')} className="mt-4 px-8 py-3 bg-stone-950 text-white font-sans text-xs tracking-widest uppercase border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 cursor-pointer">
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        <div className="lg:order-1 lg:col-span-7 space-y-10 order-2">
          <div className="flex gap-8 border-b border-stone-200/60 pb-4 text-xs font-sans tracking-widest uppercase">
            <span className={`font-medium ${checkoutStep === 'shipping' ? 'text-stone-950' : 'text-stone-300'}`}>01. Logistics</span>
            <span className="text-stone-300">&mdash;</span>
            <span className={`font-medium ${checkoutStep === 'payment' ? 'text-stone-950' : 'text-stone-300'}`}>02. Secure Payment</span>
          </div>

          {checkoutStep === 'shipping' && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              <div className="flex items-center gap-2 text-stone-400">
                <Truck size={14} />
                <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900">Delivery Logistics</h3>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.email ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} />
                {validationErrors.email && <p className="text-[10px] text-red-600 font-sans">{validationErrors.email}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.firstName ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} />
                  {validationErrors.firstName && <p className="text-[10px] text-red-600 font-sans">{validationErrors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.lastName ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} />
                  {validationErrors.lastName && <p className="text-[10px] text-red-600 font-sans">{validationErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Destination Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.address ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} placeholder="Suite, Street Address Line" />
                {validationErrors.address && <p className="text-[10px] text-red-600 font-sans">{validationErrors.address}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Locality / City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.city ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} />
                  {validationErrors.city && <p className="text-[10px] text-red-600 font-sans">{validationErrors.city}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Postal Code (6 Digits)</label>
                  <input type="text" maxLength={6} name="postalCode" value={formData.postalCode} onChange={handleInputChange} className={`w-full bg-white border p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none ${validationErrors.postalCode ? 'border-red-500' : 'border-stone-200 focus:border-stone-950'}`} />
                  {validationErrors.postalCode && <p className="text-[10px] text-red-600 font-sans">{validationErrors.postalCode}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Secure Contact Number</label>
                <div className="flex rounded-xs border overflow-hidden bg-white border-stone-200 focus-within:border-stone-950">
                  <span className="bg-stone-50 border-r border-stone-200 px-3 py-2.5 text-xs font-sans text-stone-500 flex items-center">+91</span>
                  <input type="tel" maxLength={10} name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2.5 text-xs font-sans text-stone-800 outline-none border-none bg-transparent" placeholder="00000 00000" />
                </div>
                {validationErrors.phone && <p className="text-[10px] text-red-600 font-sans pt-1">{validationErrors.phone}</p>}
              </div>

              <button type="submit" className="w-full mt-4 bg-stone-950 text-white font-sans text-[11px] tracking-widest uppercase py-4 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
                Continue to Payment Methods <ArrowRight size={14} />
              </button>
            </form>
          )}

          {checkoutStep === 'payment' && (
            <form onSubmit={handleFinalPaymentSubmit} className="space-y-6">
              <div className="flex items-center gap-2 text-stone-400">
                <CreditCard size={14} />
                <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900">Stripe Secure Card Element</h3>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400 block mb-2">Credit or Debit Card</label>
                <div className="w-full bg-white border border-stone-200 p-4 rounded-xs text-stone-950">
                  <CardElement 
                    onChange={(e) => setIsCardComplete(e.complete)} 
                    options={{ 
                      style: { 
                        base: { 
                          fontSize: '14px', 
                          color: '#1c1917', 
                          fontFamily: 'sans-serif',
                          '::placeholder': { color: '#a8a29e' } 
                        }, 
                        invalid: { color: '#991b1b' } 
                      } 
                    }} 
                  />
                </div>
              </div>
              {paymentError && <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xs font-sans tracking-wide">{paymentError}</p>}
              <div className="flex gap-2.5 bg-stone-50 border border-stone-200/50 p-4 rounded-xs text-stone-500">
                <ShieldCheck size={16} className="text-stone-800 shrink-0 mt-0.5" />
                <p className="text-[10px] font-sans leading-relaxed tracking-wide">Stripe handles card data directly. Your financial details never touch our local servers.</p>
              </div>
              <div className="flex sm:flex-row flex-col gap-4">
                <button type="button" disabled={isProcessing} onClick={() => setCheckoutStep('shipping')} className="px-6 bg-transparent text-stone-950 font-sans text-xs tracking-widest uppercase py-4 border border-stone-300 hover:border-stone-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
                  <ArrowLeft size={14} /> Previous
                </button>
                <button type="submit" disabled={isProcessing || !stripe || !isCardComplete} className="grow bg-stone-950 text-white font-sans text-xs tracking-widest uppercase py-4 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed cursor-pointer">
                  <Lock size={12} /> {isProcessing ? "Processing..." : `Authorize Allocation • ₹${totalAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="lg:order-2 lg:col-span-5 bg-stone-50/60 border border-stone-200/60 p-6 lg:sticky lg:top-32 rounded-xs space-y-6 order-1">
          <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900 border-b border-stone-200 pb-3">Acquisition Allocation</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {cartItems.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="flex gap-4 items-center justify-between font-sans text-xs pb-4 border-b border-stone-200/40 last:border-none last:pb-0">
                <div className="flex gap-3 items-center truncate">
                  <img src={item.product.main_image} alt={item.product.name} className="w-12 h-12 object-cover bg-white border border-stone-200/60 rounded-xs" />
                  <div className="truncate space-y-0.5">
                    <h4 className="text-stone-900 font-light truncate">{item.product.name}</h4>
                    <p className="text-[10px] text-stone-400">Size: {item.size} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-stone-950 font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-stone-200 pt-4 font-sans text-xs text-stone-600">
            <div className="flex justify-between"><span>Subtotal Curation</span><span className="text-stone-950">₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Insured Global Dispatch</span><span className="text-stone-950">{insuranceAndShipping === 0 ? "Complimentary" : `₹${insuranceAndShipping}`}</span></div>
            <div className="flex justify-between"><span>Estimated Registry Surcharge (Tax)</span><span className="text-stone-950">₹{estimatedTax}</span></div>
            <div className="flex justify-between items-baseline text-stone-950 font-medium pt-3 border-t border-stone-200 text-sm">
              <span className="font-serif text-xs text-stone-500">Total Amount</span>
              <span className="text-sm font-semibold font-sans">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}