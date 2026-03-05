import { motion } from "framer-motion";
import { Shield, Zap, Layers, Activity } from "lucide-react";

export function ShellStrengthSection() {
  const armorStats = [
    { label: "Impact Absorption", value: "99%", description: "Helicoidal structure prevents crack propagation." },
    { label: "Material Hardness", value: "Vickers 5.0", description: "Harder than most high-performance ceramics." },
    { label: "Flexural Strength", value: "Extreme", description: "Absorbs massive energy without fracturing." },
  ];

  return (
    <section className="py-24 relative bg-black/40 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse" />
            <div className="glass-panel rounded-3xl overflow-hidden border-2 border-accent/30 relative">
              <img 
                src="/images/shell-structure.png" 
                alt="Shell Structure" 
                className="w-full h-auto opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10">
                <p className="text-accent font-display text-sm uppercase tracking-widest mb-1">Structure Analysis</p>
                <h4 className="text-white font-bold">Helicoidal Bouligand Pattern</h4>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase leading-tight mb-6">
                The <span className="text-accent">Ultimate</span> <br/> Bio-Armor
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                To survive its own supersonic punch, the mantis shrimp's club is reinforced with a unique mineralized structure that researchers are now using to design better aircraft frames and body armor.
              </p>
            </div>

            <div className="grid gap-4">
              {armorStats.map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ x: 10 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-6 group hover:bg-accent/10 hover:border-accent/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    {i === 0 ? <Shield size={32} /> : i === 1 ? <Activity size={32} /> : <Layers size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-display font-bold text-white">{stat.value}</span>
                      <span className="text-xs uppercase tracking-tighter text-accent font-bold">Rating</span>
                    </div>
                    <p className="text-sm text-gray-500">{stat.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-4 text-secondary">
                <Zap size={20} className="animate-pulse" />
                <span className="text-sm font-display tracking-widest uppercase">Laboratory Tested Resilience</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}