import React, { useRef, useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Move } from "lucide-react";

export function HelicoidalStack3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [showCrack, setShowCrack] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, w, h);

    const layers = 16;
    const layerH = 15;
    const isoAngle = Math.PI / 6;

    ctx.save();
    ctx.translate(w / 2, h / 2 + (layers * layerH) / 2);

    for (let i = 0; i < layers; i++) {
      const y = -i * layerH;
      const angle = (i * 15 + rotation) * (Math.PI / 180);
      
      // Draw layer
      ctx.beginPath();
      const lx = 100 * Math.cos(isoAngle);
      const ly = 100 * Math.sin(isoAngle);
      
      ctx.moveTo(-lx, y);
      ctx.lineTo(0, y - ly);
      ctx.lineTo(lx, y);
      ctx.lineTo(0, y + ly);
      ctx.closePath();

      ctx.fillStyle = `hsla(${i * 22}, 60%, 50%, 0.8)`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();

      // Draw fibers
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let f = -200; f < 200; f += 10) {
        ctx.beginPath();
        const fx = f * Math.cos(angle);
        const fy = f * Math.sin(angle);
        ctx.moveTo(fx - 200 * Math.sin(angle), y + fy + 200 * Math.cos(angle) * 0.5);
        ctx.lineTo(fx + 200 * Math.sin(angle), y + fy - 200 * Math.cos(angle) * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (showCrack) {
        ctx.beginPath();
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.moveTo(0, 0);
        for(let i=0; i<layers; i++) {
            const cy = -i * layerH;
            const cx = Math.sin(i * 0.5 + rotation * 0.01) * 20;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Orbitron';
    ctx.fillText(`ROT: ${Math.round(rotation % 360)}°`, 20, 30);
  };

  useEffect(() => {
    const animate = () => {
      if (!isDragging) setRotation(prev => prev + 0.5);
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [isDragging]);

  useEffect(draw, [rotation, showCrack]);

  return (
    <section className="py-24 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-[#7fff00] mb-8 uppercase tracking-widest text-center">
          3D Helicoidal <span className="text-white">Stack</span>
        </h2>

        <div className="flex flex-col items-center gap-6">
          <Card 
            className="p-1 bg-white/5 border-white/10 overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => { setIsDragging(true); setLastX(e.clientX); }}
            onMouseMove={(e) => { if(isDragging) { setRotation(prev => prev + (e.clientX - lastX)); setLastX(e.clientX); } }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <canvas ref={canvasRef} width={480} height={400} className="bg-[#020810]" />
          </Card>

          <div className="flex gap-4">
            <Button 
                variant={showCrack ? 'default' : 'outline'}
                onClick={() => setShowCrack(!showCrack)}
                className="bg-[#7fff00] text-black border-none hover:bg-[#9fff40]"
            >
              {showCrack ? "HIDE CRACK PATH" : "SHOW CRACK PATH"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
