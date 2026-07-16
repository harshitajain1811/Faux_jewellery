import { useState } from 'react';
import { Plus, Minus, Sparkles } from 'lucide-react';

interface FaqRecord {
  q: string;
  a: string;
}

export default function Faq() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const dynamicFaqs: FaqRecord[] = [
    {
      q: "Does your artificial jewellery tarnish or discolor over time?",
      a: "Every item in our premium allocation uses advanced Physical Vapor Deposition (PVD) gold layering matrices over specialized stainless steel. This protective outer boundary creates structural resistance against water, sweat, and standard atmospheric moisture patterns."
    },
    {
      q: "What types of simulated stones are configured into the settings?",
      a: "We exclusively select precision-cut AAAAA grade cubic zirconia and simulated lab-gems. Each facet is cut according to exacting diamond-weight criteria to maximize deep refraction and avoid clouded reflections over extended use."
    },
    {
      q: "Is the material safe for sensitive dermatological profiles?",
      a: "Absolutely. All metal configurations are certified 100% hypoallergenic, nickel-free, and lead-free. They are engineered specifically to avoid skin discolouration or allergic reactions."
    },
    {
      q: "How can I guarantee long-term luster for my objects?",
      a: "We recommend gently wiping your pieces with a soft microfiber lining cloth after use. Avoid direct chemical exposure to heavy industrial perfumes, acetone-based liquids, or harsh luxury spa pools to maximize the lifespan of the gold barrier."
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-950 select-none animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-8 md:px-12 py-20 space-y-12">
        
        {/* HEADER AREA */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={14} strokeWidth={1} className="text-[#c5a880]" />
            <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#c5a880] font-semibold">Atelier Knowledge Base</span>
          </div>
          <h1 className="font-serif text-4xl tracking-wide uppercase font-light text-stone-950">Frequently Asked Questions</h1>
        </div>

        {/* INTERACTIVE ACCORDION GRID */}
        <div className="border-t border-stone-200 divide-y divide-stone-200/60">
          {dynamicFaqs.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button 
                  onClick={() => setActiveIndex(isSelected ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                >
                  <span className={`text-sm font-sans tracking-wide transition-colors ${isSelected ? 'text-stone-800' : 'text-stone-600 group-hover:text-stone-950'}`}>
                    {item.q}
                  </span>
                  <span className={`transition-colors ${isSelected ? 'text-[#c5a880]' : 'text-stone-400 group-hover:text-stone-950'}`}>
                    {isSelected ? <Minus size={14} /> : <Plus size={14} />}
                  </span>
                </button>
                
                <div id={`faq-panel-${idx}`} role="tabpanel" aria-hidden={!isSelected}
                  className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isSelected ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-500 tracking-wide pr-6">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}