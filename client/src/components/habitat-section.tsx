import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export function HabitatSection() {
  return (
    <section id="habitat" className="py-24 relative overflow-hidden">
      {/* Background with texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-black z-0" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 text-secondary mb-4 border border-secondary/30 px-4 py-1 rounded-full bg-secondary/10 backdrop-blur-sm">
            <MapPin size={16} />
            <span className="text-xs uppercase tracking-widest font-bold">Indo-Pacific Region</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
            Habitat & <span className="text-accent">Range</span>
          </h2>
          
          <div className="max-w-4xl mx-auto glass-panel rounded-xl overflow-hidden p-1">
             {/* Abstract Map Representation - Since we don't have a real map image, we use a styled placeholder */}
             <div className="aspect-video bg-[#0a1a2f] relative overflow-hidden rounded-lg group">
                <div className="absolute inset-0 bg-[url('/images/ocean-texture.png')] opacity-30 bg-cover" />
                
                {/* Hotspots */}
                <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-primary rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_var(--color-primary)]" />
                
                <div className="absolute top-2/3 left-2/3 w-3 h-3 bg-secondary rounded-full animate-ping delay-700" />
                <div className="absolute top-2/3 left-2/3 w-3 h-3 bg-secondary rounded-full shadow-[0_0_20px_var(--color-secondary)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/20 font-display text-4xl uppercase font-black tracking-widest rotate-[-10deg]">
                    Tropical Waters
                  </p>
                </div>
             </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
            <div className="p-6 border-l border-white/10 hover:border-primary transition-colors">
              <h4 className="text-xl font-display text-white mb-2">Coral Reefs</h4>
              <p className="text-muted-foreground text-sm">Found hiding in rock crevices and coral formations in warm, shallow waters.</p>
            </div>
            <div className="p-6 border-l border-white/10 hover:border-secondary transition-colors">
              <h4 className="text-xl font-display text-white mb-2">Burrowers</h4>
              <p className="text-muted-foreground text-sm">They construct u-shaped burrows in soft substrate to ambush prey.</p>
            </div>
            <div className="p-6 border-l border-white/10 hover:border-accent transition-colors">
              <h4 className="text-xl font-display text-white mb-2">Depth</h4>
              <p className="text-muted-foreground text-sm">Typically found at depths of 3-40 meters where light is abundant.</p>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}