export default function ReturnAndRefund() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-24 font-sans font-light text-stone-600 antialiased leading-relaxed space-y-8">
      <div className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Assurance Framework</p>
        <h1 className="font-serif text-3xl text-stone-900 font-light tracking-wide">Return And Refund Policy</h1>
        <p className="text-xs text-stone-400 italic">Last Updated: June 2026</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">01. The Return Window</h3>
        <p className="text-sm tracking-wide">
          We offer a complimentary 7-day return window from the timestamp of delivery. To maintain eligibility for an exchange or refund credit, your jewelry piece must remain completely unworn, nested inside its original anti-tarnish velvet pouch, accompanied by all intact aesthetic seals.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">02. Processing Settlement</h3>
        <p className="text-sm tracking-wide">
          Once your return package undergoes physical quality inspection at our atelier hub, your refund will be finalized within 5-7 banking cycles directly back to your secure settlement gateway account.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">03. Non-refundable Fees</h3>
        <p className="text-sm tracking-wide">
          The refundable amount excludes shipping fee if any applied during your checkout process.
        </p>
      </section>
    </main>
  );
}