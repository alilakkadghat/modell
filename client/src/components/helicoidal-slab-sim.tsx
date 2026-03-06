import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { RotateCcw, Eye, EyeOff, Play, Pause } from 'lucide-react';

// ─────────────────────────────────────────────
//  CONSTANTS — same geometry as HelicoidalStack3D
// ─────────────────────────────────────────────
const NUM_LAYERS      = 16;
const LAYER_ANGLE_DEG = 15;
const LAYER_W         = 155;
const LAYER_D         = 72;
const LAYER_H         = 8;
const LAYER_GAP       = 2;
const LAYER_STEP      = LAYER_H + LAYER_GAP;

interface Point2D { x: number; y: number }
interface Point3D { x: number; y: number; z: number }

function rotY(p: Point3D, a: number): Point3D {
  return { x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) };
}
function rotX(p: Point3D, a: number): Point3D {
  return { x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) };
}
function project(p: Point3D, w: number, h: number): Point2D {
  const fov = 680, camZ = 550;
  const s = fov / (fov + camZ - p.z);
  return { x: w / 2 + p.x * s, y: h / 2 + p.y * s };
}
function tf(x: number, y: number, z: number, ry: number, rx: number, w: number, h: number): Point2D {
  let p: Point3D = { x, y, z };
  p = rotY(p, ry); p = rotX(p, rx);
  return project(p, w, h);
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layerIdx: number,
  stackPos: number,
  totalVisible: number,
  ry: number, rx: number,
  w: number, h: number,
  showFibers: boolean,
  hovered: boolean
) {
  const fiberAngle = layerIdx * LAYER_ANGLE_DEG * Math.PI / 180;
  const yCenter = (stackPos - totalVisible / 2) * LAYER_STEP;
  const hw = LAYER_W / 2, hd = LAYER_D / 2;
  const yt = yCenter - LAYER_H / 2, yb = yCenter + LAYER_H / 2;

  const corners = [
    { lx: -hw, lz: -hd }, { lx: hw, lz: -hd },
    { lx: hw, lz: hd },   { lx: -hw, lz: hd },
  ].map(({ lx, lz }) => ({
    x3: lx * Math.cos(fiberAngle) - lz * Math.sin(fiberAngle),
    z3: lx * Math.sin(fiberAngle) + lz * Math.cos(fiberAngle),
  }));

  const topPts = corners.map(c => tf(c.x3, yt, c.z3, ry, rx, w, h));
  const botPts = corners.map(c => tf(c.x3, yb, c.z3, ry, rx, w, h));
  const t = layerIdx / NUM_LAYERS;
  const L = 30 + t * 10;
  const hue = hovered ? 0 : 42;
  const sat = hovered ? 80 : 48;

  // Side faces
  const sides: [number, number][] = [[0,1],[1,2],[2,3],[3,0]];
  sides.forEach(([a, b]) => {
    const ax = topPts[b].x - topPts[a].x, ay = topPts[b].y - topPts[a].y;
    const bx = botPts[a].x - topPts[a].x, by = botPts[a].y - topPts[a].y;
    if (ax * by - ay * bx < 0) return;
    ctx.beginPath();
    ctx.moveTo(topPts[a].x, topPts[a].y); ctx.lineTo(topPts[b].x, topPts[b].y);
    ctx.lineTo(botPts[b].x, botPts[b].y); ctx.lineTo(botPts[a].x, botPts[a].y);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue},${sat + (a===0?6:0)}%,${a===0?L:L-10}%)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,100,0.35)'; ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Top face
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y);
  topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  try {
    const g = ctx.createLinearGradient(topPts[0].x, topPts[0].y, topPts[2].x, topPts[2].y);
    g.addColorStop(0, `hsl(${hue},62%,${L+16}%)`);
    g.addColorStop(0.5, `hsl(${hue},58%,${L+11}%)`);
    g.addColorStop(1, `hsl(${hue},52%,${L+5}%)`);
    ctx.fillStyle = g;
  } catch { ctx.fillStyle = `hsl(${hue},58%,${L+10}%)`; }
  ctx.fill();
  ctx.strokeStyle = hovered ? 'rgba(255,80,80,0.9)' : 'rgba(255,225,130,0.55)';
  ctx.lineWidth = hovered ? 2 : 0.7; ctx.stroke();

  // Fibers
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
    ctx.strokeStyle = 'rgba(255,235,160,0.38)'; ctx.lineWidth = 0.75;
    for (let f = 0; f < 20; f++) {
      const s2 = (f/19-0.5)*80;
      ctx.beginPath();
      ctx.moveTo(fp0.x+nx*s2, fp0.y+ny*s2);
      ctx.lineTo(fp1.x+nx*s2, fp1.y+ny*s2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Glint
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y); ctx.lineTo(topPts[1].x, topPts[1].y);
  ctx.strokeStyle = hovered ? 'rgba(255,100,100,0.9)' : 'rgba(255,248,200,0.6)';
  ctx.lineWidth = hovered ? 2 : 1.1; ctx.stroke();
}

