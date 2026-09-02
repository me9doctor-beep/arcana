import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { pointer, smoothPointer } from "@/hooks/usePointer";
import { clamp, createRng, smoothstep } from "@/lib/random";
import { HERO_TRAVEL, HORIZON, LANDMARKS, type Landmark } from "@/lib/world";

/* ─── Scene types ──────────────────────────────────────────────────────── */
type Star = { x: number; y: number; r: number; depth: number; tw: number; ph: number; ox: number; oy: number; a: number; teal: boolean; vy: number };
type Win = { dx: number; dy: number; b: number; sp: number; ph: number; t0: number; w: number; h: number };
type Structure = { x: number; w: number; h: number; t0: number; windows: Win[]; beacon: boolean; antenna: number; landmark?: Landmark; ph: number; cap: boolean };
type Stream = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; speed: number; phase: number; packets: number };
type Mote = { x: number; y: number; r: number; depth: number; vx: number; vy: number; a: number; ph: number };
type Drone = { x: number; y: number; vx: number; ph: number };

interface Scene {
  W: number;
  H: number;
  stars: Star[];
  far: Structure[];
  mid: Structure[];
  streams: Stream[];
  motes: Mote[];
  drones: Drone[];
}

const TEAL = "55,229,216";

function buildScene(W: number, H: number, small: boolean): Scene {
  const rng = createRng(20260901);
  const k = clamp(W / 1440, 0.62, 1.25);
  const horizon = H * HORIZON;

  const stars: Star[] = Array.from({ length: small ? 70 : 170 }, () => ({
    x: rng.range(0, W),
    y: rng.range(0, H),
    r: rng.range(0.4, 1.5),
    depth: rng.range(0.06, 0.4),
    tw: rng.range(0.4, 1.6),
    ph: rng.range(0, Math.PI * 2),
    ox: 0,
    oy: 0,
    a: rng.range(0.25, 0.85),
    teal: rng.chance(0.16),
    vy: rng.range(0.02, 0.09),
  }));

  const makeWindows = (w: number, h: number, density: number, tealBias: number) => {
    const wins: Win[] = [];
    const cols = Math.max(1, Math.floor(w / 8));
    const rows = Math.max(1, Math.floor(h / 11));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (!rng.chance(density)) continue;
        wins.push({
          dx: 3 + c * 8 + rng.range(-0.5, 0.5),
          dy: 6 + r * 11,
          b: rng.range(0.25, 1) * (rng.chance(tealBias) ? 1.15 : 0.75),
          sp: rng.range(0.3, 1.4),
          ph: rng.range(0, Math.PI * 2),
          t0: rng.range(0.55, 0.96),
          w: rng.chance(0.2) ? 3 : 2,
          h: 2,
        });
      }
    }
    return wins;
  };

  // far skyline: dense silhouettes with sparse lights
  const far: Structure[] = [];
  const farCount = small ? 26 : 48;
  for (let i = 0; i < farCount; i++) {
    const w = rng.range(10, 34) * k;
    const h = rng.range(0.03, 0.15) * H;
    far.push({
      x: -0.04 * W + (i / farCount) * 1.08 * W + rng.range(-12, 12),
      w,
      h,
      t0: rng.range(0.28, 0.58),
      windows: makeWindows(w, h, 0.09, 0.3),
      beacon: rng.chance(0.08),
      antenna: rng.chance(0.25) ? rng.range(8, 26) : 0,
      ph: rng.range(0, 6),
      cap: rng.chance(0.4),
    });
  }

  // mid structures + landmarks
  const mid: Structure[] = [];
  const midCount = small ? 8 : 15;
  for (let i = 0; i < midCount; i++) {
    let x = rng.range(-0.02, 1.02) * W;
    let tries = 0;
    while (tries++ < 10 && LANDMARKS.some((L) => Math.abs(L.x * W - x) < 70 * k)) x = rng.range(-0.02, 1.02) * W;
    const w = rng.range(20, 46) * k;
    const h = rng.range(0.07, 0.24) * H;
    mid.push({
      x,
      w,
      h,
      t0: rng.range(0.4, 0.78),
      windows: makeWindows(w, h, 0.3, 0.35),
      beacon: rng.chance(0.2),
      antenna: rng.chance(0.4) ? rng.range(10, 34) : 0,
      ph: rng.range(0, 6),
      cap: rng.chance(0.5),
    });
  }
  for (const L of LANDMARKS) {
    const w = L.width * k;
    const h = L.height * H;
    mid.push({
      x: L.x * W - w / 2,
      w,
      h,
      t0: 0.42 + LANDMARKS.indexOf(L) * 0.06,
      windows: makeWindows(w, h, 0.42, 0.55),
      beacon: true,
      antenna: L.id === "hq" ? 44 : 22,
      landmark: L,
      ph: rng.range(0, 6),
      cap: true,
    });
  }
  mid.sort((a, b) => a.h - b.h);

  // data streams — arcs between the districts and across the sky
  const lm = (id: string) => LANDMARKS.find((l) => l.id === id)!;
  const pt = (nx: number, ny: number) => ({ x: nx * W, y: ny * H });
  const eng = pt(lm("engineering").x, horizon / H - lm("engineering").height * 0.7);
  const hq = pt(lm("hq").x, horizon / H - lm("hq").height * 0.82);
  const prod = pt(lm("product").x, horizon / H - lm("product").height * 0.7);
  const streams: Stream[] = [
    { x0: eng.x, y0: eng.y, cx: (eng.x + hq.x) / 2, cy: Math.min(eng.y, hq.y) - 0.08 * H, x1: hq.x, y1: hq.y, speed: 0.06, phase: 0.1, packets: 2 },
    { x0: hq.x, y0: hq.y, cx: (hq.x + prod.x) / 2, cy: Math.min(hq.y, prod.y) - 0.06 * H, x1: prod.x, y1: prod.y, speed: 0.05, phase: 0.6, packets: 2 },
    { x0: -0.05 * W, y0: horizon - 0.12 * H, cx: 0.4 * W, cy: horizon - 0.34 * H, x1: 1.05 * W, y1: horizon - 0.1 * H, speed: 0.025, phase: 0.3, packets: 3 },
    { x0: 1.05 * W, y0: horizon - 0.22 * H, cx: 0.55 * W, cy: horizon - 0.05 * H, x1: -0.05 * W, y1: horizon - 0.26 * H, speed: 0.02, phase: 0.8, packets: 2 },
  ];

  const motes: Mote[] = Array.from({ length: small ? 10 : 22 }, () => ({
    x: rng.range(0, W),
    y: rng.range(0, H),
    r: rng.range(1.2, 2.6),
    depth: rng.range(0.55, 0.9),
    vx: rng.range(-0.08, 0.08),
    vy: rng.range(-0.12, -0.03),
    a: rng.range(0.12, 0.35),
    ph: rng.range(0, 6),
  }));

  const drones: Drone[] = Array.from({ length: 3 }, () => ({
    x: rng.range(0, W),
    y: horizon - rng.range(0.28, 0.5) * H,
    vx: rng.range(0.08, 0.2) * (rng.chance(0.5) ? 1 : -1),
    ph: rng.range(0, 6),
  }));

  return { W, H, stars, far, mid, streams, motes, drones };
}

