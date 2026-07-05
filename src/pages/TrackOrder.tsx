import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path based on your codebase setup

interface TrackOrderProps {
  initialOrderId: string;
  initialToken: string;
}

export default function TrackOrder({ initialOrderId, initialToken }: TrackOrderProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchGuestOrder = async () => {
      if (!initialOrderId || !initialToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', initialOrderId)
          .eq('guest_token', initialToken)
          .single();

        if (dbError) throw dbError;
        setOrder(data);
      } catch (err: any) {
        console.error("Error retrieving order:", err);
        setError("Could not find a transaction for the provided link. If this is unexpected, please contact support.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuestOrder();
  }, [initialOrderId, initialToken]);

  const isCurrentlyProcessing = actionLoadingId === initialOrderId;
  // Format timestamp safely to match "1 July 2026"
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const loadOrdersData = async() => {
    try {
  
      // 2. LOAD ORDERS: Updated to include your new return lifecycle tracking states!
      const { data , error: orderError } = await supabase
        .from('orders')
        .select('id, created_at, items, total_paid, status')
        .eq('id', initialOrderId)        // 👈 Explicitly pass the order ID!
        .eq('guest_token', initialToken) // 👈 Authenticate the guest context
        .single();

      if (orderError) throw orderError;

      setOrder(data);
  
    } catch (err) {
      console.error("Critical error mapping out profile workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-12 text-sm text-stone-500">Loading order configuration...</div>;
  if (error) return <div className="text-center p-12 text-sm text-red-500">{error}</div>;
  if (!order) return <div className="text-center p-12 text-sm text-stone-500">No order context supplied.</div>;

  return (
    <div className="w-full max-w-xl mx-auto p-4 md:p-8">
      {/* Main Order Card Frame Layout */}
      <div className="bg-white border border-stone-200 rounded-sm p-6 md:p-8 font-sans text-stone-900 shadow-sm">
        
        {/* Top Meta Header Section */}
        <div className="flex justify-between items-start pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-medium tracking-tight">
              #{initialOrderId.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
          
          {/* Dynamic Fulfillment Status Badge Matrices */}
          <span className={`text-[9px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded-xs border h-fit ${
            order.status === 'pending' ? 'bg-stone-100 text-stone-500 border-stone-200' : 
            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
            order.status === 'return_requested' ? 'bg-purple-50 text-purple-700 border-purple-200' :
            order.status === 'returned' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Dynamic Nested Product Line Items Stack */}
        <div className=" py-6 space-y-6">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Product Thumbnail Thumbnail Preview */}
                <img 
                  src={item.product?.main_image || 'https://via.placeholder.com/64'} 
                  alt={item.product?.name || "Product Item"} 
                  className="w-16 h-16 object-cover bg-stone-50 border border-stone-100"
                />
                <div>
                  <h3 className="text-sm font-medium text-stone-800">
                    {item.product?.name || 'Store Item'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Quantity: {item.quantity} &bull; Size: {item.size || 'Universal Size'}
                  </p>
                </div>
              </div>
              
              {/* Individual Price Calculation Display */}
              <span className="text-sm text-stone-500 font-normal">
                ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Total Footer Segment + User Interactive Action Controllers */}
                    <div className="border-t border-stone-100 pt-3 flex flex-col gap-3 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-stone-400">Total Charged</span>
                        <span className="text-sm font-sans font-semibold text-stone-950">
                          ₹{order.total_paid.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Action Button Strip Node */}
                      <div className="flex justify-end gap-2 pt-1 border-t border-stone-100/60">
                        
                        {/* A. CUSTOM CANCELLATION TRIGGER */}
                        {order.status?.toLowerCase() === 'pending' && (
                          <button
                            type="button"
                            disabled={isCurrentlyProcessing || actionLoadingId !== null}
                            onClick={() => setConfirmationModal({
                              isOpen: true,
                              orderId: initialOrderId,
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
                        {order.status?.toLowerCase() === 'delivered' && (
                          <button
                            type="button"
                            disabled={isCurrentlyProcessing || actionLoadingId !== null}
                            onClick={() => setConfirmationModal({
                              isOpen: true,
                              orderId: initialOrderId,
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
                        {['shipped', 'cancelled', 'return_requested', 'returned'].includes(order.status?.toLowerCase()) && (
                          <p className="text-[10px] font-sans italic text-stone-400 select-none py-1">
                            {order.status === 'shipped' && "Order is in transit with carrier. Options locked."}
                            {order.status === 'cancelled' && "This transaction order has been cancelled."}
                            {order.status === 'return_requested' && "Return processing request is pending managerial review."}
                            {order.status === 'returned' && "Return lifecycle finalized. Restock complete."}
                          </p>
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
                    await loadOrdersData();
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