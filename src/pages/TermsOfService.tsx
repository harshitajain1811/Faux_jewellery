export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-24 font-sans font-light text-stone-600 antialiased leading-relaxed space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Platform Protocol</p>
        <h1 className="font-serif text-3xl text-stone-900 font-light tracking-wide">Terms of Service</h1>
        <p className="text-xs text-stone-400 italic">Last Updated: June 2026</p>
      </div>

      {/* Content Blocks */}
      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">01. Digital Atelier Access</h3>
        <p className="text-sm tracking-wide">
          By exploring or procuring items from [Aura Jewellery], you agree to abide by our operational regulations. All digital media, photography, layout compositions, and design assets are the exclusive intellectual domain of the Maison.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">02. Pricing & Visual Interpretations</h3>
        <p className="text-sm tracking-wide">
          While we make every attempt to render our high-intensity micro-plated finishes and gemstone selections with pinpoint color accuracy, variations across individual consumer hardware monitors may occur. We reserve the right to correct minor pricing or inventory discrepancies immediately.
        </p>
      </section>
    </main>
  );
}