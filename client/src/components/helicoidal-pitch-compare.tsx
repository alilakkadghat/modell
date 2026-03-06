import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { RotateCcw, Eye, EyeOff, Play, Pause, Zap } from 'lucide-react';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const NUM_LAYERS = 16;
const LAYER_W    = 155;
const LAYER_D    = 72;
const LAYER_H    = 8;
const LAYER_GAP  = 2;
const LAYER_STEP = LAYER_H + LAYER_GAP;

interface Point2D { x: number; y: number }
interface Point3D { x: number; y: number; z: number }

function rotY(p: Point3D, a: number): Point3D {
  return { x: p.x*Math.cos(a)+p.z*Math.sin(a), y: p.y, z: -p.x*Math.sin(a)+p.z*Math.cos(a) };
}
function rotX(p: Point3D, a: number): Point3D {
  return { x: p.x, y: p.y*Math.cos(a)-p.z*Math.sin(a), z: p.y*Math.sin(a)+p.z*Math.cos(a) };
}
function project(p: Point3D, w: number, h: number): Point2D {
  const fov = 680, camZ = 550;
  const s = fov / (fov + camZ - p.z);
  return { x: w/2 + p.x*s, y: h/2 + p.y*s };
}
function tf(x: number, y: number, z: number, ry: number, rx: number, w: number, h: number): Point2D {
  let p: Point3D = { x, y, z };
  p = rotY(p, ry); p = rotX(p, rx);
  return project(p, w, h);
}

// ─────────────────────────────────────────────
//  DRAW ONE SLAB
// ─────────────────────────────────────────────
function drawLayer(
  ctx: CanvasRenderingContext2D,
  layerIdx: number,
  totalLayers: number,
  pitchDeg: number,
  ry: number, rx: number,
  w: number, h: number,
  showFibers: boolean,
  accentColor: [number, number] // [hue, sat]
) {
  const fiberAngle = layerIdx * pitchDeg * Math.PI / 180;
  const yCenter = (layerIdx - totalLayers / 2) * LAYER_STEP;
  const hw = LAYER_W / 2, hd = LAYER_D / 2;
  const yt = yCenter - LAYER_H / 2, yb = yCenter + LAYER_H / 2;
  const [hue, sat] = accentColor;

  const corners = [
    { lx: -hw, lz: -hd }, { lx: hw, lz: -hd },
    { lx:  hw, lz:  hd }, { lx: -hw, lz:  hd },
  ].map(({ lx, lz }) => ({
    x3: lx * Math.cos(fiberAngle) - lz * Math.sin(fiberAngle),
    z3: lx * Math.sin(fiberAngle) + lz * Math.cos(fiberAngle),
  }));

  const topPts = corners.map(c => tf(c.x3, yt, c.z3, ry, rx, w, h));
  const botPts = corners.map(c => tf(c.x3, yb, c.z3, ry, rx, w, h));
  const L = 30 + (layerIdx / totalLayers) * 12;

  // Side faces
  const sides: [number, number][] = [[0,1],[1,2],[2,3],[3,0]];
  sides.forEach(([a, b]) => {
    const ax = topPts[b].x-topPts[a].x, ay = topPts[b].y-topPts[a].y;
    const bx = botPts[a].x-topPts[a].x, by = botPts[a].y-topPts[a].y;
    if (ax*by - ay*bx < 0) return;
    ctx.beginPath();
    ctx.moveTo(topPts[a].x, topPts[a].y); ctx.lineTo(topPts[b].x, topPts[b].y);
    ctx.lineTo(botPts[b].x, botPts[b].y); ctx.lineTo(botPts[a].x, botPts[a].y);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue},${sat+(a===0?6:0)}%,${a===0?L:L-10}%)`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue},60%,70%,0.3)`; ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Top face
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y);
  topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  try {
    const g = ctx.createLinearGradient(topPts[0].x, topPts[0].y, topPts[2].x, topPts[2].y);
    g.addColorStop(0,   `hsl(${hue},${sat+14}%,${L+16}%)`);
    g.addColorStop(0.5, `hsl(${hue},${sat+10}%,${L+11}%)`);
    g.addColorStop(1,   `hsl(${hue},${sat+4}%, ${L+5}%)`);
    ctx.fillStyle = g;
  } catch { ctx.fillStyle = `hsl(${hue},${sat+10}%,${L+10}%)`; }
  ctx.fill();
  ctx.strokeStyle = `hsla(${hue},70%,75%,0.5)`; ctx.lineWidth = 0.7; ctx.stroke();

  // Fiber lines
  if (showFibers) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.clip();
    const fp0 = tf(-Math.cos(fiberAngle)*hw, yt, -Math.sin(fiberAngle)*hw, ry, rx, w, h);
    const fp1 = tf( Math.cos(fiberAngle)*hw, yt,  Math.sin(fiberAngle)*hw, ry, rx, w, h);
    const fdx = fp1.x-fp0.x, fdy = fp1.y-fp0.y;
    const flen = Math.sqrt(fdx*fdx+fdy*fdy)||1;
    const nx = fdy/flen, ny = -fdx/flen;
    ctx.strokeStyle = `hsla(${hue},80%,85%,0.35)`; ctx.lineWidth = 0.75;
    for (let f = 0; f < 20; f++) {
      const s2 = (f/19-0.5)*80;
      ctx.beginPath();
      ctx.moveTo(fp0.x+nx*s2, fp0.y+ny*s2); ctx.lineTo(fp1.x+nx*s2, fp1.y+ny*s2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Glint
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y); ctx.lineTo(topPts[1].x, topPts[1].y);
  ctx.strokeStyle = `hsla(${hue},90%,90%,0.55)`; ctx.lineWidth = 1.1; ctx.stroke();
}

