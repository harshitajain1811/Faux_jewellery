import { Trash2, ShoppingBag } from 'lucide-react';

// Define the shape of your product based on your app's types
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

interface WishlistPageProps {
  user: { id: string } | null;
  wishlistItems: Product[];
  onToggleWishlist: (product: Product) => void;
  navigateToView: (targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details" | "wishlist", targetCategory?: string, targetProduct?: any) => void;
}

export default function WishlistPage({ wishlistItems, onToggleWishlist, navigateToView }: WishlistPageProps) {
  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 space-y-6 select-none">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-serif text-2xl text-stone-900 uppercase tracking-wide">My Wishlist</h2>
        <p className="text-xs font-sans text-stone-500 mt-0.5">Your curated list of exquisite boutique jewelry pieces.</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="border border-stone-200 bg-stone-50/30 rounded-sm p-16 text-center space-y-4 max-w-xl mx-auto">
          <ShoppingBag className="mx-auto text-stone-300 font-light" size={32} strokeWidth={1} />
          <div className="space-y-1">
            <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-stone-900">Your Wishlist Is Empty</h4>
            <p className="text-xs text-stone-400 font-sans leading-relaxed">
              Browse our dynamic jewelry arrays and save pieces you adore for later tracking.
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => navigateToView('collection', 'All')} 
            className="bg-stone-900 text-white text-[11px] font-sans uppercase tracking-widest px-6 py-3 rounded-xs hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Explore Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((prod) => (
            <div key={prod.id} className="group border border-stone-100 rounded-xs overflow-hidden bg-white flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="relative cursor-pointer" onClick={() => navigateToView('product-details', undefined, prod)}>
                <img src={prod.main_image} alt={prod.name} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-102" />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid navigating to product page
                    onToggleWishlist(prod);
                  }}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-stone-500 hover:text-red-500 p-2 rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="p-3 bg-stone-50/40 border-t border-stone-50 space-y-1">
                <h3 className="text-xs font-sans text-stone-800 font-normal truncate tracking-wide">{prod.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans font-semibold text-stone-950">₹{prod.price?.toLocaleString('en-IN')}</span>
                  <span onClick={() => navigateToView('product-details', undefined, prod)} className="text-[10px] font-sans uppercase tracking-widest text-stone-400 hover:text-stone-950 transition-colors cursor-pointer">
                    View Product
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}