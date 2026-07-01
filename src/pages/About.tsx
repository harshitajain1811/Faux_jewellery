import { ArrowRight, Sparkles } from 'lucide-react';
import jewelleryImage from '../assets/necklace set.jpg';

export default function About({ navigateToView }: { navigateToView: (view: any, category?: string, product?: any) => void }) {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-950 select-none animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto px-8 md:px-12 py-20 space-y-24">
        
        {/* HEADER HERO */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} strokeWidth={1} className="text-[#c5a880]" />
            <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#c5a880] font-semibold">The Craftsmanship</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-wide uppercase leading-tight font-light text-stone-950">
            High-Luxury Aesthetics. <br />Engineered For Life.
          </h1>
        </div>

        {/* PROFILE BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 bg-stone-100 aspect-4/5 overflow-hidden shadow-sm border border-stone-200/40">
            <img 
              src={jewelleryImage} 
              alt="Artisan Jewellery Designing" 
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out hover:scale-102"
            />
          </div>
          <div className="md:col-span-5 space-y-6">
            <h2 className="font-serif text-2xl tracking-wide uppercase font-light text-[#c5a880]">The Alternative Luxury</h2>
            <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-500 font-light tracking-wide">
              We create premium faux jewellery designed to challenge the traditional boundaries of fine ornaments. By fusing industrial-grade anti-tarnish alloys with hand-set simulated crystals, our collections present structural resilience without compromising brilliance.
            </p>
            <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-500 font-light tracking-wide">
              Every curve, clasp, and settings array is carefully curated to mimic the weight, balance, and visual depth of heirloom pieces—providing timeless elegance for your daily routine.
            </p>
          </div>
        </div>

        {/* MANIFESTO INFRASTRUCTURE */}
        <div className="border-t border-stone-200 pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <span className="font-serif text-sm tracking-widest text-[#c5a880] uppercase block font-light">I / Hyper-Resistant Alloys</span>
            <p className="font-sans text-xs text-stone-500 font-light leading-relaxed">Coated using defensive PVD barriers to maintain structural luster and prevent daily wear and tarnish.</p>
          </div>
          <div className="space-y-2">
            <span className="font-serif text-sm tracking-widest text-[#c5a880] uppercase block font-light">II / Precision Settings</span>
            <p className="font-sans text-xs text-stone-500 font-light leading-relaxed">Each stone variant is individually calibrated and secured inside custom molds to guarantee maximum reflectivity.</p>
          </div>
          <div className="space-y-2">
            <span className="font-serif text-sm tracking-widest text-[#c5a880] uppercase block font-light">III / Direct Allocation</span>
            <p className="font-sans text-xs text-stone-500 font-light leading-relaxed">Eliminating traditional high-tier markups to supply premium objects straight to your private collection.</p>
          </div>
        </div>

        {/* ACTIONS BRANDING */}
        <div className="text-center border border-stone-200/60 p-12 space-y-6 max-w-3xl mx-auto rounded-sm shadow-md transition-all duration-300">
          <h3 className="font-serif text-xl tracking-wide uppercase font-light text-stone-950">
            Explore The Master Collections
          </h3>
          <div className="flex justify-center">
            <button 
              onClick={() => navigateToView('collection', 'All', null)} 
              className="group flex items-center gap-4 bg-stone-950 text-[#f5f2eb] px-8 py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-[#c5a880] hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
            >
              Discover Curation <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}