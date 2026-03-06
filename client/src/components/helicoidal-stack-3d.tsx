import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Pause, Eye, EyeOff } from 'lucide-react';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Point2D { x: number; y: number }
interface Point3D { x: number; y: number; z: number }
type TabMode    = 'spiral' | 'compare';
type CrackPhase = 'idle' | 'running' | 'done';

// ─────────────────────────────────────────────
//  CONSTANTS — SPIRAL TAB
// ─────────────────────────────────────────────
const NUM_LAYERS      = 28;
const LAYER_ANGLE_DEG = 15;
const LAYER_W         = 155;
const LAYER_D         = 72;
const LAYER_H         = 8;
const LAYER_GAP       = 2;
const LAYER_STEP      = LAYER_H + LAYER_GAP;

// ─────────────────────────────────────────────
//  CONSTANTS — COMPARE TAB
// ─────────────────────────────────────────────
// Carbon fiber flat stack (left panel)
const CF_STACK_LAYERS = 20;
const CF_LAYER_W      = 100;   // narrower to fit left half
const CF_LAYER_D      = 32;
const CF_LAYER_H      = 7;     // thinner layers so stack fits in canvas height
const CF_LAYER_GAP    = 1;
const CF_STEP         = CF_LAYER_H + CF_LAYER_GAP;

// Helicoidal mini-spiral (right panel)
const HEL_LAYERS      = 24;
const HEL_ANGLE_DEG   = 15;
const HEL_W           = 72;    // small enough to fit right half-panel
const HEL_D           = 36;
const HEL_H           = 7;
const HEL_GAP         = 1;
const HEL_STEP        = HEL_H + HEL_GAP;

// Fixed crack deflection array — 32 values, pre-seeded
const HEL_DEFLECTIONS: number[] = [
  8, -14, 20, -9, 16, -22, 11, -18, 24, -7,
  19, -25, 13, -16, 21, -10, 17, -23, 8, -19,
  15, -12, 22, -8, 18, -20, 14, -17, 9, -21, 16, -13,
];
const BRANCH_INDICES = new Set([3, 6, 9, 12, 15, 18, 21]);

// ─────────────────────────────────────────────
//  MATH HELPERS
// ─────────────────────────────────────────────
function rotY3(p: Point3D, a: number): Point3D {
  return { x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) };
}
function rotX3(p: Point3D, a: number): Point3D {
  return { x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) };
}
function project3(p: Point3D, cx: number, cy: number): Point2D {
  const fov = 320, camZ = 700;  // wider FOV + further camera = zoomed-out look
  const s = fov / (fov + camZ - p.z);
  return { x: cx + p.x * s, y: cy + p.y * s };
}
function transform3D(
  x: number, y: number, z: number,
  ry: number, rx: number,
  cx: number, cy: number,
): Point2D {
  let p: Point3D = { x, y, z };
  p = rotY3(p, ry);
  p = rotX3(p, rx);
  return project3(p, cx, cy);
}
// Oblique projection for CF flat stack
function oblique(lx: number, ly: number, lz: number, ox: number): Point2D {
  const a = 28 * Math.PI / 180;
  return { x: ox + lx + lz * Math.cos(a) * 0.5, y: ly - lz * Math.sin(a) * 0.5 };
}