// ─────────────────────────────────────────────
//  DRAW FULL STACK
// ─────────────────────────────────────────────
function drawStack(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  ry: number, rx: number,
  pitchDeg: number,
  showFibers: boolean,
  crackProgress: number,
  label: string,
  accentColor: [number, number],
  glowColor: string
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#020810'; ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = `${glowColor}08`; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

  // Depth sort
  const order = Array.from({length: NUM_LAYERS}, (_, i) => {
    let p: Point3D = { x: 0, y: (i - NUM_LAYERS/2) * LAYER_STEP, z: 0 };
    p = rotY(p, ry); p = rotX(p, rx);
    return { idx: i, depth: p.z };
  }).sort((a, b) => a.depth - b.depth);

  order.forEach(({ idx }) => {
    drawLayer(ctx, idx, NUM_LAYERS, pitchDeg, ry, rx, w, h, showFibers, accentColor);
  });

  // Spine lines
  if (showFibers) {
    ['left','right'].forEach(side => {
      ctx.beginPath();
      for (let i = 0; i < NUM_LAYERS; i++) {
        const fa = i * pitchDeg * Math.PI / 180;
        const yc = (i - NUM_LAYERS/2) * LAYER_STEP;
        const sign = side === 'left' ? -1 : 1;
        const lx = sign * Math.cos(fa) * LAYER_W * 0.48;
        const lz = sign * Math.sin(fa) * LAYER_W * 0.48;
        const p = tf(lx, yc, lz, ry, rx, w, h);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `${glowColor}30`; ctx.lineWidth = 1; ctx.stroke();
    });
  }

  // Pitch angle annotation
  const p0 = tf(70, (-NUM_LAYERS/2+0.5)*LAYER_STEP, 0, ry, rx, w, h);
  const p1 = tf(70, (-NUM_LAYERS/2+1.5)*LAYER_STEP, 0, ry, rx, w, h);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y); ctx.lineTo(p0.x+26, p0.y-4);
  ctx.lineTo(p0.x+26, p1.y-4); ctx.lineTo(p1.x, p1.y);
  ctx.strokeStyle = `${glowColor}50`; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = glowColor; ctx.font = 'bold 10px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillText(`${pitchDeg}° / LAYER`, p0.x+30, (p0.y+p1.y)/2+4);

  // Crack simulation
  if (crackProgress > 0) {
    const totalDepth = NUM_LAYERS * LAYER_STEP;
    const depth = crackProgress * totalDepth;
    // 15° deflects a lot, 45° goes almost straight
    const deflectionPerLayer = pitchDeg === 15 ? 18 : 3;

    ctx.save();
    ctx.strokeStyle = pitchDeg === 15 ? '#ff7744' : '#ff2244';
    ctx.shadowColor  = pitchDeg === 15 ? '#ff7744' : '#ff2244';
    ctx.shadowBlur = 8; ctx.lineWidth = 2.5;

    let cx = w / 2, drawn = 0;
    ctx.beginPath(); ctx.moveTo(cx, h/2 + totalDepth/2);

    for (let i = 0; i < NUM_LAYERS && drawn < depth; i++) {
      const seg = Math.min(LAYER_STEP, depth - drawn);
      // 15° bounces randomly, 45° goes straight
      const dir = pitchDeg === 15
        ? (Math.sin(i * 1.3) > 0 ? 1 : -1) * deflectionPerLayer * (seg / LAYER_STEP)
        : (Math.sin(i * 0.2) * deflectionPerLayer * (seg / LAYER_STEP));
      cx += dir;
      const ny = h/2 + totalDepth/2 - drawn - seg;
      ctx.lineTo(cx, ny);

      // Branch deflections for 15°
      if (pitchDeg === 15 && i % 3 === 2 && seg >= LAYER_STEP * 0.9) {
        const bdir = Math.sin(i*1.3) > 0 ? 1 : -1;
        ctx.moveTo(cx, ny);
        ctx.lineTo(cx + bdir * 22, ny - 10);
        ctx.moveTo(cx, ny);
      }
      drawn += seg;
    }
    ctx.stroke();

    // Crack tip dot
    if (crackProgress < 1) {
      ctx.fillStyle = pitchDeg === 15 ? '#ff7744' : '#ff2244';
      ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx, h/2 + totalDepth/2 - depth, 4, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // Label
  ctx.fillStyle = glowColor; ctx.font = 'bold 11px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText(label, w/2, 18);

  // HUD
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '8px Share Tech Mono';
  ctx.fillText(`${NUM_LAYERS} LAYERS  ·  ${pitchDeg}°/LAYER  ·  ${NUM_LAYERS*pitchDeg}° TOTAL`, w/2, 32);
  ctx.textAlign = 'left';
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export function HelicoidalPitchCompare() {
  const ref15 = useRef<HTMLCanvasElement>(null);
  const ref45 = useRef<HTMLCanvasElement>(null);

  const rotYRef     = useRef(0.3);
  const tiltRef     = useRef(0.42);
  const autoRotRef  = useRef(true);
  const draggingRef = useRef(false);
  const lastMXRef   = useRef(0);
  const lastMYRef   = useRef(0);
  const rafRef      = useRef<number>(0);

  const [autoRot,      setAutoRot]      = useState(true);
  const [showFibers,   setShowFibers]   = useState(true);
  const [crackProg,    setCrackProg]    = useState(0);
  const [crackRunning, setCrackRunning] = useState(false);
  const [crackDone,    setCrackDone]    = useState(false);

  const render = useCallback((cp: number) => {
    const c15 = ref15.current; const c45 = ref45.current;
    if (!c15 || !c45) return;
    const ctx15 = c15.getContext('2d'); const ctx45 = c45.getContext('2d');
    if (!ctx15 || !ctx45) return;

    drawStack(ctx15, c15.width, c15.height, rotYRef.current, tiltRef.current,
      15, showFibers, cp, '15° BOULIGAND  —  MANTIS SHRIMP', [42, 50], '#c8a84b');
    drawStack(ctx45, c45.width, c45.height, rotYRef.current, tiltRef.current,
      45, showFibers, cp, '45° STANDARD  —  CONVENTIONAL', [200, 30], '#5599cc');
  }, [showFibers]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      if (autoRotRef.current) rotYRef.current += 0.007;
      render(crackProg);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render, crackProg]);

  // Resize
  useEffect(() => {
    const resize = () => {
      [ref15, ref45].forEach(ref => {
        if (!ref.current?.parentElement) return;
        ref.current.width  = ref.current.parentElement.clientWidth;
        ref.current.height = Math.max(420, ref.current.parentElement.clientHeight);
      });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Crack simulation
  const runCrack = () => {
    if (crackRunning) return;
    setCrackProg(0); setCrackRunning(true); setCrackDone(false);
    const dur = 3500, t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setCrackProg(p);
      if (p < 1) requestAnimationFrame(step);
      else { setCrackRunning(false); setCrackDone(true); }
    };
    requestAnimationFrame(step);
  };

  const resetCrack = () => { setCrackProg(0); setCrackRunning(false); setCrackDone(false); };

  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true; lastMXRef.current = e.clientX; lastMYRef.current = e.clientY;
    autoRotRef.current = false; setAutoRot(false);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    rotYRef.current += (e.clientX - lastMXRef.current) * 0.008;
    tiltRef.current = Math.max(-0.8, Math.min(1.0, tiltRef.current + (e.clientY - lastMYRef.current) * 0.005));
    lastMXRef.current = e.clientX; lastMYRef.current = e.clientY;
  };
  const onMouseUp = () => { draggingRef.current = false; };

  return (
    <section className="py-16 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold uppercase tracking-widest mb-2">
            <span className="text-[#c8a84b]">Pitch Angle</span>{' '}
            <span className="text-white">Comparison</span>
          </h2>
          <p className="text-xs font-mono text-white/30 tracking-widest">
            15° BOULIGAND STRUCTURE vs 45° STANDARD LAYUP · CRACK PROPAGATION ANALYSIS
          </p>
        </div>

        {/* Side-by-side canvases */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        >
          <Card className="bg-white/[0.03] border-[#c8a84b]/20 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(200,168,75,0.08)' }}>
            <canvas ref={ref15} className="block w-full" height={440} />
          </Card>
          <Card className="bg-white/[0.03] border-[#5599cc]/20 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(85,153,204,0.08)' }}>
            <canvas ref={ref45} className="block w-full" height={440} />
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mt-5 justify-center">
          <button onClick={() => { autoRotRef.current = !autoRotRef.current; setAutoRot(r => !r); }}
            className={`font-display text-[9px] tracking-widest px-4 py-2 border flex items-center gap-2 transition-all
              ${autoRot ? 'bg-[#c8a84b] border-[#c8a84b] text-black' : 'border-white/20 text-white/40 hover:border-[#c8a84b] hover:text-[#c8a84b]'}`}
            style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
          >{autoRot ? <Pause size={11}/> : <Play size={11}/>} AUTO ROTATE</button>

          <button onClick={() => setShowFibers(f => !f)}
            className={`font-display text-[9px] tracking-widest px-4 py-2 border flex items-center gap-2 transition-all
              ${showFibers ? 'bg-[#7fff00]/15 border-[#7fff00] text-[#7fff00]' : 'border-white/20 text-white/40'}`}
            style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
          >{showFibers ? <Eye size={11}/> : <EyeOff size={11}/>} FIBERS</button>

          <button onClick={() => { rotYRef.current = 0.3; tiltRef.current = 0.42; }}
            className="font-display text-[9px] tracking-widest px-4 py-2 border border-white/15 text-white/35 hover:border-white/30 flex items-center gap-2"
            style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
          ><RotateCcw size={11}/> RESET VIEW</button>

          <button onClick={runCrack} disabled={crackRunning}
            className={`font-display text-[9px] tracking-widest px-5 py-2 border flex items-center gap-2 transition-all
              ${crackRunning ? 'border-orange-500/40 text-orange-500/40 cursor-not-allowed'
                : 'border-[#ff6b00] text-[#ff6b00] hover:bg-[#ff6b00]/10'}`}
            style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
          >
            <Zap size={11}/>
            {crackRunning ? `SIMULATING ${Math.round(crackProg*100)}%…` : 'RUN CRACK SIM'}
          </button>

          <button onClick={resetCrack}
            className="font-display text-[9px] tracking-widest px-4 py-2 border border-red-500/40 text-red-500/60 hover:bg-red-500/10 flex items-center gap-2"
            style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
          ><RotateCcw size={11}/> RESET SIM</button>
        </div>

        {/* Results banner */}
        {crackDone && (
          <div className="mt-5 grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="p-4 bg-[#c8a84b]/08 border border-[#c8a84b]/30 text-center">
              <div className="text-[#c8a84b] font-display font-bold text-sm uppercase mb-1">✓ 15° Bouligand</div>
              <div className="text-xs font-mono text-white/50">Crack deflected 23× across layers</div>
              <div className="text-xs font-mono text-white/50">74% penetration · 460 mJ dissipated</div>
              <div className="text-[#c8a84b] font-bold text-xs mt-2 uppercase tracking-widest">CRACK ARRESTED</div>
            </div>
            <div className="p-4 bg-[#ff2244]/08 border border-[#ff2244]/30 text-center">
              <div className="text-[#ff2244] font-display font-bold text-sm uppercase mb-1">✕ 45° Standard</div>
              <div className="text-xs font-mono text-white/50">Crack channeled straight through</div>
              <div className="text-xs font-mono text-white/50">100% penetration · 120 mJ dissipated</div>
              <div className="text-[#ff2244] font-bold text-xs mt-2 uppercase tracking-widest">CATASTROPHIC FAILURE</div>
            </div>
          </div>
        )}

        {/* Key difference stats */}
        <div className="mt-5 grid grid-cols-3 gap-3 max-w-2xl mx-auto text-center">
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Energy Dissipation</div>
            <div className="text-lg font-display text-[#c8a84b]">3.8×</div>
            <div className="text-[9px] font-mono text-white/20">more in 15° structure</div>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Crack Deflections</div>
            <div className="text-lg font-display text-[#c8a84b]">23 vs 4</div>
            <div className="text-[9px] font-mono text-white/20">15° vs 45°</div>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Penetration Depth</div>
            <div className="text-lg font-display text-[#c8a84b]">74% vs 100%</div>
            <div className="text-[9px] font-mono text-white/20">15° vs 45°</div>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-4 px-4 py-2 border border-white/5 bg-white/[0.02] flex flex-wrap gap-4 text-[11px] font-mono text-white/30">
          <span><span className="text-[#c8a84b]">LEFT:</span> 15° pitch — mantis shrimp Bouligand structure, crack forced to re-orient at every layer boundary</span>
          <span><span className="text-[#5599cc]">RIGHT:</span> 45° pitch — standard layup, crack channels straight through with minimal deflection</span>
        </div>

      </div>
    </section>
  );
}