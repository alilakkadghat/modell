import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, FastForward } from "lucide-react";

export function CavitationLifecycle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, w, h);

    const stages = [
      { name: "NUCLEATION", label: "Low pressure zone forms" },
      { name: "GROWTH", label: "Rapid expansion to vapor threshold" },
      { name: "MAXIMUM", label: "3.5 kPa Vapor Threshold" },
      { name: "COLLAPSE", label: "Violent implosion & shockwave" },
      { name: "SECONDARY", label: "Additional ~400-600 N force" }
    ];

    // Draw timeline background
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, h - 40);
    ctx.lineTo(w, h - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    stages.forEach((s, i) => {
      const x = (w / 5) * i + (w / 10);
      ctx.fillStyle = progress * 5 > i ? '#00d4ff' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(x, h - 40, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = '8px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, x, h - 25);
    });

    const currentX = progress * w;
    const centerY = h / 2 - 20;

    // Animation Logic
    if (progress < 0.2) { // Stage 1
      ctx.beginPath();
      ctx.arc(w/10, centerY, 3, 0, Math.PI*2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,212,255,0.3)';
      ctx.stroke();
    } else if (progress < 0.4) { // Stage 2
      const r = (progress - 0.2) * 5 * 40;
      ctx.beginPath();
      ctx.arc(w/5 + w/10, centerY, r, 0, Math.PI*2);
      ctx.strokeStyle = '#00d4ff';
      ctx.stroke();
    } else if (progress < 0.6) { // Stage 3
      ctx.beginPath();
      const grad = ctx.createRadialGradient(2*w/5 + w/10, centerY, 0, 2*w/5 + w/10, centerY, 40);
      grad.addColorStop(0, '#020810');
      grad.addColorStop(1, '#00d4ff');
      ctx.fillStyle = grad;
      ctx.arc(2*w/5 + w/10, centerY, 40, 0, Math.PI*2);
      ctx.fill();
    } else if (progress < 0.8) { // Stage 4
      const r = 40 - (progress - 0.6) * 5 * 40;
      ctx.beginPath();
      ctx.arc(3*w/5 + w/10, centerY, Math.max(0, r), 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Shockwaves
      for(let i=0; i<3; i++) {
        ctx.beginPath();
        ctx.arc(3*w/5 + w/10, centerY, (progress-0.6)*5*100 + i*20, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(0,212,255,${1-(progress-0.6)*5})`;
        ctx.stroke();
      }
    } else { // Stage 5
        ctx.beginPath();
        ctx.arc(4*w/5 + w/10, centerY, (progress-0.8)*5*100, 0, Math.PI*2);
        ctx.strokeStyle = '#ff6b00';
        ctx.stroke();
    }
  };

  useEffect(() => {
    let frame: number;
    if (isPlaying) {
      const step = () => {
        setProgress(prev => {
          const next = prev + (0.002 * speed);
          return next >= 1 ? 0 : next;
        });
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed]);

  useEffect(draw, [progress]);

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-[#ff6b00] mb-8 uppercase tracking-widest text-center">
          Cavitation <span className="text-white">Lifecycle</span>
        </h2>

        <div className="flex flex-col items-center gap-6">
          <Card className="p-1 bg-white/5 border-white/10 overflow-hidden relative">
            <canvas ref={canvasRef} width={500} height={320} className="bg-[#020810]" />
          </Card>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setIsPlaying(!isPlaying)} className="border-white/10 text-white">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <div className="flex gap-2">
              {[0.5, 1, 2].map(s => (
                <Button 
                  key={s} 
                  variant={speed === s ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSpeed(s)}
                  className="text-xs"
                >
                  {s}x
                </Button>
              ))}
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={progress} 
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="w-48 accent-[#ff6b00]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
