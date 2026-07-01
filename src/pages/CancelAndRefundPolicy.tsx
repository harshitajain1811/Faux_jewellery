export default function CancellationRefund() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-24 font-sans font-light text-stone-600 antialiased leading-relaxed space-y-8">
      <div className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Order Interception</p>
        <h1 className="font-serif text-3xl text-stone-900 font-light tracking-wide">Cancellation And Refund Policy</h1>
        <p className="text-xs text-stone-400 italic">Last Updated: June 2026</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">01. Order Cancellation Windows</h3>
        <p className="text-sm tracking-wide">
          Because our warehouse team acts rapidly to package and seal delicate jewelry settings, orders can only be intercepted or cancelled within **2 hours** of final transaction checkout authorization.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">02. Custom/Bespoke Restrictions</h3>
        <p className="text-sm tracking-wide">
          Any customized sizings, custom initials, or bespoke metal compositions that enter physical manufacturing production stages cannot be cancelled post-purchase, as those materials are explicitly prepared to order.
        </p>
      </section>
    </main>
  );
}