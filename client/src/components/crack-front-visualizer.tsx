import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, RotateCcw, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CrackPoint {
  x: number;
  y: number;
}

export function CrackFrontVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    area15: 0,
    area45: 0,
    energy15: 0,
    energy45: 0,
    length15: 0,
    length45: 0,
    tips15: 0,
    tips45: 0,
    deflections15: 0,
    deflections45: 0,
  });

  const [crackPath15, setCrackPath15] = useState<CrackPoint[][]>([]);
  const [crackPath45, setCrackPath45] = useState<CrackPoint[][]>([]);

  const runSimulation = () => {
    setIsSimulating(true);
    setProgress(0);
    setCrackPath15([]);
    setCrackPath45([]);
    
    let currentProgress = 0;
    const duration = 3000; // 3 seconds
    const interval = 16;
    const steps = duration / interval;
    const stepIncrement = 1 / steps;

    const timer = setInterval(() => {
      currentProgress += stepIncrement;
      if (currentProgress >= 1) {
        clearInterval(timer);
        setIsSimulating(false);
        setProgress(1);
      } else {
        setProgress(currentProgress);
        updateMetrics(currentProgress);
      }
    }, interval);
  };

  const updateMetrics = (p: number) => {
    setMetrics({
      area15: p * 15.2,
      area45: p * 4.0,
      energy15: p * 450,
      energy45: p * 120,
      length15: p * 240,
      length45: p * 60,
      tips15: Math.floor(p * 42),
      tips45: Math.floor(p * 4) + 1,
      deflections15: Math.floor(p * 24),
      deflections45: Math.floor(p * 2),
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, w, h);

    // Split Line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('15° BOUGLIGAND', w * 0.25, 20);
    ctx.fillText('45° STANDARD', w * 0.75, 20);

    const currentY = progress * h;

    // Draw 45° Crack (Simple)
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 2;
    ctx.moveTo(w * 0.75, 0);
    for (let y = 0; y < currentY; y += 5) {
      const offsetX = Math.sin(y * 0.05) * 2;
      ctx.lineTo(w * 0.75 + offsetX, y);
    }
    ctx.stroke();

    // Draw 15° Crack (Fractal/Branching)
    if (progress > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#7fff00';
      ctx.lineWidth = 1.5;
      
      const drawBranch = (startX: number, startY: number, depth: number, angle: number) => {
        if (startY > currentY || depth > 4) return;
        
        const length = 10 + Math.random() * 10;
        const endX = startX + Math.sin(angle) * length;
        const endY = startY + Math.cos(angle) * length;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, Math.min(endY, currentY));
        
        if (endY < currentY) {
          drawBranch(endX, endY, depth + 1, angle + (Math.random() - 0.5) * 0.8);
          if (Math.random() > 0.6) {
            drawBranch(endX, endY, depth + 1, angle - (Math.random() - 0.5) * 0.8);
          }
        }
      };

      // Root crack
      ctx.moveTo(w * 0.25, 0);
      for(let i=0; i < 5; i++) {
          drawBranch(w * 0.25 + (i-2)*10, 0, 0, (Math.random()-0.5)*0.2);
      }
      ctx.stroke();
    }
  };

  useEffect(draw, [progress]);

  const MetricItem = ({ label, val15, val45, unit }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-tighter text-white/40">
        <span>{label}</span>
        <span>{unit}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-sm font-mono text-[#7fff00]">{val15.toFixed(1)}</div>
        <div className="text-sm font-mono text-[#ff6b00]">{val45.toFixed(1)}</div>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-[#7fff00]" 
          style={{ width: `${(val15 / (val15 + val45 || 1)) * 100}%` }} 
        />
        <div 
          className="h-full bg-[#ff6b00]" 
          style={{ width: `${(val45 / (val15 + val45 || 1)) * 100}%` }} 
        />
      </div>
    </div>
  );

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-white mb-12 uppercase tracking-widest text-center">
          Fracture <span className="text-[#7fff00]">Surface Analysis</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Canvas View */}
          <div className="space-y-6">
            <Card className="p-1 bg-white/5 border-white/10 overflow-hidden relative">
              <canvas ref={canvasRef} width={500} height={400} className="w-full bg-[#020810]" />
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#7fff00] rounded-full" />
                  <span className="text-[8px] text-white/60 uppercase">15°</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#ff6b00] rounded-full" />
                  <span className="text-[8px] text-white/60 uppercase">45°</span>
                </div>
              </div>
            </Card>
            <Button 
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full bg-[#00d4ff] hover:bg-[#00b8e6] text-black font-bold uppercase tracking-widest py-6"
            >
              <span className="flex items-center gap-2">
                {isSimulating ? <Activity className="animate-pulse" /> : <Play />}
                RUN FRACTURE SIMULATION
              </span>
            </Button>
          </div>

          {/* Data Readouts */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <MetricItem label="Fracture Surface Area" val15={metrics.area15} val45={metrics.area45} unit="cm²" />
              <MetricItem label="Energy Dissipated" val15={metrics.energy15} val45={metrics.energy45} unit="mJ" />
              <MetricItem label="Crack Front Length" val15={metrics.length15} val45={metrics.length45} unit="mm" />
              <MetricItem label="Active Crack Tips" val15={metrics.tips15} val45={metrics.tips45} unit="count" />
              <MetricItem label="Deflection Events" val15={metrics.deflections15} val45={metrics.deflections45} unit="events" />
            </div>

            <AnimatePresence>
              {progress === 1 && !isSimulating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-[#7fff00]/10 border border-[#7fff00]/30 rounded-xl"
                >
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="text-[#7fff00] shrink-0" size={24} />
                    <div>
                      <h4 className="text-[#7fff00] font-display font-bold uppercase text-sm mb-2">Simulation Complete</h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        The 15° Bouligand structure dissipated <span className="text-[#7fff00] font-bold">{(metrics.energy15 / metrics.energy45).toFixed(1)}x</span> more energy through <span className="text-[#7fff00] font-bold">{(metrics.area15 - metrics.area45).toFixed(1)} cm²</span> of additional fracture surface compared to standard 45° orientation.
                      </p>
                    </div>
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
