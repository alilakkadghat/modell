import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Zap, Target, Gauge, Swords, Info } from "lucide-react";
import { motion } from "framer-motion";

const SHAPES = [
  { id: 'flat', label: 'Flat', icon: '■' },
  { id: 'hemi', label: 'Hemispherical', icon: '◓' },
  { id: 'conical', label: 'Conical', icon: '▲' },
  { id: 'ogive', label: 'Ogive', icon: '⬔' }
];

const MOHS_MAP: Record<number, string> = {
  1: 'Talc', 3: 'Calcite', 5: 'Apatite', 7: 'Quartz', 9: 'Corundum', 10: 'Diamond'
};

export function CustomProjectileLab() {
  const [mass, setMass] = useState([0.1]); // kg
  const [velocity, setVelocity] = useState([300]); // m/s
  const [hardness, setHardness] = useState([5]);
  const [shape, setShape] = useState('hemi');

  const metrics = useMemo(() => {
    const m = mass[0];
    const v = velocity[0];
    const h = hardness[0];
    
    const ke = 0.5 * m * (v * v);
    const momentum = m * v;
    
    // Simplified penetration formula
    const shapeFactor = shape === 'flat' ? 0.5 : shape === 'hemi' ? 0.8 : shape === 'conical' ? 1.2 : 1.1;
    const penetration = (ke * shapeFactor * (h / 10)) / 500;
    
    let frag = "None";
    if (ke > 5000) frag = "Full Catastrophic Shatter";
    else if (ke > 2000) frag = "Partial Shatter";
    else if (ke > 500) frag = "Spider Crack";
    else if (ke > 50) frag = "Surface Stress Only";

    // Similarity to Mantis (m=0.005, v=23, h=5)
    const mantisKE = 0.5 * 0.005 * (23 * 23);
    const keRatio = Math.min(ke, mantisKE) / Math.max(ke, mantisKE);
    const hRatio = Math.min(h, 5) / Math.max(h, 5);
    const similarity = Math.round((keRatio * 0.6 + hRatio * 0.4) * 100);

    return { ke, momentum, penetration, frag, similarity, cavitation: v > 20 };
  }, [mass, velocity, hardness, shape]);

  const getRegime = (v: number) => {
    if (v < 340) return { label: "SUBSONIC", color: "text-blue-400" };
    if (v <= 400) return { label: "TRANSONIC", color: "text-yellow-400" };
    return { label: "SUPERSONIC", color: "text-red-500" };
  };

  const regime = getRegime(velocity[0]);

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-white mb-12 uppercase tracking-widest text-center">
          Ballistic <span className="text-[#ff6b00]">Design Lab</span>
        </h2>

        <div className="grid lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-xs font-display text-white/50 uppercase tracking-widest">Projectile Mass</label>
                <span className="text-sm font-mono text-[#00d4ff]">{mass[0] < 1 ? `${(mass[0] * 1000).toFixed(0)}g` : `${mass[0].toFixed(2)}kg`}</span>
              </div>
              <Slider value={mass} min={0.001} max={2} step={0.001} onValueChange={setMass} className="accent-[#00d4ff]" />
              
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-display text-white/50 uppercase tracking-widest">Impact Velocity</label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-current ${regime.color}`}>{regime.label}</span>
                </div>
                <span className="text-sm font-mono text-[#00d4ff]">{velocity[0]} m/s</span>
              </div>
              <Slider value={velocity} min={1} max={2000} step={1} onValueChange={setVelocity} className="accent-[#00d4ff]" />

              <div className="flex justify-between items-end">
                <label className="text-xs font-display text-white/50 uppercase tracking-widest">Tip Hardness (Mohs)</label>
                <span className="text-sm font-mono text-[#00d4ff]">{hardness[0]} - {MOHS_MAP[Math.round(hardness[0])] || 'Composite'}</span>
              </div>
              <Slider value={hardness} min={1} max={10} step={0.5} onValueChange={setHardness} className="accent-[#00d4ff]" />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-display text-white/50 uppercase tracking-widest block">Aero-Dynamic Profile</label>
              <div className="grid grid-cols-4 gap-4">
                {SHAPES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setShape(s.id)}
                    className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      shape === s.id ? 'bg-[#ff6b00]/20 border-[#ff6b00] text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[10px] uppercase font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1 bg-[#ff6b00] hover:bg-[#ff8533] text-white font-bold uppercase tracking-widest h-14">
                <Swords className="mr-2" size={18} /> FIRE CUSTOM PROJECTILE
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 text-white/60 hover:text-white uppercase tracking-widest h-14">
                <Target className="mr-2" size={18} /> COMPARE TO PRESETS
              </Button>
            </div>
          </div>

          {/* Preview & Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 bg-white/5 border-white/10 flex flex-col items-center justify-center relative overflow-hidden h-[240px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0%,transparent_70%)]" />
              <motion.div 
                animate={{ scale: 0.5 + mass[0] * 0.5, rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative z-10 w-24 h-24 flex items-center justify-center"
              >
                <div className="absolute inset-0 blur-2xl bg-[#00d4ff]/20 rounded-full" />
                <div className="text-6xl text-[#00d4ff] drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                  {SHAPES.find(s => s.id === shape)?.icon}
                </div>
              </motion.div>
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Prototype Rendering</div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] text-white/40 uppercase mb-1">Kinetic Energy</div>
                <div className="text-lg font-mono text-white">
                  {metrics.ke > 1000 ? `${(metrics.ke/1000).toFixed(2)} kJ` : `${metrics.ke.toFixed(1)} J`}
                </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] text-white/40 uppercase mb-1">Momentum</div>
                <div className="text-lg font-mono text-white">{metrics.momentum.toFixed(2)} <span className="text-[10px]">kg·m/s</span></div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] text-white/40 uppercase mb-1">Penetration</div>
                <div className="text-lg font-mono text-white">{metrics.penetration.toFixed(2)} <span className="text-[10px]">mm</span></div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] text-white/40 uppercase mb-1">Cavitation</div>
                <div className={`text-sm font-bold ${metrics.cavitation ? 'text-[#7fff00]' : 'text-red-500'}`}>
                  {metrics.cavitation ? 'DETECTED: YES' : 'DETECTED: NO'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase">Mantis Similarity Score</span>
                <span className="text-sm font-mono text-[#7fff00]">{metrics.similarity}% Match</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.similarity}%` }}
                  className="h-full bg-[#7fff00] shadow-[0_0_10px_rgba(127,255,0,0.5)]"
                />
              </div>
              <div className="text-[10px] text-white/60 leading-relaxed uppercase">
                Frag. Pattern: <span className="text-white font-bold">{metrics.frag}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
