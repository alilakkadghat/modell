import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/mantis-hero.png"
          alt="Peacock Mantis Shrimp"
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center container px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1 px-3 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-xs uppercase tracking-[0.2em] mb-4 backdrop-blur-sm">
            Odontodactylus scyllarus
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black uppercase text-white mb-2 leading-none tracking-tight">
            Neon <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-glow">
              Striker
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto mt-6 leading-relaxed">
            The Peacock Mantis Shrimp packs the fastest punch in the animal kingdom—
            striking with the force of a .22 caliber bullet.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 flex justify-center gap-4"
        >
          <button className="px-8 py-3 bg-primary hover:bg-primary/80 text-white font-display font-bold uppercase tracking-wider rounded-none skew-x-[-10deg] transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <span className="skew-x-[10deg] inline-block">Explore Model</span>
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
}