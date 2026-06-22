import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#faf9f6]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="text-center max-w-xl"
      >
        <div className="flex justify-center mb-6 text-gold-500">
          <Sparkles size={32} strokeWidth={1} />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-widest uppercase mb-4 text-stone-900">
          AURA JEWELRY
        </h1>
        <p className="font-sans text-sm tracking-wide text-stone-500 uppercase mb-8">
          Finely crafted minimalist luxury portfolio piece.
        </p>
        <button className="group flex items-center gap-2 mx-auto border border-stone-900 px-6 py-3 text-xs tracking-widest uppercase hover:bg-stone-900 hover:text-white transition-all duration-300">
          Explore Collection 
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  )
}

export default App