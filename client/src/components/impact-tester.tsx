import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, AlertTriangle, ShieldCheck, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Crack {
  points: { x: number; y: number }[];
  opacity: number;
}

const PROJECTILES = [
  { id: 'tennis', name: 'Tennis Ball', speed: 35, radius: 20, color: '#ccff00', power: 0.1, label: '35 m/s' },
  { id: 'bullet', name: '9mm Bullet', speed: 370, radius: 4, color: '#ffd700', power: 0.6, label: '370 m/s' },
  { id: 'tungsten', name: 'Tungsten AP', speed: 1600, radius: 6, color: '#ff4444', power: 1.2, label: '1600 m/s' },
  { id: 'mantis', name: 'Mantis Club', speed: 23, radius: 15, color: '#00ff88', power: 0.8, label: '23 m/s' },
];

interface Material {
  id: string;
  name: string;
  color: string;
  opacity: number;
  hardness: string;
  modulus: string;
  toughness: string;
  density: string;
  description: string;
  behavior: 'brittle' | 'plastic' | 'metallic' | 'helicoidal' | 'foam';
}

const MATERIALS: Material[] = [
  { id: 'glass', name: 'Borosilicate Glass', color: 'rgba(200, 230, 255, 0.4)', opacity: 0.4, hardness: '6.5 GPa', modulus: '64 GPa', toughness: '0.8 MPa·m½', density: '2.2 g/cm³', behavior: 'brittle', description: 'Standard high-strength glass with brittle fracture patterns.' },
  { id: 'polycarbonate', name: 'Bulletproof Poly', color: 'rgba(255, 250, 200, 0.5)', opacity: 0.5, hardness: '0.2 GPa', modulus: '2.4 GPa', toughness: '3.0 MPa·m½', density: '1.2 g/cm³', behavior: 'plastic', description: 'Impact-resistant polymer that deforms plastically rather than shattering.' },
  { id: 'steel', name: 'Steel Plate', color: 'rgba(100, 110, 120, 0.9)', opacity: 0.9, hardness: '2.0 GPa', modulus: '200 GPa', toughness: '50 MPa·m½', density: '7.8 g/cm³', behavior: 'metallic', description: 'Dense metallic armor that forms craters and radial scoring.' },
  { id: 'dactyl', name: 'Dactyl Composite', color: 'rgba(0, 212, 255, 0.6)', opacity: 0.6, hardness: '4.5 GPa', modulus: '40 GPa', toughness: '6.0 MPa·m½', density: '2.0 g/cm³', behavior: 'helicoidal', description: 'The mantis shrimp\'s own Bouligand structure with extreme crack resistance.' },
  { id: 'aerogel', name: 'Aerogel Foam', color: 'rgba(200, 240, 255, 0.2)', opacity: 0.2, hardness: '0.01 GPa', modulus: '0.1 GPa', toughness: '0.01 MPa·m½', density: '0.1 g/cm³', behavior: 'foam', description: 'Ultra-low density material with minimal resistance to penetration.' }
];

