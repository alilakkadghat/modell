import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Activity } from "lucide-react";

export function StressWaveVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFiring, setIsFiring] = useState(false);
  const [pressure, setPressure] = useState(0);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const elapsed = (time - startTimeRef.current) / 1000; // seconds
    const waveSpeed = 200; // pixels per second
    const radius = elapsed * waveSpeed;

    // Clear
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, width, height);

    // Draw layers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const x = (width / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Helicoidal Zone Label
    ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.fillRect(width / 2, 0, width / 2, height);
    ctx.fillStyle = '#00d4ff';
    ctx.font = '10px Orbitron';
    ctx.fillText('15° HELICOIDAL ZONE', width / 2 + 10, 20);

    if (isFiring) {
      const currentPressure = 800 * Math.exp(-elapsed * 2);
      setPressure(Math.max(0, currentPressure));

      // Draw wavefront
      const centerX = 0;
      const centerY = height / 2;

      for (let r = 0; r < 5; r++) {
        const ringRadius = radius - r * 10;
        if (ringRadius < 0) continue;

        const p = currentPressure * (1 - r * 0.2);
        let color = '#0000ff';
        if (p > 600) color = '#ff0000';
        else if (p > 400) color = '#ff6b00';
        else if (p > 200) color = '#ffff00';
        else if (p > 100) color = '#00d4ff';

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Elliptical distortion in helicoidal zone
        if (ringRadius > width / 2) {
          const stretch = 1.5;
          ctx.ellipse(centerX, centerY, ringRadius * stretch, ringRadius, 0, -Math.PI/2, Math.PI/2);
        } else {
          ctx.arc(centerX, centerY, ringRadius, -Math.PI/2, Math.PI/2);
        }
        ctx.stroke();

        // Reflections at boundaries
        for (let i = 1; i < 6; i++) {
          const boundaryX = (width / 6) * i;
          if (ringRadius > boundaryX) {
            const reflectRadius = ringRadius - boundaryX;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.arc(boundaryX - reflectRadius, centerY, reflectRadius, Math.PI/2, -Math.PI/2, true);
            ctx.stroke();
          }
        }
      }

      // Pressure readout
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Share Tech Mono';
      ctx.fillText(`${Math.round(currentPressure)} MPa`, radius + 10, centerY - 10);

      if (radius > width * 1.5) setIsFiring(false);
    }

    // Legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legendX = width - 40;
    const legendY = (height - legendHeight) / 2;

    const gradient = ctx.createLinearGradient(0, legendY, 0, legendY + legendHeight);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.25, '#ff6b00');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(0.75, '#00d4ff');
    gradient.addColorStop(1, '#0000ff');

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Orbitron';
    ctx.fillText('800', legendX + 25, legendY + 10);
    ctx.fillText('0', legendX + 25, legendY + legendHeight);
    
    ctx.save();
    ctx.translate(legendX - 10, legendY + legendHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PRESSURE (MPa)', -50, 0);
    ctx.restore();

    frameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [isFiring]);

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-[#00d4ff] mb-8 uppercase tracking-widest text-center">
          Stress Wave <span className="text-white">Propagation</span>
        </h2>
        
        <div className="flex flex-col items-center gap-8">
          <Card className="p-1 bg-white/5 border-white/10 overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={500} 
              height={300} 
              className="bg-[#020810]"
            />
          </Card>

          <Button 
            onClick={() => {
              startTimeRef.current = performance.now();
              setIsFiring(true);
            }}
            disabled={isFiring}
            className="bg-[#ff6b00] hover:bg-[#ff8533] text-white font-bold uppercase tracking-widest px-12 py-6 rounded-none skew-x-[-15deg]"
          >
            <span className="skew-x-[15deg] flex items-center gap-2">
              <Zap size={20} /> FIRE STRESS WAVE
            </span>
          </Button>

          <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
            <div className="space-y-4">
              <h4 className="text-xs font-display text-white/50 uppercase tracking-widest text-center">Standard Material</h4>
              <div className="h-32 bg-white/5 rounded border border-white/10 relative overflow-hidden">
                 {/* Mock Graph */}
                 <svg className="w-full h-full">
                    <path d="M 0 100 Q 20 20 40 100 T 80 100" fill="none" stroke="#ff0000" strokeWidth="2" />
                 </svg>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-display text-[#00d4ff] uppercase tracking-widest text-center">Helicoidal Material</h4>
              <div className="h-32 bg-white/5 rounded border border-white/10 relative overflow-hidden">
                {/* Mock Graph */}
                <svg className="w-full h-full">
                    <path d="M 0 100 Q 50 60 100 100" fill="none" stroke="#00d4ff" strokeWidth="2" />
                 </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
