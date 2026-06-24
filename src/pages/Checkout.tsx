import { useState } from 'react';
import { ShieldCheck, CreditCard, Truck, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe pipeline with your Publishable API Key
// Replace with your actual key from the Stripe Dashboard (pk_test_...)
const stripePromise = loadStripe('pk_test_your_publishable_key_here');

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
  user: { email: string } | null;
  onOrderPlacedSuccess: () => void;
  onBack: () => void;
}

export default function Checkout(props: CheckoutProps) {
  // Wrap the checkout interior within the secure Stripe Elements context provider
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormInterior {...props} />
    </Elements>
  );
}

/* =====================================================================
   INTERIOR FORM COMPONENT (Has access to secure Stripe hooks)
   ===================================================================== */
function CheckoutFormInterior({ cartItems, user, onOrderPlacedSuccess, onBack }: CheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();

  // Multi-step phase handling state
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Address and Logistics Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  // Financial Computations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const insuranceAndShipping = subtotal > 1500 ? 0 : 50;
  const estimatedTax = Math.round(subtotal * 0.08);
  const totalAmount = subtotal + insuranceAndShipping + estimatedTax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Validate shipping and progress forward
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('payment');
  };

  // Step 2: Form submission to Stripe API execution pipeline
  const handleFinalPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return; // Stripe has not loaded fully yet
    setIsProcessing(true);
    setPaymentError(null);

    try {
      /* =================================================================
         BACKEND PIPELINE INTEGRATION NOTE:
         In production, you make an API call to your backend/Supabase Edge function here:
         
         const response = await fetch('/api/create-payment-intent', {
           method: 'POST',
           body: JSON.stringify({ amount: totalAmount * 100 }) // Amount in cents
         });
         const { clientSecret } = await response.json();
         ================================================================= */

      // Simulating a minor API processing handshake delay 
      await new Promise(resolve => setTimeout(resolve, 1500));

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Secure input infrastructure error.");

      // Example of Stripe confirmation block structure matching client payload rules
      // (Using dummy confirm payment pattern for interface demonstration)
      const payload = {
        billing_details: {
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: user?.email || 'guest@aura.com',
          address: {
            line1: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
          }
        }
      };

      console.log("Stripe payload generated successfully:", payload);
      
      // Simulate successful confirmation sequence response from Stripe API cloud layers
      onOrderPlacedSuccess();
    } catch (err: any) {
      setPaymentError(err?.message || "An encrypted transmission error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="max-w-7xl w-full mx-auto px-8 py-12 select-none">
      <button 
        onClick={checkoutStep === 'payment' ? () => setCheckoutStep('shipping') : onBack}
        className="group flex items-center gap-2 text-xs tracking-widest uppercase font-sans font-light text-stone-500 hover:text-stone-950 transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft size={12} /> {checkoutStep === 'payment' ? "Back to Shipping" : "Return to Bag"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* LEFT COMPONENT COLUMN: MULTI-STEP FUNNEL MANAGEMENT */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* STEP INDICATORS */}
          <div className="flex gap-8 border-b border-stone-200/60 pb-4 text-xs font-sans tracking-widest uppercase">
            <span className={`font-medium ${checkoutStep === 'shipping' ? 'text-stone-950' : 'text-stone-300'}`}>01. Logistics</span>
            <span className="text-stone-300">&mdash;</span>
            <span className={`font-medium ${checkoutStep === 'payment' ? 'text-stone-950' : 'text-stone-300'}`}>02. Secure Payment</span>
          </div>

          {/* PHASE A: SHIPPING INFO FORM ENTRY */}
          {checkoutStep === 'shipping' && (
            <form onSubmit={handleProceedToPayment} className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-stone-400">
                <Truck size={14} />
                <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900">Delivery Logistics</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">First Name</label>
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Last Name</label>
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Destination Address</label>
                <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" placeholder="Suite, Street Address Line" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Locality / City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Postal Index</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400">Secure Contact Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-white border border-stone-200 p-2.5 text-xs font-sans text-stone-800 rounded-xs outline-none focus:border-stone-950" placeholder="+1 (555) 000-0000" />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-stone-950 text-white font-sans text-xs tracking-widest uppercase py-4 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Payment Methods <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* PHASE B: STRIPE DEPLOYED INFRASTRUCTURE INTERFACE */}
          {checkoutStep === 'payment' && (
            <form onSubmit={handleFinalPaymentSubmit} className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-stone-400">
                <CreditCard size={14} />
                <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900">Stripe Secure Card Element</h3>
              </div>

              {/* Secure Stripe Component Input Mount Frame */}
              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-wider uppercase text-stone-400 block mb-2">Credit or Debit Card</label>
                <div className="w-full bg-white border border-stone-200 p-4 rounded-xs text-stone-800">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '13px',
                          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                          color: '#1c1917',
                          '::placeholder': { color: '#a8a29e' },
                        },
                        invalid: { color: '#991b1b' },
                      },
                    }}
                  />
                </div>
              </div>

              {paymentError && (
                <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xs font-sans tracking-wide">
                  {paymentError}
                </p>
              )}

              <div className="flex gap-2.5 bg-stone-50 border border-stone-200/50 p-4 rounded-xs text-stone-500">
                <ShieldCheck size={16} className="text-stone-800 shrink-0 mt-0.5" />
                <p className="text-[10px] font-sans leading-relaxed tracking-wide">
                  Stripe handles card data directly. Your financial details never touch our local servers.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !stripe}
                className="w-full bg-stone-950 text-white font-sans text-xs tracking-widest uppercase py-4 border border-stone-950 hover:bg-transparent hover:text-stone-950 transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed cursor-pointer"
              >
                <Lock size={12} /> {isProcessing ? "Processing Vault Transmission..." : `Authorize Allocation • $${totalAmount.toLocaleString()}`}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN: INVOICE BLOCK SUMMARY DISPLAY */}
        <aside className="lg:col-span-5 bg-stone-50/60 border border-stone-200/60 p-6 lg:sticky lg:top-32 rounded-xs space-y-6">
          <h3 className="text-[10px] font-sans tracking-[0.2em] uppercase font-medium text-stone-900 border-b border-stone-200 pb-3">
            Acquisition Allocation
          </h3>

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
                <span className="text-stone-950 font-medium">${(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-stone-200 pt-4 font-sans text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal Curation</span>
              <span className="text-stone-950">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Global Dispatch</span>
              <span className="text-stone-950">{insuranceAndShipping === 0 ? "Complimentary" : `$${insuranceAndShipping}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Registry Surcharge (Tax)</span>
              <span className="text-stone-950">${estimatedTax}</span>
            </div>
            
            <div className="flex justify-between items-baseline text-stone-950 font-medium pt-3 border-t border-stone-200 text-sm">
              <span className="font-serif italic text-xs text-stone-500">Total Liability</span>
              <span className="text-base font-semibold font-sans">${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}