export function ImpactTester() {
  const [activeProjectile, setActiveProjectile] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material>(MATERIALS[0]);
  const [isFiring, setIsFiring] = useState(false);
  const [projPos, setProjPos] = useState({ x: -50, y: 250 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [layerCracks, setLayerCracks] = useState<Crack[][]>([[], [], [], [], []]);
  const [showFullShatter, setShowFullShatter] = useState(false);
  const [cavitationRings, setCavitationRings] = useState<{ x: number, y: number, id: number }[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const requestRef = useRef<number>();

  const fire = (id: string) => {
    if (isFiring) return;
    const proj = PROJECTILES.find(p => p.id === id)!;
    setActiveProjectile(id);
    setIsFiring(true);
    setProjPos({ x: 50, y: 250 });
    
    let currentX = 50;
    const targetX = 600;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / (2000 / (proj.speed / 100)), 1);
      const x = 50 + (targetX - 50) * progress;
      setProjPos({ x, y: 250 });

      if (x >= 550) {
        handleImpact(proj);
        setIsFiring(false);
        return;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleImpact = (proj: any) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: Math.random(),
        x: 550,
        y: 250,
        vx: (Math.random() - 0.2) * 10 * proj.power,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: proj.color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    const isAerogel = activeMaterial.behavior === 'foam';
    const layersToHit = isAerogel ? 5 : (proj.id === 'tungsten' ? 5 : proj.id === 'bullet' ? 3 : proj.id === 'mantis' ? 2 : 0);
    
    if (layersToHit > 0 && !isAerogel) {
      setLayerCracks(prev => {
        const next = [...prev];
        for (let i = 0; i < layersToHit; i++) {
          const crackType = activeMaterial.behavior;
          const newCrack: Crack = {
            points: Array.from({ length: crackType === 'brittle' ? 12 : 6 }).map((_, j) => ({
              x: 550 + (Math.random() - 0.5) * 100 * (i + 1),
              y: 250 + (Math.random() - 0.5) * 100 * (i + 1)
            })),
            opacity: 1
          };
          next[i] = [...next[i], newCrack];
        }
        return next;
      });
    }

    if (proj.id === 'mantis') {
      const ringId = Date.now();
      setCavitationRings([{ x: 550, y: 250, id: ringId }]);
      setTimeout(() => {
        setShowFullShatter(true);
        setTimeout(() => setShowFullShatter(false), 2000);
      }, 1000);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.02
      })).filter(p => p.life > 0));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-black overflow-hidden relative min-h-[800px]">
      <div className="container mx-auto px-4">
        {/* Material Toggles */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 z-20 relative">
          {MATERIALS.map(m => (
            <Button
              key={m.id}
              variant={activeMaterial.id === m.id ? 'default' : 'outline'}
              onClick={() => {
                setActiveMaterial(m);
                setLayerCracks([[], [], [], [], []]);
              }}
              className={`rounded-full px-6 text-[10px] font-bold uppercase tracking-widest h-10 transition-all ${
                activeMaterial.id === m.id 
                  ? 'bg-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {m.name}
            </Button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls */}
          <div className="lg:w-1/4 space-y-4 z-20">
            <h3 className="text-white font-display font-bold uppercase tracking-tighter text-xl mb-6">Tactical Ballistics</h3>
            {PROJECTILES.map(p => (
              <Button
                key={p.id}
                onClick={() => fire(p.id)}
                disabled={isFiring}
                className="w-full justify-start gap-4 h-16 bg-white/5 border-white/10 hover:bg-white/10 group relative overflow-hidden"
              >
                <div className="w-2 h-full absolute left-0 top-0" style={{ backgroundColor: p.color }} />
                <div className="flex flex-col items-start">
                  <span className="text-white font-bold uppercase text-xs">{p.name}</span>
                  <span className="text-[10px] text-white/40 font-mono">{p.label}</span>
                </div>
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              onClick={() => {
                setLayerCracks([[], [], [], [], []]);
                setParticles([]);
                setCavitationRings([]);
              }}
              className="w-full mt-8 border-white/10 text-white/40 hover:text-white"
            >
              Reset Target
            </Button>
          </div>

          {/* Canvas Area */}
          <div className="lg:w-3/4 h-[600px] bg-zinc-900/50 rounded-3xl border border-white/5 relative overflow-hidden" ref={canvasRef}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
            
            {/* Target Layers */}
            <div className="absolute right-32 top-1/2 -translate-y-1/2 flex gap-4 group/target">
              <div className="absolute -top-16 left-0 right-0 pointer-events-none opacity-0 group-hover/target:opacity-100 transition-opacity">
                <Card className="bg-black/80 border-[#00d4ff]/50 p-3 backdrop-blur text-[9px] font-mono leading-tight text-[#00d4ff]">
                  <div className="font-bold uppercase mb-1">{activeMaterial.name} Info</div>
                  <div className="text-white/80">{activeMaterial.description}</div>
                </Card>
              </div>

              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-4 h-80 rounded-sm relative border"
                  style={{ 
                    backgroundColor: activeMaterial.color,
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: activeMaterial.id === 'dactyl' ? '0 0 20px rgba(0,212,255,0.2)' : 'none',
                    zIndex: 10 - i 
                  }}
                >
                  {activeMaterial.behavior === 'helicoidal' && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 4px)'
                    }} />
                  )}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {layerCracks[i]?.map((crack, ci) => (
                      <polyline
                        key={ci}
                        points={crack.points.map(p => `${p.x-550},${p.y-100}`).join(' ')}
                        fill="none"
                        stroke={activeMaterial.behavior === 'plastic' ? 'rgba(255,255,255,0.8)' : 'white'}
                        strokeWidth={activeMaterial.behavior === 'plastic' ? '4' : '1'}
                        strokeLinejoin="round"
                        opacity={crack.opacity}
                        style={{ filter: activeMaterial.behavior === 'plastic' ? 'blur(4px)' : 'none' }}
                      />
                    ))}
                  </svg>
                </motion.div>
              ))}

              {/* Material Property Badge */}
              <div className="absolute -right-48 top-0 w-40 space-y-2 pointer-events-none">
                <div className="bg-black/60 border border-white/10 p-3 rounded-xl backdrop-blur">
                  <div className="text-[8px] uppercase font-bold text-white/40 mb-2">Properties</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/60">Hardness:</span>
                      <span className="text-[#00d4ff]">{activeMaterial.hardness}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/60">Modulus:</span>
                      <span className="text-[#00d4ff]">{activeMaterial.modulus}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/60">Toughness:</span>
                      <span className="text-[#00d4ff]">{activeMaterial.toughness}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/60">Density:</span>
                      <span className="text-[#00d4ff]">{activeMaterial.density}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projectile */}
            <AnimatePresence>
              {isFiring && activeProjectile && (
                <motion.div
                  className="absolute z-50 flex items-center justify-center"
                  style={{ left: projPos.x, top: projPos.y }}
                >
                  <div className="relative">
                    <motion.div 
                      className="absolute -inset-4 blur-xl rounded-full opacity-50"
                      style={{ backgroundColor: PROJECTILES.find(p => p.id === activeProjectile)?.color }}
                    />
                    <div 
                      className="rounded-full shadow-2xl relative z-10"
                      style={{ 
                        width: PROJECTILES.find(p => p.id === activeProjectile)?.radius! * 2,
                        height: PROJECTILES.find(p => p.id === activeProjectile)?.radius! * 2,
                        backgroundColor: PROJECTILES.find(p => p.id === activeProjectile)?.color 
                      }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-white/60 uppercase tracking-widest">
                      {PROJECTILES.find(p => p.id === activeProjectile)?.label}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.life,
                  boxShadow: `0 0 10px ${p.color}`
                }}
              />
            ))}

            {/* Cavitation Rings */}
            {cavitationRings.map(ring => (
              <motion.div
                key={ring.id}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute border-2 border-cyan-400 rounded-full w-20 h-20 -ml-10 -mt-10 pointer-events-none"
                style={{ left: ring.x, top: ring.y }}
              />
            ))}

            {/* Full Screen Shatter */}
            <AnimatePresence>
              {showFullShatter && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100] bg-white flex items-center justify-center"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: "50%", 
                          y: "50%", 
                          scale: 0, 
                          rotate: 0 
                        }}
                        animate={{ 
                          x: `${Math.random() * 100}%`,
                          y: `${Math.random() * 100}%`,
                          scale: Math.random() * 3 + 1,
                          rotate: Math.random() * 720
                        }}
                        className="absolute w-20 h-20 bg-zinc-200/40 backdrop-blur-sm border border-white/50"
                        style={{
                          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