function drawStack(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  ry: number, rx: number,
  removed: Set<number>, showFibers: boolean,
  hovered: number | null,
  label: string, labelColor: string
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#020810'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(200,168,75,0.03)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

  const present = Array.from({length: NUM_LAYERS}, (_,i) => i).filter(i => !removed.has(i));
  const count = present.length;
  const integrity = count / NUM_LAYERS;

  // Depth sort
  const order = present.map((origIdx, stackPos) => {
    let p: Point3D = { x: 0, y: (stackPos - count/2) * LAYER_STEP, z: 0 };
    p = rotY(p, ry); p = rotX(p, rx);
    return { origIdx, stackPos, depth: p.z };
  }).sort((a, b) => a.depth - b.depth);

  order.forEach(({ origIdx, stackPos }) => {
    drawLayer(ctx, origIdx, stackPos, count, ry, rx, w, h, showFibers, hovered === origIdx);
  });

  // Crack line
  if (count > 0) {
    const defl = (1 - integrity) * 45;
    const col = integrity > 0.85 ? '#44ff88' : integrity > 0.6 ? '#ff9900' : '#ff3333';
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = integrity < 0.6 ? 3 : 2;
    ctx.shadowColor = col; ctx.shadowBlur = 6;
    ctx.beginPath();
    const start = tf(0, (count/2)*LAYER_STEP, 0, ry, rx, w, h);
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < count; i++) {
      const yc = (i - count/2) * LAYER_STEP;
      const cx = Math.sin(i * 0.6) * defl;
      const pt = tf(cx, yc, 0, ry, rx, w, h);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();
  }

  // Label
  ctx.fillStyle = labelColor; ctx.font = 'bold 10px Orbitron';
  ctx.textAlign = 'center'; ctx.fillText(label, w/2, 18);

  // Integrity bar
  const bw = w - 40;
  const ic = integrity > 0.85 ? '#44ff88' : integrity > 0.6 ? '#ff9900' : '#ff3333';
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(20, h-24, bw, 5);
  ctx.fillStyle = ic; ctx.fillRect(20, h-24, bw*integrity, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '8px Share Tech Mono';
  ctx.textAlign = 'left';
  ctx.fillText(`INTEGRITY ${Math.round(integrity*100)}%  ·  ${count}/${NUM_LAYERS} LAYERS`, 20, h-30);
}

export function HelicoidalSlabSim() {
  const fullRef = useRef<HTMLCanvasElement>(null);
  const modRef  = useRef<HTMLCanvasElement>(null);

  const rotYRef     = useRef(0.3);
  const tiltRef     = useRef(0.42);
  const autoRotRef  = useRef(true);
  const draggingRef = useRef(false);
  const lastMXRef   = useRef(0);
  const lastMYRef   = useRef(0);
  const rafRef      = useRef<number>(0);

  const [autoRot,       setAutoRot]       = useState(true);
  const [showFibers,    setShowFibers]    = useState(true);
  const [removedLayers, setRemovedLayers] = useState<Set<number>>(new Set());
  const [hoveredLayer,  setHoveredLayer]  = useState<number | null>(null);

  const integrity = (NUM_LAYERS - removedLayers.size) / NUM_LAYERS;

  const render = useCallback(() => {
    const fc = fullRef.current?.getContext('2d');
    const mc = modRef.current?.getContext('2d');
    const fw = fullRef.current?.width ?? 400;
    const fh = fullRef.current?.height ?? 400;
    const mw = modRef.current?.width ?? 400;
    const mh = modRef.current?.height ?? 400;
    if (fc) drawStack(fc, fw, fh, rotYRef.current, tiltRef.current, new Set(), showFibers, null, 'FULL STRUCTURE', '#44ff88');
    if (mc) drawStack(mc, mw, mh, rotYRef.current, tiltRef.current, removedLayers, showFibers, hoveredLayer, 'MODIFIED STRUCTURE', '#ff9900');
  }, [showFibers, removedLayers, hoveredLayer]);

  useEffect(() => {
    const loop = () => {
      if (autoRotRef.current) rotYRef.current += 0.007;
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    const resize = () => {
      [fullRef, modRef].forEach(ref => {
        if (!ref.current?.parentElement) return;
        ref.current.width  = ref.current.parentElement.clientWidth;
        ref.current.height = Math.max(380, ref.current.parentElement.clientHeight);
      });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const toggleLayer = (i: number) => {
    setRemovedLayers(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else if (next.size < NUM_LAYERS - 1) next.add(i);
      return next;
    });
  };

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

        <div className="text-center mb-6">
          <h2 className="text-3xl font-display font-bold uppercase tracking-widest mb-2">
            <span className="text-[#c8a84b]">Slab</span>{' '}
            <span className="text-white">Removal</span>{' '}
            <span className="text-[#7fff00]">Simulator</span>
          </h2>
          <p className="text-xs font-mono text-white/30 tracking-widest">
            REMOVE LAYERS · COMPARE STRUCTURES · OBSERVE CRACK PROPAGATION
          </p>
        </div>

        {/* Layer buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {Array.from({length: NUM_LAYERS}, (_, i) => (
            <button key={i}
              onClick={() => toggleLayer(i)}
              onMouseEnter={() => setHoveredLayer(i)}
              onMouseLeave={() => setHoveredLayer(null)}
              className={`w-10 h-10 text-xs font-bold font-mono transition-all border
                ${removedLayers.has(i)
                  ? 'bg-red-900/40 border-red-500/60 text-red-400 opacity-50 line-through'
                  : 'border-[#c8a84b]/40 text-[#c8a84b] hover:bg-[#c8a84b]/20 hover:border-[#c8a84b]'}`}
              style={{ clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)' }}
            >{i+1}</button>
          ))}
          <button onClick={() => setRemovedLayers(new Set())}
            className="w-10 h-10 border border-white/20 text-white/40 hover:text-white hover:border-white/50 flex items-center justify-center"
            style={{ clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)' }}
          ><RotateCcw size={13} /></button>
        </div>

        {/* Canvases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        >
          <Card className="bg-white/[0.03] border-[#c8a84b]/20 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(200,168,75,0.06)' }}>
            <canvas ref={fullRef} className="block w-full" height={400} />
          </Card>
          <Card className="bg-white/[0.03] border-[#ff9900]/20 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(255,153,0,0.06)' }}>
            <canvas ref={modRef} className="block w-full" height={400} />
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
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
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto text-center">
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Removed</div>
            <div className="text-2xl font-display text-red-400">{removedLayers.size}</div>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Integrity</div>
            <div className={`text-2xl font-display ${integrity > 0.85 ? 'text-[#44ff88]' : integrity > 0.6 ? 'text-orange-400' : 'text-red-400'}`}>
              {Math.round(integrity*100)}%
            </div>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">Crack Risk</div>
            <div className={`text-sm font-bold font-display mt-1 ${integrity > 0.85 ? 'text-[#44ff88]' : integrity > 0.6 ? 'text-orange-400' : 'text-red-400'}`}>
              {integrity > 0.85 ? 'LOW' : integrity > 0.6 ? 'MODERATE' : 'HIGH'}
            </div>
          </div>
        </div>

        <div className="mt-3 px-4 py-2 border border-white/5 bg-white/[0.02] flex flex-wrap gap-4 text-[11px] font-mono text-white/30">
          <span><span className="text-[#c8a84b]">HOVER</span> a layer to highlight it · <span className="text-[#c8a84b]">CLICK</span> to remove/restore · <span className="text-[#c8a84b]">DRAG</span> to rotate</span>
        </div>

      </div>
    </section>
  );
}