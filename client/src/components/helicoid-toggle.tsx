import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { RotateCcw, Play, Pause, Layers, Zap, PlayCircle } from 'lucide-react';

// --- Geometry Settings ---
const NUM_LAYERS = 35; 
const LAYER_W = 160;
const LAYER_D = 70;
const LAYER_H = 6;
const LAYER_STEP = 8;

interface Point3D { x: number; y: number; z: number }
interface Point2D { x: number; y: number }

function rotateY(p: Point3D, a: number): Point3D {
  return { x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) };
}
function rotateX(p: Point3D, a: number): Point3D {
  return { x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) };
}
function project(p: Point3D, w: number, h: number): Point2D {
  const fov = 700, camZ = 500;
  const s = fov / (fov + camZ - p.z);
  return { x: w / 2 + p.x * s, y: h / 2 + p.y * s };
}

export function HelicoidToggleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pitchAngle, setPitchAngle] = useState(15);
  const [autoRot, setAutoRot] = useState(true);
  const [crackProgress, setCrackProgress] = useState(0);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const rotYRef = useRef(0.5);
  const tiltRef = useRef(0.4);

  // Animation logic for crack propagation
  useEffect(() => {
    let timer: any;
    if (isRunningSim) {
      if (crackProgress < NUM_LAYERS) {
        // Propagation speed depends on angle (15 deg is harder/slower)
        const speed = pitchAngle <= 15 ? 60 : 30;
        timer = setTimeout(() => setCrackProgress(prev => prev + 1), speed);
      } else {
        setIsRunningSim(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isRunningSim, crackProgress, pitchAngle]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, w, h);

    // 1. Render Layers (Back-to-Front)
    const layers = Array.from({ length: NUM_LAYERS }).map((_, i) => {
      const yPos = (i - NUM_LAYERS / 2) * LAYER_STEP;
      let p: Point3D = { x: 0, y: yPos, z: 0 };
      p = rotateY(p, rotYRef.current);
      p = rotateX(p, tiltRef.current);
      return { index: i, depth: p.z };
    }).sort((a, b) => a.depth - b.depth);

    layers.forEach(({ index }) => {
      const angleRad = (index * pitchAngle * Math.PI) / 180;
      const yCenter = (index - NUM_LAYERS / 2) * LAYER_STEP;
      const hw = LAYER_W / 2, hd = LAYER_D / 2;
      const yt = yCenter - LAYER_H / 2, yb = yCenter + LAYER_H / 2;

      const corners = [{ x: -hw, z: -hd }, { x: hw, z: -hd }, { x: hw, z: hd }, { x: -hw, z: hd }].map(c => ({
        x: c.x * Math.cos(angleRad) - c.z * Math.sin(angleRad),
        y: 0,
        z: c.x * Math.sin(angleRad) + c.z * Math.cos(angleRad)
      }));

      const topPts = corners.map(c => project(rotateX(rotateY({ ...c, y: yt }, rotYRef.current), tiltRef.current), w, h));
      const botPts = corners.map(c => project(rotateX(rotateY({ ...c, y: yb }, rotYRef.current), tiltRef.current), w, h));

      ctx.fillStyle = `hsl(42, 60%, ${25 + (index/NUM_LAYERS)*25}%)`;
      [[0,1], [1,2], [2,3], [3,0]].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(topPts[a].x, topPts[a].y); ctx.lineTo(topPts[b].x, topPts[b].y);
        ctx.lineTo(botPts[b].x, botPts[b].y); ctx.lineTo(botPts[a].x, botPts[a].y);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = `hsl(42, 75%, ${40 + (index/NUM_LAYERS)*20}%)`;
      ctx.fill();
      ctx.strokeStyle = '#e6c35c';
      ctx.lineWidth = 1; ctx.stroke();
    });

    // 2. Crack Simulation Logic
    if (crackProgress > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#ff1133';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0000';

      // Tortuosity Multiplier: Small angles force more rotation (longer path)
      const tortuosityMult = Math.max(0.8, 55 / pitchAngle); 

      for (let i = 0; i < crackProgress; i++) {
        const crackAngleRad = (i * pitchAngle * tortuosityMult * Math.PI) / 180;
        const yPos = (i - NUM_LAYERS / 2) * LAYER_STEP;
        const radius = (LAYER_D / 3.2);
        
        const crackX = Math.cos(crackAngleRad) * radius;
        const crackZ = Math.sin(crackAngleRad) * radius;
        
        const pt = project(rotateX(rotateY({ x: crackX, y: yPos, z: crackZ }, rotYRef.current), tiltRef.current), w, h);
        
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else {
          const jitter = pitchAngle < 20 ? (Math.random()-0.5)*6 : (Math.random()-0.5)*1.5;
          ctx.lineTo(pt.x + jitter, pt.y + jitter);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Data Overlays
    // Path Length Counter
    const virtualPathLength = (NUM_LAYERS * LAYER_STEP * (1 + (55 / pitchAngle))).toFixed(0);
    ctx.fillStyle = pitchAngle <= 17 ? '#44ff88' : '#ff4444';
    ctx.font = 'bold 13px Orbitron, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`PATH LENGTH: ${virtualPathLength}μm`, w - 30, h - 65);

    // Failure Resistance Meter
    const resistance = Math.max(10, 100 - (pitchAngle * 1.1));
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(w - 130, h - 50, 100, 10);
    ctx.fillStyle = pitchAngle <= 17 ? '#44ff88' : '#ff4444';
    ctx.fillRect(w - 130, h - 50, resistance, 10);
    ctx.font = '9px monospace';
    ctx.fillText("CRACK RESISTANCE", w - 30, h - 35);

    // Current Angle Label
    ctx.fillStyle = '#e6c35c';
    ctx.font = 'bold 20px Orbitron, monospace';
    ctx.fillText(`${pitchAngle}° PITCH`, w - 30, h - 85);
  }, [pitchAngle, crackProgress]);

  useEffect(() => {
    let frame: number;
    const loop = () => {
      if (autoRot) rotYRef.current += 0.005;
      const canvas = canvasRef.current;
      if (canvas) draw(canvas.getContext('2d')!, canvas.width, canvas.height);
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [autoRot, draw]);

  const runSim = () => {
    setCrackProgress(0);
    setIsRunningSim(true);
  };

  return (
    <div className="flex flex-col items-center bg-[#020810] p-6 rounded-xl border border-white/10 shadow-2xl">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[#e6c35c] font-mono text-sm tracking-widest uppercase flex items-center gap-2">
            <Layers size={16} /> Bio-Structural Analysis
          </h3>
          <p className="text-[10px] text-white/40 font-mono mt-1">Stomatopod Dactyl Club: Impact Zone</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={runSim}
             disabled={isRunningSim}
             className={`flex items-center gap-2 px-4 py-2 border transition-all font-mono text-xs
               ${isRunningSim ? 'bg-red-500/20 border-red-500 text-red-500 cursor-wait' : 'border-[#e6c35c] text-[#e6c35c] hover:bg-[#e6c35c]/10'}`}
           >
             <Zap size={14}/> {isRunningSim ? 'PROPAGATING...' : 'RUN CRACK SIM'}
           </button>
           <button onClick={() => setAutoRot(!autoRot)} className="p-2 border border-white/20 text-white/40 hover:text-white transition-colors">
             {autoRot ? <Pause size={16}/> : <Play size={16}/>}
           </button>
           <button onClick={() => { setPitchAngle(15); setCrackProgress(0); }} className="p-2 border border-white/20 text-white/40 hover:text-white transition-colors">
             <RotateCcw size={16}/>
           </button>
        </div>
      </div>

      <Card className="relative w-full bg-black/50 border-[#e6c35c]/20 overflow-hidden mb-6">
        <canvas ref={canvasRef} width={600} height={450} className="w-full h-auto" />
        <div className="absolute top-4 left-4 right-4 flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-mono text-white/40 px-1">
            <span>HELICOID (BIOLOGICAL)</span>
            <span>ORTHOGONAL (STRUCTURAL)</span>
          </div>
          <input 
            type="range" min="1" max="90" value={pitchAngle} 
            onChange={(e) => { setPitchAngle(Number(e.target.value)); setCrackProgress(0); }}
            className="w-full accent-[#e6c35c] cursor-pointer"
          />
        </div>
      </Card>

      <div className="w-full p-4 border border-white/5 bg-white/[0.02] rounded-lg">
        <p className="text-[11px] text-white/50 font-mono leading-relaxed">
          <strong className="text-[#e6c35c]">OBSERVATION:</strong> {pitchAngle <= 17 
            ? "The 15° pitch forces the crack into a high-tortuosity helical path. This maximizes energy absorption by increasing the crack surface area." 
            : "Increasing the pitch angle reduces the rotational constraint, allowing the crack to propagate vertically with significantly less resistance."}
        </p>
      </div>
    </div>
  );
}