export default function ShippingDelivery() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-24 font-sans font-light text-stone-600 antialiased leading-relaxed space-y-8">
      <div className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Logistics Manifest</p>
        <h1 className="font-serif text-3xl text-stone-900 font-light tracking-wide">Shipping And Delivery</h1>
        <p className="text-xs text-stone-400 italic">Last Updated: June 2026</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">01. Insured Courier Transport</h3>
        <p className="text-sm tracking-wide">
          All [Aura Jewellery] allocations are processed within 24-48 tracking hours. We dispatch our items via premium, insured ground and air couriers to guarantee the complete structural protection of your parcel.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">02. Timeline & Signatures</h3>
        <p className="text-sm tracking-wide">
          Domestic destinations take roughly 3-5 operational days, while international transfers arrive within 7-10 days. Due to the high value of custom jewelry configurations, a secure signature registry is required upon parcel handover.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">03. Delivery Charges</h3>
        <p className="text-sm tracking-wide">
          Shipping is free for orders above a particular price which can be seen inside cart drawer before checkout process else a varied or fixed amount of shipping fee is applied which is non refundable.
        </p>
      </section>
    </main>
  );
}