/* ─── Component ─────────────────────────────────────────────────────────── */
interface AtmosphereProps {
  assembly: MotionValue<number>;
  reduced: boolean;
}

export function Atmosphere({ assembly, reduced }: AtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let scene: Scene | null = null;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let lastScroll = -1;
    let lastAssembly = -1;
    let frozenT = 0;
    let dirty = true;
    const start = performance.now();

    const resize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const small = W < 768;
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      scene = buildScene(W, H, small);
      dirty = true;
    };
    resize();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };
    window.addEventListener("resize", onResize);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const drawStructure = (s: Structure, a: number, t: number, horizon: number, rise: number, lit: boolean, fill: string) => {
      const h = s.h * rise;
      if (h < 1) return;
      const top = horizon - h;
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      ctx.fillRect(s.x, top, s.w, h + 2);
      // faint edge light to imply volume
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(s.x, top, 1, h);
      if (s.cap) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(s.x, top, s.w, 1);
      }
      if (s.antenna) {
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.fillRect(s.x + s.w / 2, top - s.antenna * rise, 1, s.antenna * rise);
      }
      if (!lit) return;
      // windows
      for (const w of s.windows) {
        if (w.dy > h - 4) continue;
        const on = smoothstep(w.t0, w.t0 + 0.1, assemblyNow);
        if (on <= 0) continue;
        let b = w.b * on * (0.78 + 0.22 * Math.sin(t * w.sp + w.ph));
        if (Math.sin(t * 0.9 + w.ph * 17.3) > 0.997) b *= 0.15; // rare flicker
        ctx.fillStyle = w.b > 0.9 ? `rgba(${TEAL},${(b * 0.9).toFixed(3)})` : `rgba(205,236,233,${(b * 0.6).toFixed(3)})`;
        ctx.fillRect(s.x + w.dx, top + w.dy, w.w, w.h);
      }
      if (s.beacon) {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + s.ph));
        const by = top - s.antenna * rise - 1;
        ctx.fillStyle = `rgba(${TEAL},${(pulse * 0.9 * a).toFixed(3)})`;
        ctx.fillRect(s.x + s.w / 2 - 1, by - 1, 3, 3);
        ctx.fillStyle = `rgba(${TEAL},${(pulse * 0.12 * a).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x + s.w / 2 + 0.5, by + 0.5, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let assemblyNow = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!scene) return;

      const scroll = window.scrollY || 0;
      assemblyNow = assembly.get();

      if (reduced) {
        if (!dirty && scroll === lastScroll && assemblyNow === lastAssembly) return;
      }
      lastScroll = scroll;
      lastAssembly = assemblyNow;
      dirty = false;

      const t = reduced ? frozenT : (now - start) / 1000;
      const { W, H } = scene;
      const s = assemblyNow;
      const horizon = H * HORIZON;

      // smoothed camera
      if (!reduced) {
        const tx = pointer.active ? pointer.nx : 0;
        const ty = pointer.active ? pointer.ny : 0;
        smoothPointer.nx += (tx - smoothPointer.nx) * 0.05;
        smoothPointer.ny += (ty - smoothPointer.ny) * 0.05;
      }
      const px = smoothPointer.nx;
      const py = smoothPointer.ny;
      const driftX = reduced ? 0 : Math.sin(t * 0.11) * 5;
      const driftY = reduced ? 0 : Math.cos(t * 0.08) * 3;

      const heroP = clamp(scroll / (H * HERO_TRAVEL));
      const cityAlpha = 1 - smoothstep(0.08, 0.9, heroP);
      const zoom = 1 + heroP * 0.42;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* horizon glow (the world's distant light) */
      if (cityAlpha > 0) {
        const glowA = 0.09 * smoothstep(0.2, 0.75, s) * cityAlpha;
        const g = ctx.createRadialGradient(W / 2 + px * 12, horizon, 0, W / 2 + px * 12, horizon, W * 0.62);
        g.addColorStop(0, `rgba(${TEAL},${glowA.toFixed(3)})`);
        g.addColorStop(0.45, `rgba(${TEAL},${(glowA * 0.28).toFixed(3)})`);
        g.addColorStop(1, `rgba(${TEAL},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      /* stars / particles — persistent through the whole descent */
      const starGate = smoothstep(0, 0.22, s);
      if (starGate > 0) {
        for (const st of scene.stars) {
          let sy = st.y - scroll * st.depth * 0.5 - (reduced ? 0 : t * st.vy * 8);
          sy = ((sy % H) + H) % H;
          const sx = st.x + px * st.depth * 60 + driftX * st.depth;
          // cursor displacement
          if (pointer.active && !reduced) {
            const dx = sx + st.ox - pointer.x;
            const dy = sy + st.oy - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 130 * 130 && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = (1 - d / 130) * 14;
              st.ox += ((dx / d) * f - st.ox) * 0.08;
              st.oy += ((dy / d) * f - st.oy) * 0.08;
            } else {
              st.ox *= 0.94;
              st.oy *= 0.94;
            }
          }
          const tw = reduced ? 0.8 : 0.65 + 0.35 * Math.sin(t * st.tw + st.ph);
          const a = st.a * tw * starGate;
          ctx.fillStyle = st.teal ? `rgba(${TEAL},${a.toFixed(3)})` : `rgba(226,236,236,${a.toFixed(3)})`;
          const x = sx + st.ox;
          const y = sy + st.oy + driftY * st.depth;
          if (st.r < 0.9) ctx.fillRect(x, y, 1, 1);
          else {
            ctx.beginPath();
            ctx.arc(x, y, st.r * 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* the city */
      if (cityAlpha > 0.002) {
        const cx = W / 2;
        const layer = (depthScale: number, panX: number, panY: number) => {
          const z = 1 + (zoom - 1) * depthScale;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(cx, horizon);
          ctx.scale(z, z);
          ctx.translate(-cx + px * panX + driftX * (panX / 30), -horizon + py * panY + driftY * (panY / 30));
        };

        // ground plane + receding lines
        layer(1, 16, 5);
        ctx.globalAlpha = cityAlpha;
        const ground = ctx.createLinearGradient(0, horizon, 0, horizon + H * 0.16);
        ground.addColorStop(0, `rgba(${TEAL},${(0.07 * smoothstep(0.3, 0.8, s)).toFixed(3)})`);
        ground.addColorStop(1, `rgba(${TEAL},0)`);
        ctx.fillStyle = ground;
        ctx.fillRect(-W, horizon, W * 3, H * 0.16);
        for (let i = 1; i <= 9; i++) {
          const gy = horizon + Math.pow(i, 1.75) * 5.5;
          ctx.fillStyle = `rgba(255,255,255,${(0.05 * (1 - i / 10) * smoothstep(0.35, 0.7, s)).toFixed(3)})`;
          ctx.fillRect(-W, gy, W * 3, 1);
        }
        // horizon line
        const hl = ctx.createLinearGradient(0, 0, W, 0);
        hl.addColorStop(0, `rgba(${TEAL},0)`);
        hl.addColorStop(0.5, `rgba(${TEAL},${(0.32 * smoothstep(0.25, 0.6, s)).toFixed(3)})`);
        hl.addColorStop(1, `rgba(${TEAL},0)`);
        ctx.fillStyle = hl;
        ctx.fillRect(0, horizon, W, 1);

        // far skyline
        layer(0.55, 10, 3);
        for (const st of scene.far) {
          const rise = smoothstep(st.t0, st.t0 + 0.2, s);
          drawStructure(st, cityAlpha, t, horizon, rise, s > 0.55, "#0a1013");
        }

        // mid structures
        layer(1, 22, 7);
        for (const st of scene.mid) {
          const rise = smoothstep(st.t0, st.t0 + 0.22, s);
          drawStructure(st, cityAlpha, t, horizon, rise, s > 0.5, st.landmark ? "#0d1519" : "#0b1216");
          if (st.landmark) {
            // hotspot light — same coordinate the DOM marker uses
            const on = smoothstep(0.85, 1, s) * cityAlpha;
            if (on > 0) {
              const lx = st.landmark.x * W;
              const ly = st.landmark.y * H;
              ctx.fillStyle = `rgba(${TEAL},${(0.9 * on).toFixed(3)})`;
              ctx.fillRect(lx - 1, ly - 1, 2, 2);
            }
          }
        }

        // data streams
        layer(1.35, 32, 10);
        const streamA = smoothstep(0.62, 0.92, s) * cityAlpha;
        if (streamA > 0) {
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 9]);
          for (const sm of scene.streams) {
            ctx.lineDashOffset = reduced ? 0 : -t * sm.speed * 600;
            ctx.strokeStyle = `rgba(${TEAL},${(0.16 * streamA).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(sm.x0, sm.y0);
            ctx.quadraticCurveTo(sm.cx, sm.cy, sm.x1, sm.y1);
            ctx.stroke();
          }
          ctx.setLineDash([]);
          for (const sm of scene.streams) {
            for (let i = 0; i < sm.packets; i++) {
              const u = ((reduced ? 0.3 : t * sm.speed) + sm.phase + i / sm.packets) % 1;
              const mu = 1 - u;
              const x = mu * mu * sm.x0 + 2 * mu * u * sm.cx + u * u * sm.x1;
              const y = mu * mu * sm.y0 + 2 * mu * u * sm.cy + u * u * sm.y1;
              const fade = Math.sin(u * Math.PI);
              ctx.fillStyle = `rgba(${TEAL},${(0.9 * streamA * fade).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(x, y, 1.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = `rgba(${TEAL},${(0.12 * streamA * fade).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(x, y, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // distant travelling lights
        for (const d of scene.drones) {
          if (!reduced) {
            d.x += d.vx;
            if (d.x > W + 20) d.x = -20;
            if (d.x < -20) d.x = W + 20;
          }
          const blink = Math.sin(t * 3 + d.ph) > 0.6 ? 1 : 0.25;
          ctx.fillStyle = `rgba(226,236,236,${(0.5 * blink * cityAlpha * smoothstep(0.7, 1, s)).toFixed(3)})`;
          ctx.fillRect(d.x, d.y, 1.5, 1.5);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = 1;

        /* the pulse — birth of the world */
        const pulseT = smoothstep(0.12, 0.5, s);
        if (pulseT > 0 && pulseT < 1) {
          const r = pulseT * W * 0.55;
          ctx.strokeStyle = `rgba(${TEAL},${((1 - pulseT) * 0.45).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.44, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(${TEAL},${((1 - pulseT) * 0.2).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.44, r * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
        // seed light at the centre before the world exists
        const seed = smoothstep(0.04, 0.16, s) * (1 - smoothstep(0.3, 0.6, s));
        if (seed > 0) {
          const g = ctx.createRadialGradient(W / 2, H * 0.44, 0, W / 2, H * 0.44, 90);
          g.addColorStop(0, `rgba(${TEAL},${(0.6 * seed).toFixed(3)})`);
          g.addColorStop(0.2, `rgba(${TEAL},${(0.18 * seed).toFixed(3)})`);
          g.addColorStop(1, `rgba(${TEAL},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(W / 2 - 90, H * 0.44 - 90, 180, 180);
        }
        // soft light behind the wordmark
        const halo = smoothstep(0.5, 0.9, s) * cityAlpha * 0.075;
        if (halo > 0) {
          const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.26);
          g.addColorStop(0, `rgba(160,230,225,${halo.toFixed(3)})`);
          g.addColorStop(1, "rgba(160,230,225,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
        // breathing ring after arrival
        if (s >= 0.999 && !reduced) {
          const br = W * 0.19 + Math.sin(t * 0.6) * 5;
          ctx.strokeStyle = `rgba(${TEAL},${(0.05 * cityAlpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.44, br, 0, Math.PI * 2);
          ctx.stroke();
        }

        /* fog */
        const fog = ctx.createLinearGradient(0, horizon - H * 0.04, 0, H);
        fog.addColorStop(0, "rgba(5,7,8,0)");
        fog.addColorStop(0.35, `rgba(5,7,8,${(0.55 * cityAlpha).toFixed(3)})`);
        fog.addColorStop(1, `rgba(5,7,8,${(0.98 * cityAlpha).toFixed(3)})`);
        ctx.fillStyle = fog;
        ctx.fillRect(0, horizon - H * 0.04, W, H);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;

      /* foreground motes — dust in the light, drifting through the entire journey */
      const moteGate = smoothstep(0.3, 0.7, s);
      if (moteGate > 0) {
        for (const m of scene.motes) {
          if (!reduced) {
            m.x += m.vx;
            m.y += m.vy;
            if (m.y < -10) m.y = H + 10;
            if (m.x < -10) m.x = W + 10;
            if (m.x > W + 10) m.x = -10;
          }
          let y = m.y - scroll * m.depth * 0.35;
          y = ((y % (H + 20)) + H + 20) % (H + 20) - 10;
          const x = m.x + px * m.depth * 90;
          const a = m.a * moteGate * (0.7 + 0.3 * Math.sin(t * 0.8 + m.ph));
          const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 3);
          g.addColorStop(0, `rgba(${TEAL},${a.toFixed(3)})`);
          g.addColorStop(1, `rgba(${TEAL},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x - m.r * 3, y - m.r * 3, m.r * 6, m.r * 6);
        }
      }

      /* top vignette for HUD legibility */
      const vg = ctx.createLinearGradient(0, 0, 0, H * 0.22);
      vg.addColorStop(0, "rgba(5,7,8,0.7)");
      vg.addColorStop(1, "rgba(5,7,8,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H * 0.22);

      if (reduced) frozenT = 0;
    };

    raf = requestAnimationFrame(frame);
    const unsubscribe = assembly.on("change", () => {
      dirty = true;
    });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [assembly, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    />
  );
}
