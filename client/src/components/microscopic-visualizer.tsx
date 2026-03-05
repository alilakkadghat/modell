import React, { useRef, useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, Activity, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MicroscopicVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [depth, setDepth] = useState(0);
  const [isStriking, setIsStriking] = useState(false);
  const [impactProgress, setImpactProgress] = useState(0);
  const frameRef = useRef<number>();

  const triggerImpact = () => {
    if (isStriking) return;
    setIsStriking(true);
    setImpactProgress(0);
    
    let start = performance.now();
    const animate = (time: number) => {
      const elapsed = time - start;
      const p = Math.min(elapsed / 1000, 1);
      setImpactProgress(p);
      
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setIsStriking(false);
          setImpactProgress(0);
        }, 500);
      }
    };
    requestAnimationFrame(animate);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const center = { x: w / 2, y: h / 2 };
    const radius = 150;

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Circular Clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.clip();

    // SEM Texture Noise
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }

    const angle = (depth * 0.5) * (Math.PI / 180);
    const fiberWidth = 40;
    const fiberHeight = 12;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    // Draw Fiber Bundles
    for (let row = -10; row < 10; row++) {
      for (let col = -5; col < 5; col++) {
        const x = col * (fiberWidth + 10) + (row % 2 === 0 ? 0 : fiberWidth / 2);
        const y = row * (fiberHeight + 4);

        // Impact animations
        let dx = 0;
        let dy = 0;
        let showDebond = false;

        if (isStriking) {
          // Mineral crystal sliding
          dx = Math.sin(impactProgress * Math.PI) * 3 * (Math.random() > 0.5 ? 1 : -1);
          // Debonding
          if (impactProgress > 0.2 && impactProgress < 0.8) showDebond = true;
        }

        // Fiber
        ctx.beginPath();
        ctx.ellipse(x + dx, y + dy, fiberWidth / 2, fiberHeight / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (showDebond) {
          ctx.strokeStyle = '#ffffffaa';
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Highlights
        ctx.beginPath();
        ctx.ellipse(x + dx, y - 2 + dy, fiberWidth / 3, fiberHeight / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
      }
    }

    // Inter-layer delamination
    if (isStriking && impactProgress > 0.4) {
      const gap = Math.sin((impactProgress - 0.4) * Math.PI) * 20;
      ctx.fillStyle = '#ffffff11';
      ctx.fillRect(-w, -gap/2, w*2, gap);
      
      // Crack bridging fibers
      ctx.strokeStyle = '#ffffff66';
      ctx.lineWidth = 0.5;
      for(let i = -150; i < 150; i += 20) {
          if (Math.abs(i) % 40 !== 0 || impactProgress < 0.8) {
              ctx.beginPath();
              ctx.moveTo(i, -gap/2);
              ctx.quadraticCurveTo(i + 5, 0, i, gap/2);
              ctx.stroke();
          }
      }
    }

    ctx.restore();

    // Energy Flash
    if (isStriking && impactProgress > 0.3 && impactProgress < 0.6) {
      const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 100);
      grad.addColorStop(0, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Vignette
    const vignette = ctx.createRadialGradient(center.x, center.y, radius * 0.7, center.x, center.y, radius);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();

    // Crosshair
    ctx.strokeStyle = 'rgba(127, 255, 0, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(center.x - 20, center.y); ctx.lineTo(center.x + 20, center.y);
    ctx.moveTo(center.x, center.y - 20); ctx.lineTo(center.x, center.y + 20);
    ctx.stroke();
    ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  };

  useEffect(() => {
    draw();
  }, [depth, impactProgress]);

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-white mb-12 uppercase tracking-widest text-center">
          Nano-Scale <span className="text-[#00d4ff]">Microscopy</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="relative flex justify-center">
            {/* SEM Viewport */}
            <div className="relative w-[340px] h-[340px] rounded-full border-4 border-white/10 p-2 bg-[#111] shadow-[0_0_50px_rgba(0,0,0,1)]">
              <canvas 
                ref={canvasRef} 
                width={320} 
                height={320} 
                className="rounded-full cursor-crosshair"
              />
              
              {/* Overlays */}
              <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between font-mono text-[#7fff00aa] text-[10px] uppercase">
                <div className="flex justify-between">
                  <span>×12,000 MAGNIFICATION</span>
                  <span>STG: X: 0.00 μm Y: 0.00 μm</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                      <div className="w-12 h-0.5 bg-[#7fff00aa]" />
                      <span>2 μm</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#00d4ff] font-bold">DEPTH: {depth} nm</div>
                    <div>ROT: {Math.round(depth * 0.5)}°</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="p-6 bg-white/5 border-white/10 space-y-6">
              <div>
                <label className="text-xs font-display text-white/50 uppercase tracking-widest block mb-4">Focus Depth (Z-Axis)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="720" 
                  value={depth} 
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-full accent-[#00d4ff]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={triggerImpact}
                  disabled={isStriking}
                  className="bg-[#00d4ff] hover:bg-[#00b8e6] text-black font-bold uppercase tracking-widest h-14"
                >
                  <Activity className={`mr-2 ${isStriking ? 'animate-ping' : ''}`} size={18} />
                  TRIGGER IMPACT EVENT
                </Button>
              </div>

              <div className="space-y-3 text-[10px] text-white/40 uppercase font-mono">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isStriking ? 'bg-[#7fff00] animate-pulse' : 'bg-white/20'}`} />
                  <span>Fiber-Matrix Debonding Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isStriking ? 'bg-[#7fff00] animate-pulse' : 'bg-white/20'}`} />
                  <span>Mineral Crystal Sliding Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isStriking ? 'bg-[#7fff00] animate-pulse' : 'bg-white/20'}`} />
                  <span>Energy Dissipation Mapping</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Scanning Electron Microscopy reveals how individual hydroxyapatite fibers slide and debond during impact, converting kinetic energy into heat and preventing crack growth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
