import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

const stats = [
  { label: "Strike Speed", value: 95, display: "23 m/s", color: "bg-primary" },
  { label: "Vision Spectrum", value: 100, display: "UV - IR", color: "bg-secondary" },
  { label: "Shell Durability", value: 85, display: "High Impact", color: "bg-accent" },
  { label: "Aggression", value: 90, display: "Apex", color: "bg-destructive" },
];

export function StatsSection() {
  const [inView, setInView] = useState(false);

  return (
    <section id="stats" className="py-24 bg-black/30 border-y border-white/5">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white uppercase leading-tight">
            Built for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-500">
              Extreme Performance
            </span>
          </h2>
          <p className="text-lg text-gray-400 font-light border-l-2 border-secondary pl-6">
            The mantis shrimp strike is one of the fastest biological movements on Earth. 
            It happens so quickly that it's invisible to the naked eye without high-speed cameras.
          </p>
          
          <div className="space-y-6 pt-4">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm uppercase tracking-widest">
                  <span className="text-white font-bold">{stat.label}</span>
                  <span className={stat.color.replace('bg-', 'text-')}>{stat.display}</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                >
                  <Progress value={stat.value} className="h-2 bg-white/5" indicatorClassName={stat.color} />
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Visual/Interactive Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative h-[400px] flex items-center justify-center"
        >
          {/* Decorative Circles */}
          <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-12 border border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-24 border border-secondary/20 rounded-full animate-[spin_20s_linear_infinite]" />
          
          <div className="relative z-10 text-center glass-panel p-8 rounded-full aspect-square flex flex-col items-center justify-center w-64 h-64 border-2 border-white/20">
            <h3 className="text-5xl font-display font-bold text-white mb-2">50<span className="text-2xl text-primary">mph</span></h3>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Strike Velocity</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}