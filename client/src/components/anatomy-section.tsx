import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Shield, Gavel, Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <Gavel className="w-8 h-8 text-primary" />,
    title: "Raptorial Appendages",
    description: "Modified front legs that store elastic energy, allowing them to strike at speeds of 23 m/s (50 mph).",
    stat: "1,500 N",
    statLabel: "Impact Force"
  },
  {
    icon: <Eye className="w-8 h-8 text-secondary" />,
    title: "Hexnocular Vision",
    description: "The most complex eyes in the animal kingdom, capable of seeing circular polarized light and 12-16 color channels.",
    stat: "16",
    statLabel: "Color Receptors"
  },
  {
    icon: <Shield className="w-8 h-8 text-accent" />,
    title: "Impact Resistant",
    description: "Their clubs have a unique Bouligand structure (helicoidal layering) that absorbs shock and prevents cracking.",
    stat: "Multi-layer",
    statLabel: "Nano-structure"
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    title: "Cavitation Bubbles",
    description: "The strike is so fast it vaporizes water, creating cavitation bubbles that collapse with intense heat and light.",
    stat: "4,700°C",
    statLabel: "Bubble Temp"
  }
];

export function AnatomySection() {
  const [showShell, setShowShell] = useState(false);

  return (
    <section id="anatomy" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase">
            Biological <span className="text-secondary">Engineering</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Evolution has crafted a perfect predator. Every part of the Mantis Shrimp is specialized for high-speed hunting and survival.
          </p>
        </motion.div>

        {/* Interactive Shrimp Model */}
        <div className="mb-24 flex flex-col items-center">
          <div className="relative w-full max-w-4xl aspect-video bg-black/40 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
            
            {/* Shrimp Body Mockup */}
            <div className="relative w-3/4 h-3/4 flex items-center justify-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Body segment */}
                <div className="w-64 h-32 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-[100px_40px_40px_100px] relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  {/* Eye */}
                  <div className="absolute -top-4 left-8 w-12 h-12 bg-amber-400 rounded-full border-4 border-emerald-800 flex items-center justify-center">
                    <div className="w-4 h-8 bg-black rounded-full" />
                  </div>
                  
                  {/* Club/Appendage */}
                  <div className="absolute -bottom-8 left-4 w-24 h-24 bg-red-600 rounded-full border-4 border-red-800 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {showShell ? (
                        <motion.div
                          key="shell-internal"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="w-full h-full rounded-full overflow-hidden flex flex-col justify-center"
                        >
                          {/* Helicoidal internal structure view */}
                          {[...Array(6)].map((_, i) => (
                            <div 
                              key={i} 
                              className="h-2 w-full bg-white/30 border-y border-white/10" 
                              style={{ 
                                transform: `rotate(${i * 30}deg) scaleX(1.5)`,
                                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
                              }}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="shell-outer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-900 border-2 border-white/20"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Info Overlay */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-xs">
                <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest">
                  {showShell ? "Cross-Section View" : "Dactyl Club Exterior"}
                </h4>
                <p className="text-[10px] text-gray-400 uppercase leading-tight font-medium">
                  {showShell 
                    ? "Revealing the Bouligand helicoidal architecture which prevents crack propagation by twisting kinetic shockwaves."
                    : "The hard-hitting appendage capable of shattering aquarium glass and crab shells with the force of a .22 caliber bullet."}
                </p>
              </div>

              <Button 
                onClick={() => setShowShell(!showShell)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest px-6"
              >
                {showShell ? "Hide Interior" : "Scan Structure"}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Interactive Bio-Scan System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-card/50 border-white/5 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 p-3 bg-background/50 w-fit rounded-lg border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-display tracking-wide text-xl text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-xs uppercase text-muted-foreground tracking-wider mb-1">
                      {feature.statLabel}
                    </p>
                    <p className="text-2xl font-display font-bold text-white group-hover:text-glow transition-all">
                      {feature.stat}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}