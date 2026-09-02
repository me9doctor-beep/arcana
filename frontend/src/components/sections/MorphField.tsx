import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { createRng, lerp, smoothstep } from "@/lib/random";

type Dot = {
  gx: number; // grid position (fraction)
  gy: number;
  wx: number; // world position (fraction)
  wy: number;
  key: number; // sweep key 0..1
  col: number; // tower column index or -1 for sky
  row: number;
  tw: number;
};

interface MorphFieldProps {
  progress: MotionValue<number>;
  reduced: boolean;
}

/**
 * Ordinary data → a living environment.
 * A strict grid of cells (a spreadsheet) is swept by a front; passed cells lift
 * into a skyline of light-points, threading themselves into towers.
 */
export function MorphField({ progress, reduced }: MorphFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dots: Dot[] = [];
    let towers: number[][] = []; // indices per column
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let last = -1;
    const start = performance.now();

    const build = () => {
      const rng = createRng(7);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      const small = W < 768;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      const cols = small ? 18 : 40;
      const rows = small ? 15 : 16;
      const towerCount = small ? 12 : 28;
      const heights = Array.from({ length: towerCount }, (_, i) => {
        const c = Math.abs(i - towerCount / 2) / (towerCount / 2);
        return Math.round(lerp(30, 9, c * c) * rng.range(0.6, 1.25));
      });
      towers = heights.map(() => []);
      dots = [];
      const horizon = 0.86;
      const spacing = small ? 6 : 7;
      let idx = 0;
      const total = cols * rows;
      // pre-plan tower slots
      const slots: { col: number; row: number }[] = [];
      heights.forEach((h, col) => {
        for (let r = 0; r < h; r++) slots.push({ col, row: r });
      });
      // shuffle slots deterministically
      for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = 0.06 + (c / (cols - 1)) * 0.88;
          const gy = 0.14 + (r / (rows - 1)) * 0.72;
          let wx: number;
          let wy: number;
          let col = -1;
          let row = -1;
          const slot = slots[idx];
          if (slot && idx < total) {
            col = slot.col;
            row = slot.row;
            const cx = 0.08 + (col / (towerCount - 1)) * 0.84;
            wx = cx + rng.range(-0.002, 0.002);
            wy = horizon - (row * spacing) / H;
            towers[col].push(dots.length);
          } else {
            wx = rng.range(0.02, 0.98);
            wy = rng.range(0.05, horizon - 0.05) * rng.range(0.6, 1);
          }
          dots.push({
            gx,
            gy,
            wx,
            wy,
            key: gx * 0.82 + gy * 0.18 + rng.range(-0.03, 0.03),
            col,
            row,
            tw: rng.range(0, 6.28),
          });
          idx++;
        }
      }
      for (const t of towers) t.sort((a, b) => dots[a].row - dots[b].row);
      last = -1;
    };

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(canvas);

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const p = progress.get();
      const t = reduced ? 0 : (now - start) / 1000;
      if (reduced && p === last) return;
      last = p;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const front = -0.15 + p * 1.35;
      const pos: Float32Array = new Float32Array(dots.length * 3);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // cells left of the sweeping front have already been transmuted
        const a = 1 - smoothstep(front - 0.12, front + 0.02, d.key);
        const e = a * a * (3 - 2 * a);
        const x = lerp(d.gx, d.wx, e) * W;
        const y = lerp(d.gy, d.wy, e) * H + (reduced ? 0 : Math.sin(t * 0.7 + d.tw) * 1.2 * e);
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = e;
      }

      // tower threads
      ctx.lineWidth = 1;
      for (const tower of towers) {
        for (let k = 0; k < tower.length - 1; k++) {
          const i = tower[k];
          const j = tower[k + 1];
          const e = Math.min(pos[i * 3 + 2], pos[j * 3 + 2]);
          if (e < 0.92) continue;
          const a = (e - 0.92) / 0.08;
          ctx.strokeStyle = `rgba(55,229,216,${(0.26 * a).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(pos[i * 3], pos[i * 3 + 1]);
          ctx.lineTo(pos[j * 3], pos[j * 3 + 1]);
          ctx.stroke();
        }
      }
      // ground line once the world forms
      const groundA = smoothstep(0.35, 0.8, p);
      if (groundA > 0) {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, "rgba(55,229,216,0)");
        g.addColorStop(0.5, `rgba(55,229,216,${(0.3 * groundA).toFixed(3)})`);
        g.addColorStop(1, "rgba(55,229,216,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, H * 0.86 + 6, W, 1);
      }

      // dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const x = pos[i * 3];
        const y = pos[i * 3 + 1];
        const e = pos[i * 3 + 2];
        if (e < 0.5) {
          // data cell
          const a = 0.22 + 0.1 * Math.sin(t * 0.5 + d.tw);
          ctx.fillStyle = `rgba(166,176,179,${(a * (1 - e * 1.6)).toFixed(3)})`;
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        } else {
          const tw = reduced ? 0.85 : 0.7 + 0.3 * Math.sin(t * 1.3 + d.tw);
          const a = (d.col >= 0 ? 0.85 : 0.4) * tw * Math.min(1, (e - 0.5) * 2 + 0.3);
          ctx.fillStyle = `rgba(55,229,216,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, d.col >= 0 ? 1.4 : 1, 0, Math.PI * 2);
          ctx.fill();
          if (d.col >= 0 && d.row === towers[d.col].length - 1) {
            // crown light
            ctx.fillStyle = `rgba(55,229,216,${(0.12 * tw).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [progress, reduced]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