// ─────────────────────────────────────────────
//  DRAW: ONE SLAB in 3D spiral
//  cx/cy = canvas centre for this sub-panel
//  Returns projected top-face centre for crack anchoring
// ─────────────────────────────────────────────
function drawHelSlab(
  ctx: CanvasRenderingContext2D,
  layerIdx: number,
  totalLayers: number,
  ry: number,    // horizontal rotation
  rx: number,    // tilt
  cx: number,    // sub-panel centre x
  cy: number,    // sub-panel centre y
  showFibers: boolean,
  gold = false,  // true → gold palette; false → rainbow
): Point2D {
  const fiberAngle = layerIdx * HEL_ANGLE_DEG * Math.PI / 180;
  const yCenter    = (layerIdx - totalLayers / 2) * HEL_STEP;
  const hw = HEL_W / 2;
  const hd = HEL_D / 2;
  const yt = yCenter - HEL_H / 2;
  const yb = yCenter + HEL_H / 2;

  const localCorners = [
    { lx: -hw, lz: -hd },
    { lx:  hw, lz: -hd },
    { lx:  hw, lz:  hd },
    { lx: -hw, lz:  hd },
  ].map(({ lx, lz }) => ({
    x3: lx * Math.cos(fiberAngle) - lz * Math.sin(fiberAngle),
    z3: lx * Math.sin(fiberAngle) + lz * Math.cos(fiberAngle),
  }));

  const topPts = localCorners.map(c => transform3D(c.x3, yt, c.z3, ry, rx, cx, cy));
  const botPts = localCorners.map(c => transform3D(c.x3, yb, c.z3, ry, rx, cx, cy));

  const t = layerIdx / totalLayers;
  // Gold for spiral tab, rainbow for compare right panel
  const faceLight = gold ? 30 + t * 12 : undefined;
  const hue       = gold ? 42 : (t * 300 + 20);
  const sat       = gold ? 58 : 65;
  const topL      = gold ? (faceLight! + 14) : 44;
  const sideL     = gold ? faceLight! : 30;

  // Side faces (back-face cull)
  const sides: [number, number][] = [[0,1],[1,2],[2,3],[3,0]];
  sides.forEach(([a, b]) => {
    const ax = topPts[b].x - topPts[a].x, ay = topPts[b].y - topPts[a].y;
    const bx = botPts[a].x - topPts[a].x, by = botPts[a].y - topPts[a].y;
    if (ax * by - ay * bx < 0) return;
    ctx.beginPath();
    ctx.moveTo(topPts[a].x, topPts[a].y);
    ctx.lineTo(topPts[b].x, topPts[b].y);
    ctx.lineTo(botPts[b].x, botPts[b].y);
    ctx.lineTo(botPts[a].x, botPts[a].y);
    ctx.closePath();
    const isFront = a === 0;
    ctx.fillStyle = `hsl(${hue},${sat - (isFront ? 0 : 8)}%,${isFront ? sideL : sideL - 10}%)`;
    ctx.fill();
    ctx.strokeStyle = gold ? 'rgba(255,215,100,0.3)' : `hsla(${hue},60%,55%,0.25)`;
    ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Top face
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y);
  topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  try {
    const g = ctx.createLinearGradient(topPts[0].x, topPts[0].y, topPts[2].x, topPts[2].y);
    if (gold) {
      g.addColorStop(0,   `hsl(42,62%,${topL + 4}%)`);
      g.addColorStop(0.5, `hsl(42,58%,${topL}%)`);
      g.addColorStop(1,   `hsl(42,52%,${topL - 6}%)`);
    } else {
      g.addColorStop(0,   `hsla(${hue},68%,${topL + 12}%,0.95)`);
      g.addColorStop(0.5, `hsla(${hue},65%,${topL + 6}%,0.95)`);
      g.addColorStop(1,   `hsla(${hue},60%,${topL}%,0.95)`);
    }
    ctx.fillStyle = g;
  } catch {
    ctx.fillStyle = gold ? `hsl(42,58%,${topL}%)` : `hsla(${hue},65%,${topL}%,0.92)`;
  }
  ctx.fill();
  ctx.strokeStyle = gold ? 'rgba(255,225,130,0.5)' : `hsla(${hue},70%,65%,0.4)`;
  ctx.lineWidth = 0.7; ctx.stroke();

  // Fiber lines clipped to top face
  if (showFibers) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.clip();
    const fp0 = transform3D(-Math.cos(fiberAngle) * hw, yt, -Math.sin(fiberAngle) * hw, ry, rx, cx, cy);
    const fp1 = transform3D( Math.cos(fiberAngle) * hw, yt,  Math.sin(fiberAngle) * hw, ry, rx, cx, cy);
    const fdx = fp1.x - fp0.x, fdy = fp1.y - fp0.y;
    const flen = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
    const nx = fdy / flen, ny = -fdx / flen;
    ctx.strokeStyle = gold ? 'rgba(255,235,160,0.38)' : `hsla(${hue},80%,85%,0.35)`;
    ctx.lineWidth = 0.7;
    for (let f = 0; f < 16; f++) {
      const s2 = (f / 15 - 0.5) * 65;
      ctx.beginPath();
      ctx.moveTo(fp0.x + nx * s2, fp0.y + ny * s2);
      ctx.lineTo(fp1.x + nx * s2, fp1.y + ny * s2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Top-edge glint
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y); ctx.lineTo(topPts[1].x, topPts[1].y);
  ctx.strokeStyle = gold ? 'rgba(255,248,200,0.6)' : `hsla(${hue},90%,85%,0.5)`;
  ctx.lineWidth = 1; ctx.stroke();

  // Spine connections every 3rd layer
  if (layerIdx % 3 === 0 && layerIdx > 0 && showFibers) {
    const prevAngle = (layerIdx - 3) * HEL_ANGLE_DEG * Math.PI / 180;
    const prevY     = ((layerIdx - 3) - totalLayers / 2) * HEL_STEP - HEL_H / 2;
    const prevRight = transform3D(Math.cos(prevAngle) * hw * 0.9, prevY, Math.sin(prevAngle) * hw * 0.9, ry, rx, cx, cy);
    const currRight = transform3D(Math.cos(fiberAngle) * hw * 0.9, yt,   Math.sin(fiberAngle) * hw * 0.9, ry, rx, cx, cy);
    ctx.beginPath(); ctx.moveTo(prevRight.x, prevRight.y); ctx.lineTo(currRight.x, currRight.y);
    ctx.strokeStyle = gold ? 'rgba(200,168,75,0.22)' : `hsla(${hue},60%,60%,0.22)`;
    ctx.lineWidth = 0.8; ctx.stroke();
  }

  // Return projected top-face centre
  return {
    x: (topPts[0].x + topPts[1].x + topPts[2].x + topPts[3].x) / 4,
    y: (topPts[0].y + topPts[1].y + topPts[2].y + topPts[3].y) / 4,
  };
}

// ─────────────────────────────────────────────
//  DRAW: ONE CF FLAT STACK LAYER (left panel)
// ─────────────────────────────────────────────
function drawCFLayer(
  ctx: CanvasRenderingContext2D,
  layerIdx: number,
  originX: number,
  baseY: number,
): Point2D {
  const yTop = baseY - layerIdx * CF_STEP;
  const yBot = yTop + CF_LAYER_H;
  const hw   = CF_LAYER_W / 2;

  const corners = [
    { lx: -hw, lz: 0 },
    { lx:  hw, lz: 0 },
    { lx:  hw, lz: CF_LAYER_D },
    { lx: -hw, lz: CF_LAYER_D },
  ];
  const tPts = corners.map(c => oblique(c.lx, yTop, c.lz, originX));
  const bPts = corners.map(c => oblique(c.lx, yBot, c.lz, originX));
  const L    = 18 + layerIdx * 2;

  // Front side face
  ctx.beginPath();
  ctx.moveTo(tPts[0].x, tPts[0].y); ctx.lineTo(tPts[1].x, tPts[1].y);
  ctx.lineTo(bPts[1].x, bPts[1].y); ctx.lineTo(bPts[0].x, bPts[0].y);
  ctx.closePath();
  ctx.fillStyle = `hsl(220,14%,${L}%)`; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5; ctx.stroke();

  // Right side face
  ctx.beginPath();
  ctx.moveTo(tPts[1].x, tPts[1].y); ctx.lineTo(tPts[2].x, tPts[2].y);
  ctx.lineTo(bPts[2].x, bPts[2].y); ctx.lineTo(bPts[1].x, bPts[1].y);
  ctx.closePath();
  ctx.fillStyle = `hsl(220,12%,${L - 6}%)`; ctx.fill(); ctx.stroke();

  // Top face
  ctx.beginPath();
  tPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = `hsl(220,18%,${L + 10}%)`; ctx.fill();
  ctx.strokeStyle = 'rgba(180,190,210,0.22)'; ctx.lineWidth = 0.6; ctx.stroke();

  // Fiber lines (all at 0° — CF unidirectional)
  ctx.save();
  ctx.beginPath();
  tPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath(); ctx.clip();
  const fp0 = oblique(-hw, yTop, CF_LAYER_D * 0.5, originX);
  const fp1 = oblique( hw, yTop, CF_LAYER_D * 0.5, originX);
  const fdx = fp1.x - fp0.x, fdy = fp1.y - fp0.y;
  const flen = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
  const nx = -fdy / flen, ny = fdx / flen;
  ctx.strokeStyle = 'rgba(160,175,210,0.55)'; ctx.lineWidth = 0.7;
  for (let f = 0; f < 18; f++) {
    const s2 = (f / 17 - 0.5) * 90;
    ctx.beginPath();
    ctx.moveTo(fp0.x + nx * s2 - fdx * 0.15, fp0.y + ny * s2 - fdy * 0.15);
    ctx.lineTo(fp1.x + nx * s2 + fdx * 0.15, fp1.y + ny * s2 + fdy * 0.15);
    ctx.stroke();
  }
  ctx.restore();

  // Highlight
  ctx.beginPath();
  ctx.moveTo(tPts[0].x, tPts[0].y); ctx.lineTo(tPts[1].x, tPts[1].y);
  ctx.strokeStyle = 'rgba(220,230,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();

  // Layer number every 4
  if (layerIdx % 4 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '7px Share Tech Mono'; ctx.textAlign = 'center';
    ctx.fillText(String(layerIdx + 1), (bPts[0].x + bPts[1].x) / 2, (bPts[0].y + bPts[1].y) / 2 - 1);
    ctx.textAlign = 'left';
  }

  return {
    x: (tPts[0].x + tPts[1].x + tPts[2].x + tPts[3].x) / 4,
    y: (tPts[0].y + tPts[1].y + tPts[2].y + tPts[3].y) / 4,
  };
}

// ─────────────────────────────────────────────
//  DRAW: FULL SPIRAL LAYER (for main spiral tab)
// ─────────────────────────────────────────────
function drawSpiralLayer(
  ctx: CanvasRenderingContext2D,
  layerIdx: number,
  totalLayers: number,
  rotationY: number,
  tiltAngle: number,
  w: number,
  h: number,
  showFibers: boolean,
): void {
  // Reuse drawHelSlab with full-size params, gold palette, centred on canvas
  const fiberAngle = layerIdx * LAYER_ANGLE_DEG * Math.PI / 180;
  const yCenter    = (layerIdx - totalLayers / 2) * LAYER_STEP;
  const hw = LAYER_W / 2;
  const hd = LAYER_D / 2;
  const yt = yCenter - LAYER_H / 2;
  const yb = yCenter + LAYER_H / 2;

  const localCorners = [
    { lx: -hw, lz: -hd },
    { lx:  hw, lz: -hd },
    { lx:  hw, lz:  hd },
    { lx: -hw, lz:  hd },
  ].map(({ lx, lz }) => ({
    x3: lx * Math.cos(fiberAngle) - lz * Math.sin(fiberAngle),
    z3: lx * Math.sin(fiberAngle) + lz * Math.cos(fiberAngle),
  }));

  const cx = w / 2, cy = h / 2;
  const tf = (x: number, y: number, z: number) => transform3D(x, y, z, rotationY, tiltAngle, cx, cy);
  const topPts = localCorners.map(c => tf(c.x3, yt, c.z3));
  const botPts = localCorners.map(c => tf(c.x3, yb, c.z3));
  const L = 30 + (layerIdx / totalLayers) * 10;

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
    ctx.fillStyle = `hsl(42,${48 + (a === 0 ? 6 : 0)}%,${a === 0 ? L : L - 10}%)`;
    ctx.fill(); ctx.strokeStyle = 'rgba(255,215,100,0.35)'; ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Top face
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y);
  topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  try {
    const g = ctx.createLinearGradient(topPts[0].x, topPts[0].y, topPts[2].x, topPts[2].y);
    g.addColorStop(0,   `hsl(42,62%,${L + 16}%)`);
    g.addColorStop(0.5, `hsl(42,58%,${L + 11}%)`);
    g.addColorStop(1,   `hsl(42,52%,${L + 5}%)`);
    ctx.fillStyle = g;
  } catch { ctx.fillStyle = `hsl(42,58%,${L + 10}%)`; }
  ctx.fill(); ctx.strokeStyle = 'rgba(255,225,130,0.55)'; ctx.lineWidth = 0.7; ctx.stroke();

  // Fiber lines
  if (showFibers) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    topPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.clip();
    const fp0 = tf(-Math.cos(fiberAngle) * hw, yt, -Math.sin(fiberAngle) * hw);
    const fp1 = tf( Math.cos(fiberAngle) * hw, yt,  Math.sin(fiberAngle) * hw);
    const fdx = fp1.x - fp0.x, fdy = fp1.y - fp0.y;
    const flen = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
    const nx = fdy / flen, ny = -fdx / flen;
    ctx.strokeStyle = 'rgba(255,235,160,0.38)'; ctx.lineWidth = 0.75;
    for (let f = 0; f < 20; f++) {
      const s2 = (f / 19 - 0.5) * 80;
      ctx.beginPath();
      ctx.moveTo(fp0.x + nx * s2, fp0.y + ny * s2);
      ctx.lineTo(fp1.x + nx * s2, fp1.y + ny * s2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Top-edge glint
  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y); ctx.lineTo(topPts[1].x, topPts[1].y);
  ctx.strokeStyle = 'rgba(255,248,200,0.6)'; ctx.lineWidth = 1.1; ctx.stroke();
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export function HelicoidalStack3D() {

  const spiralRef  = useRef<HTMLCanvasElement>(null);
  const compareRef = useRef<HTMLCanvasElement>(null);

  // Spiral rotation refs
  const rotYRef      = useRef(0.3);
  const tiltRef      = useRef(0.42);
  const autoRotRef   = useRef(true);
  const draggingRef  = useRef(false);
  const lastMXRef    = useRef(0);
  const lastMYRef    = useRef(0);
  const spiralRafRef = useRef<number>(0);

  // Compare: right-panel spiral rotation (slow auto-rotate, separate from main)
  const helRotYRef   = useRef(0.5);
  const helTiltRef   = useRef(0.38);

  // Crack animation refs
  const crackProgRef  = useRef(0);
  const crackRafRef   = useRef<number>(0);
  const crackPhaseRef = useRef<CrackPhase>('idle');
  const lastFrameRef  = useRef<number>(0);

  // Slab centre arrays — rebuilt every draw frame
  const leftSlabCentersRef  = useRef<Point2D[]>([]);
  const rightSlabCentersRef = useRef<Point2D[]>([]);

  // React UI state
  const [mode,       setMode]       = useState<TabMode>('spiral');
  const [autoRot,    setAutoRot]    = useState(true);
  const [showFibers, setShowFibers] = useState(true);
  const [rotDisplay, setRotDisplay] = useState('0.0');
  const [crackPhase, setCrackPhase] = useState<CrackPhase>('idle');
  const [crackPct,   setCrackPct]   = useState(0);
  const [stats, setStats] = useState({
    cfDefl: 0, cfDepth: 0,
    helDefl: 0, helDepth: 0, helEnergy: 0,
  });

  // ── SPIRAL DRAW (main tab) ─────────────────
  const drawSpiral = useCallback(() => {
    const canvas = spiralRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const ry = rotYRef.current, rx = tiltRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020810'; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(200,168,75,0.03)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    // Painter's sort
    const tf0 = (x: number, y: number, z: number) => transform3D(x, y, z, ry, rx, w/2, h/2);
    const order = Array.from({ length: NUM_LAYERS }, (_, i) => {
      let p: Point3D = { x: 0, y: (i - NUM_LAYERS / 2) * LAYER_STEP, z: 0 };
      p = rotY3(p, ry); p = rotX3(p, rx);
      return { idx: i, depth: p.z };
    }).sort((a, b) => a.depth - b.depth);

    order.forEach(({ idx }) => drawSpiralLayer(ctx, idx, NUM_LAYERS, ry, rx, w, h, showFibers));

    // Spine lines
    if (showFibers) {
      ['left', 'right'].forEach(side => {
        ctx.beginPath();
        for (let i = 0; i < NUM_LAYERS; i++) {
          const fa   = i * LAYER_ANGLE_DEG * Math.PI / 180;
          const yc   = (i - NUM_LAYERS / 2) * LAYER_STEP;
          const sign = side === 'left' ? -1 : 1;
          const p    = tf0(sign * Math.cos(fa) * LAYER_W * 0.48, yc, sign * Math.sin(fa) * LAYER_W * 0.48);
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(200,168,75,0.28)'; ctx.lineWidth = 1; ctx.stroke();
      });
    }

    // Axis dashed
    const axTop = tf0(0, -(NUM_LAYERS/2)*LAYER_STEP - 25, 0);
    const axBot = tf0(0,  (NUM_LAYERS/2)*LAYER_STEP + 25, 0);
    ctx.beginPath(); ctx.moveTo(axTop.x, axTop.y); ctx.lineTo(axBot.x, axBot.y);
    ctx.strokeStyle = 'rgba(0,212,255,0.12)'; ctx.setLineDash([4,5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);

    // 15° annotation
    const p0 = tf0(60, (-NUM_LAYERS/2 + 0.5) * LAYER_STEP, 0);
    const p1 = tf0(60, (-NUM_LAYERS/2 + 1.5) * LAYER_STEP, 0);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p0.x + 28, p0.y - 4);
    ctx.lineTo(p0.x + 28, p1.y - 4); ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,140,0.95)'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText('15° / LAYER', p0.x + 32, (p0.y + p1.y) / 2 + 4);

    // HUD
    ctx.fillStyle = 'rgba(200,168,75,0.85)'; ctx.font = '9px Orbitron';
    ctx.fillText('BOULIGAND HELICOIDAL ARCHITECTURE', 12, 18);
    ctx.fillStyle = 'rgba(120,140,170,0.6)'; ctx.font = '8px Share Tech Mono';
    ctx.fillText(`${NUM_LAYERS} LAYERS  ·  15°/LAYER  ·  ${NUM_LAYERS * 15}° TOTAL ROTATION`, 12, 32);
    const deg = ((ry * 180 / Math.PI) % 360 + 360) % 360;
    setRotDisplay(deg.toFixed(1));
    ctx.fillStyle = 'rgba(0,212,255,0.7)'; ctx.font = '9px Share Tech Mono'; ctx.textAlign = 'right';
    ctx.fillText(`ROT ${deg.toFixed(1)}°`, w - 12, 18);
    ctx.textAlign = 'left';
  }, [showFibers]);

  useEffect(() => {
    const loop = () => {
      if (autoRotRef.current) rotYRef.current += 0.007;
      drawSpiral();
      spiralRafRef.current = requestAnimationFrame(loop);
    };
    spiralRafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(spiralRafRef.current);
  }, [drawSpiral]);

  // ── COMPARE DRAW ─────────────────────────
  // Left panel: CF flat oblique stack
  // Right panel: helicoidal spiral (same slab geometry, 3D perspective, slow auto-rotate)
  const drawCompare = useCallback(() => {
    const canvas = compareRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const cp    = crackProgRef.current;
    const phase = crackPhaseRef.current;

    // Slow-rotate right spiral regardless of crack state
    helRotYRef.current += 0.004;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020810'; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(200,168,75,0.03)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    // Divider
    ctx.beginPath(); ctx.moveTo(w/2, 16); ctx.lineTo(w/2, h - 16);
    ctx.strokeStyle = 'rgba(200,168,75,0.15)'; ctx.setLineDash([4,4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,168,75,0.55)'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('VS', w/2, h/2 + 4);

    // ── Geometry params ──
    const halfW   = w / 2;
    // Centre CF stack vertically in left panel
    const cfStackH = CF_STACK_LAYERS * CF_STEP;
    const cfBase   = h / 2 + cfStackH / 2;   // stack sits centred
    const cfX      = halfW * 0.5;

    // Right spiral sub-panel centre
    const helCX = halfW + halfW * 0.5;
    const helCY = h / 2;
    const helRY  = helRotYRef.current;
    const helRX  = helTiltRef.current;

    // ────────────────────────────────────────
    //  LEFT PANEL: Carbon Fiber flat stack
    // ────────────────────────────────────────
    const leftCenters: Point2D[] = new Array(CF_STACK_LAYERS);
    for (let i = CF_STACK_LAYERS - 1; i >= 0; i--) {
      leftCenters[i] = drawCFLayer(ctx, i, cfX, cfBase);
    }
    leftSlabCentersRef.current = leftCenters;

    // CF label — above stack
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Orbitron'; ctx.fillStyle = 'rgba(180,195,225,0.95)';
    ctx.fillText('CARBON FIBRE', cfX, cfBase - cfStackH - 22);
    ctx.fillStyle = 'rgba(130,145,165,0.65)'; ctx.font = '8px Share Tech Mono';
    ctx.fillText('UNIDIRECTIONAL  ·  ALL FIBERS 0°', cfX, cfBase - cfStackH - 9);

    // ────────────────────────────────────────
    //  RIGHT PANEL: Helicoidal Spiral 3D
    // ────────────────────────────────────────
    // Clip to right half to avoid overflow
    ctx.save();
    ctx.beginPath(); ctx.rect(halfW + 1, 0, halfW - 1, h); ctx.clip();

    // Painter's sort for spiral slabs
    const helOrder = Array.from({ length: HEL_LAYERS }, (_, i) => {
      let p: Point3D = { x: 0, y: (i - HEL_LAYERS / 2) * HEL_STEP, z: 0 };
      p = rotY3(p, helRY); p = rotX3(p, helRX);
      return { idx: i, depth: p.z };
    }).sort((a, b) => a.depth - b.depth);

    const rightCenters: Point2D[] = new Array(HEL_LAYERS);
    helOrder.forEach(({ idx }) => {
      rightCenters[idx] = drawHelSlab(ctx, idx, HEL_LAYERS, helRY, helRX, helCX, helCY, true, false);
    });
    rightSlabCentersRef.current = rightCenters;

    // Spine lines on right spiral
    ['left', 'right'].forEach(side => {
      ctx.beginPath();
      for (let i = 0; i < HEL_LAYERS; i++) {
        const fa   = i * HEL_ANGLE_DEG * Math.PI / 180;
        const yc   = (i - HEL_LAYERS / 2) * HEL_STEP;
        const sign = side === 'left' ? -1 : 1;
        const p    = transform3D(
          sign * Math.cos(fa) * HEL_W * 0.46, yc,
          sign * Math.sin(fa) * HEL_W * 0.46,
          helRY, helRX, helCX, helCY,
        );
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = 'rgba(127,255,0,0.2)'; ctx.lineWidth = 0.8; ctx.stroke();
    });

    ctx.restore(); // end clip

    // Helicoidal label
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Orbitron'; ctx.fillStyle = '#7fff00';
    ctx.fillText('HELICOIDAL BOULIGAND', helCX, 28);
    ctx.fillStyle = 'rgba(130,165,130,0.65)'; ctx.font = '8px Share Tech Mono';
    ctx.fillText('BOULIGAND SPIRAL  ·  15°/LAYER', helCX, 40);

    // 15° annotation on right panel
    ctx.fillStyle = 'rgba(127,255,0,0.7)'; ctx.font = '8px Share Tech Mono'; ctx.textAlign = 'left';
    ctx.fillText('15° / LAYER', helCX + HEL_W * 0.3, helCY + HEL_LAYERS * HEL_STEP * 0.4);

    // ── CRACK OVERLAYS ────────────────────────
    if (cp > 0) {

      // Impact arrows — above each stack
      const cfTopY  = cfBase - cfStackH - 38;
      const helTopY = helCY - HEL_LAYERS * HEL_STEP * 0.5 - 38;

      [[cfX, cfTopY, '#ff2244'], [helCX, helTopY, '#ff6644']].forEach(([ax, ay, col]) => {
        ctx.save();
        ctx.fillStyle = col as string; ctx.shadowColor = col as string; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(ax as number, ay as number);
        ctx.lineTo((ax as number) - 7, (ay as number) - 12);
        ctx.lineTo((ax as number) - 2.5, (ay as number) - 12);
        ctx.lineTo((ax as number) - 2.5, (ay as number) - 26);
        ctx.lineTo((ax as number) + 2.5, (ay as number) - 26);
        ctx.lineTo((ax as number) + 2.5, (ay as number) - 12);
        ctx.lineTo((ax as number) + 7,   (ay as number) - 12);
        ctx.closePath(); ctx.fill(); ctx.restore();
      });

      // ── CF CRACK — through flat stack, anchored to leftCenters ──
      const cfPts = Math.floor((cp / 0.48) * CF_STACK_LAYERS);
      const cfTo  = Math.min(cfPts, CF_STACK_LAYERS);

      if (cfTo > 0) {
        ctx.save();
        ctx.strokeStyle = '#ff2244'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(leftCenters[0].x, leftCenters[0].y);
        for (let i = 1; i < cfTo; i++) {
          ctx.lineTo(leftCenters[i].x + Math.sin(i * 0.3) * 2, leftCenters[i].y);
        }
        ctx.stroke();
        if (cfTo > 0 && cfTo < CF_STACK_LAYERS) {
          const ti = cfTo - 1;
          ctx.fillStyle = '#ff2244'; ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(leftCenters[ti].x + Math.sin(ti * 0.3) * 2, leftCenters[ti].y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── HELICOIDAL CRACK — through spiral, anchored to rightCenters ──
      // Crack travels down through spiral slabs, stops at 75% (slab 18 of 24)
      const HEL_MAX = Math.floor(HEL_LAYERS * 0.75);
      const helPts  = Math.floor(cp * HEL_MAX);
      const helTo   = Math.min(helPts, HEL_MAX);

      if (helTo > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(halfW + 1, 0, halfW - 1, h); ctx.clip();

        ctx.strokeStyle = '#ff6644'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 6; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightCenters[0].x, rightCenters[0].y);
        for (let i = 1; i < helTo; i++) {
          const defl = HEL_DEFLECTIONS[i] ?? 0;
          // Scale deflection to fit in spiral's projected space
          ctx.lineTo(rightCenters[i].x + defl * 0.5, rightCenters[i].y);
        }
        ctx.stroke();

        // Branches at specified slab indices
        BRANCH_INDICES.forEach(bi => {
          if (bi >= helTo || !rightCenters[bi]) return;
          const defl = (HEL_DEFLECTIONS[bi] ?? 0) * 0.5;
          const bx   = rightCenters[bi].x + defl;
          const by   = rightCenters[bi].y;
          ctx.save();
          ctx.strokeStyle = 'rgba(255,100,60,0.5)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 14, by - 8); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 14, by - 8); ctx.stroke();
          ctx.restore();
        });

        // Crack tip glow
        if (helTo > 0 && helTo < HEL_MAX) {
          const ti    = helTo - 1;
          const defl  = (HEL_DEFLECTIONS[ti] ?? 0) * 0.5;
          ctx.fillStyle = '#ff6644'; ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(rightCenters[ti].x + defl, rightCenters[ti].y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ── LIVE COUNTERS (canvas text) ──
      if (phase === 'running') {
        const cfD   = Math.floor((cp / 0.48) * 4);
        const cfDp  = Math.min(100, Math.floor(cp * 48 * 2.08));
        const helD  = Math.floor(cp * 23);
        const helDp = Math.floor(cp * 75);
        const helEn = Math.floor(cp * 460);

        ctx.font = '9px Share Tech Mono'; ctx.fillStyle = 'rgba(200,220,255,0.7)'; ctx.textAlign = 'left';
        const cfy = cfBase + 14;
        ctx.fillText(`DEFLECTIONS: ${cfD}`,  cfX  - CF_LAYER_W / 2, cfy);
        ctx.fillText(`DEPTH: ${cfDp}%`,       cfX  - CF_LAYER_W / 2, cfy + 13);
        ctx.fillText(`DEFLECTIONS: ${helD}`,  helCX - HEL_W / 2, h - 44);
        ctx.fillText(`DEPTH: ${helDp}%`,       helCX - HEL_W / 2, h - 30);
        ctx.fillText(`ENERGY: ${helEn} mJ`,    helCX - HEL_W / 2, h - 16);
      }
    }

    // ── RESULT LABELS (canvas, when done) ──
    if (phase === 'done') {
      // CF — red rect below flat stack
      const cfLY = cfBase + 10;
      ctx.fillStyle = 'rgba(255,20,50,0.85)';
      ctx.fillRect(cfX - 90, cfLY, 180, 28);
      ctx.fillStyle = '#ffffff'; ctx.font = '9px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText('CATASTROPHIC FAILURE', cfX, cfLY + 11);
      ctx.fillStyle = 'rgba(255,180,180,0.9)'; ctx.font = '8px Share Tech Mono';
      ctx.fillText('4 deflections · 100% penetration', cfX, cfLY + 23);

      // Helicoidal — green rect at bottom of right panel
      const helLY = h - 46;
      ctx.fillStyle = 'rgba(20,180,80,0.85)';
      ctx.fillRect(helCX - 100, helLY, 200, 28);
      ctx.fillStyle = '#ffffff'; ctx.font = '9px Orbitron';
      ctx.fillText('CRACK ARRESTED', helCX, helLY + 11);
      ctx.fillStyle = 'rgba(180,255,200,0.9)'; ctx.font = '8px Share Tech Mono';
      ctx.fillText('23 deflections · 75% depth · 460 mJ dissipated', helCX, helLY + 23);
      ctx.textAlign = 'left';
    }
  }, []);

  // ── CRACK ANIMATION LOOP ─────────────────
  const startCrackLoop = useCallback(() => {
    lastFrameRef.current = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - lastFrameRef.current, 50);
      lastFrameRef.current = now;
      crackProgRef.current = Math.min(crackProgRef.current + dt / 2500, 1);
      const cp = crackProgRef.current;
      setStats({
        cfDefl:    Math.floor((cp / 0.48) * 4),
        cfDepth:   Math.min(100, Math.floor(cp * 48 * 2.08)),
        helDefl:   Math.floor(cp * 23),
        helDepth:  Math.floor(cp * 75),
        helEnergy: Math.floor(cp * 460),
      });
      setCrackPct(Math.round(cp * 100));
      drawCompare();
      if (cp >= 1) {
        crackPhaseRef.current = 'done';
        setCrackPhase('done');
        drawCompare();
      } else {
        crackRafRef.current = requestAnimationFrame(loop);
      }
    };
    crackRafRef.current = requestAnimationFrame(loop);
  }, [drawCompare]);

  // Compare tab: keep redrawing even when idle (spiral rotates)
  const compareRafRef = useRef<number>(0);
  useEffect(() => {
    if (mode !== 'compare') { cancelAnimationFrame(compareRafRef.current); return; }
    const loop = () => {
      // Only auto-rotate spiral and redraw when not in crack animation
      if (crackPhaseRef.current !== 'running') drawCompare();
      compareRafRef.current = requestAnimationFrame(loop);
    };
    compareRafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(compareRafRef.current);
  }, [mode, drawCompare]);

  const runCrack = useCallback(() => {
    if (crackPhaseRef.current === 'running') return;
    cancelAnimationFrame(crackRafRef.current);
    cancelAnimationFrame(compareRafRef.current);
    crackProgRef.current  = 0;
    crackPhaseRef.current = 'running';
    setCrackPhase('running');
    setCrackPct(0);
    setStats({ cfDefl: 0, cfDepth: 0, helDefl: 0, helDepth: 0, helEnergy: 0 });
    startCrackLoop();
  }, [startCrackLoop]);

  const resetCrack = useCallback(() => {
    cancelAnimationFrame(crackRafRef.current);
    crackProgRef.current      = 0;
    crackPhaseRef.current     = 'idle';
    leftSlabCentersRef.current  = [];
    rightSlabCentersRef.current = [];
    setCrackPhase('idle');
    setCrackPct(0);
    setStats({ cfDefl: 0, cfDepth: 0, helDefl: 0, helDepth: 0, helEnergy: 0 });
    drawCompare();
  }, [drawCompare]);

  // Resize + initial draw
  useEffect(() => {
    const resize = () => {
      [spiralRef, compareRef].forEach(ref => {
        if (!ref.current) return;
        const p = ref.current.parentElement;
        if (!p) return;
        ref.current.width  = p.clientWidth;
        ref.current.height = Math.max(480, p.clientHeight);
      });
      drawCompare();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawCompare]);

  // Mouse handlers (spiral tab)
  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true; lastMXRef.current = e.clientX; lastMYRef.current = e.clientY;
    autoRotRef.current = false; setAutoRot(false);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    rotYRef.current  += (e.clientX - lastMXRef.current) * 0.008;
    tiltRef.current  += (e.clientY - lastMYRef.current) * 0.005;
    tiltRef.current   = Math.max(-0.8, Math.min(1.0, tiltRef.current));
    lastMXRef.current = e.clientX; lastMYRef.current = e.clientY;
  };
  const onMouseUp = () => { draggingRef.current = false; };
  const toggleAutoRot = () => { autoRotRef.current = !autoRotRef.current; setAutoRot(autoRotRef.current); };

  // ─────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────
  return (
    <section className="py-16 bg-[#020810] border-t border-white/5">
      <div className="container mx-auto px-4">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold uppercase tracking-widest mb-2">
            <span className="text-[#c8a84b]">Helicoidal</span>{' '}
            <span className="text-white">Architecture</span>{' '}
            <span className="text-[#7fff00]">Simulator</span>
          </h2>
          <p className="text-xs font-mono text-white/30 tracking-widest">
            BOULIGAND STRUCTURE · FIBER MECHANICS · CRACK PROPAGATION
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4 justify-center">
          {(['spiral', 'compare'] as TabMode[]).map(tab => (
            <button key={tab} onClick={() => setMode(tab)}
              className={`font-display text-[10px] tracking-widest px-5 py-2 border transition-all duration-200
                ${mode === tab
                  ? 'bg-[#c8a84b]/15 border-[#c8a84b] text-[#c8a84b]'
                  : 'bg-transparent border-white/10 text-white/30 hover:border-white/30 hover:text-white/50'}`}
              style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
            >
              {tab === 'spiral' ? '⬡ SPIRAL STRUCTURE' : '⚡ CRACK COMPARISON'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── SPIRAL TAB ── */}
          {mode === 'spiral' && (
            <motion.div key="spiral"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}  transition={{ duration: 0.25 }}
            >
              <Card
                className="bg-white/[0.03] border-[#c8a84b]/20 overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ boxShadow: '0 0 40px rgba(200,168,75,0.06)' }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}     onMouseLeave={onMouseUp}
              >
                <canvas ref={spiralRef} className="block w-full" height={480} />
              </Card>

              <div className="flex flex-wrap gap-3 mt-4 items-center justify-center">
                <button onClick={toggleAutoRot}
                  className={`font-display text-[9px] tracking-widest px-4 py-2 border transition-all duration-150 flex items-center gap-2
                    ${autoRot ? 'bg-[#c8a84b] border-[#c8a84b] text-black' : 'border-white/20 text-white/40 hover:border-[#c8a84b] hover:text-[#c8a84b]'}`}
                  style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
                >
                  {autoRot ? <Pause size={11} /> : <Play size={11} />} AUTO ROTATE
                </button>
                <button onClick={() => setShowFibers(v => !v)}
                  className={`font-display text-[9px] tracking-widest px-4 py-2 border transition-all duration-150 flex items-center gap-2
                    ${showFibers ? 'bg-[#7fff00]/15 border-[#7fff00] text-[#7fff00]' : 'border-white/20 text-white/40'}`}
                  style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
                >
                  {showFibers ? <Eye size={11} /> : <EyeOff size={11} />} FIBERS
                </button>
                <button onClick={() => { rotYRef.current = 0.3; tiltRef.current = 0.42; }}
                  className="font-display text-[9px] tracking-widest px-4 py-2 border border-white/15 text-white/35 hover:border-white/30 hover:text-white/55 transition-all flex items-center gap-2"
                  style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
                >
                  <RotateCcw size={11} /> RESET VIEW
                </button>
                <span className="font-mono text-[10px] text-[#00d4ff]/70 ml-auto">
                  ROT {rotDisplay}° &nbsp;·&nbsp; {NUM_LAYERS} LAYERS &nbsp;·&nbsp; 15°/LAYER
                </span>
              </div>

              <div className="mt-3 px-4 py-2 border border-white/5 bg-white/[0.02] flex flex-wrap gap-4 text-[11px] font-mono text-white/30">
                <span><span className="text-[#c8a84b]">STRUCTURE:</span> Bouligand helicoidal plywood</span>
                <span><span className="text-[#c8a84b]">TOTAL ROTATION:</span> {NUM_LAYERS * LAYER_ANGLE_DEG}° ({(NUM_LAYERS * LAYER_ANGLE_DEG / 360).toFixed(2)} full turns)</span>
                <span><span className="text-[#c8a84b]">DRAG</span> to rotate on X/Y axes</span>
              </div>
            </motion.div>
          )}

          {/* ── COMPARE TAB ── */}
          {mode === 'compare' && (
            <motion.div key="compare"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}  transition={{ duration: 0.25 }}
            >
              <Card
                className="bg-white/[0.03] border-[#c8a84b]/20 overflow-hidden"
                style={{ boxShadow: '0 0 40px rgba(200,168,75,0.06)' }}
              >
                <canvas ref={compareRef} className="block w-full" height={520} />
              </Card>

              <div className="flex flex-wrap gap-3 mt-4 items-center justify-center">
                <button onClick={runCrack} disabled={crackPhase === 'running'}
                  className={`font-display text-[9px] tracking-widest px-5 py-2 border transition-all duration-150 flex items-center gap-2
                    ${crackPhase === 'running'
                      ? 'border-orange-500/50 text-orange-500/50 cursor-not-allowed'
                      : 'border-[#ff6b00] text-[#ff6b00] hover:bg-[#ff6b00] hover:text-black'}`}
                  style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
                >
                  <Play size={11} />
                  {crackPhase === 'running' ? `SIMULATING ${crackPct}%…` : 'RUN CRACK SIMULATION'}
                </button>
                <button onClick={resetCrack}
                  className="font-display text-[9px] tracking-widest px-4 py-2 border border-red-500/50 text-red-500/60 hover:bg-red-500/10 transition-all flex items-center gap-2"
                  style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}
                >
                  <RotateCcw size={11} /> RESET
                </button>
              </div>

              <AnimatePresence>
                {crackPhase !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 grid grid-cols-2 gap-px bg-white/5 overflow-hidden border border-white/5"
                  >
                    <div className="bg-[#0a0a0a] px-4 py-3 flex gap-6">
                      <div>
                        <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">CF DEFLECTIONS</div>
                        <div className="text-xl font-display text-[#ff2244]">{stats.cfDefl}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">DEPTH</div>
                        <div className="text-xl font-display text-[#ff2244]">{stats.cfDepth}%</div>
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] px-4 py-3 flex gap-6">
                      <div>
                        <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">HEL DEFLECTIONS</div>
                        <div className="text-xl font-display text-[#7fff00]">{stats.helDefl}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">DEPTH</div>
                        <div className="text-xl font-display text-[#7fff00]">{stats.helDepth}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">ENERGY DISS.</div>
                        <div className="text-xl font-display text-[#7fff00]">{stats.helEnergy} mJ</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-3 px-4 py-2 border border-white/5 bg-white/[0.02] flex flex-wrap gap-4 text-[11px] font-mono text-white/30">
                <span><span className="text-[#ff2244]">LEFT:</span> Flat CF unidirectional — crack channels straight, fails at 100%</span>
                <span><span className="text-[#7fff00]">RIGHT:</span> Helicoidal spiral — crack deflects at every layer, arrested at 75%</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}