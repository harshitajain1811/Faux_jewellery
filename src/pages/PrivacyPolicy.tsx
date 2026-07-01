export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-24 font-sans font-light text-stone-600 antialiased leading-relaxed space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Legal Framework</p>
        <h1 className="font-serif text-3xl text-stone-900 font-light tracking-wide">Privacy And Cookie Policy</h1>
        <p className="text-xs text-stone-400 italic">Last Updated: June 2026</p>
      </div>

      {/* Content Block */}
      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">01. Data Collection & Vault Protection</h3>
        <p className="text-sm tracking-wide">
          At [Aura Jewellery], we respect the exceptional nature of your personal data registry. When you navigate our digital atelier, we securely gather minimal operational points (such as shipping locations and settlement emails) exclusively to fulfill your order logistics.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg text-stone-900 font-normal">02. Cookie Registries</h3>
        <p className="text-sm tracking-wide">
          Our platform utilizes performance tokens (cookies) to sustain your Shopping Bag selections and remember your size preferences across sessions.
        </p>
      </section>
    </main>
  );
}