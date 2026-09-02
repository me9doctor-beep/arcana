import { memo, useMemo } from "react";
import { cn } from "@/utils/cn";
import { createRng } from "@/lib/random";

export const VB_W = 1400;
export const VB_H = 900;
const S = 26; // tile size in viewBox units
const OX = VB_W / 2;
const OY = VB_H / 2 + 10;

export interface District {
  id: string;
  index: string;
  name: string;
  gx: number;
  gy: number;
  radius: number;
  hq?: boolean;
  glyph: string;
  desc: string;
  stats: [string, string][];
}

export const DISTRICTS: District[] = [
  {
    id: "hq",
    index: "01",
    name: "Headquarters",
    gx: 0,
    gy: 0,
    radius: 3,
    hq: true,
    glyph: "HQ",
    desc: "The centre of gravity. Every stream of work in the company passes through here and leaves a trace.",
    stats: [
      ["Active members", "148"],
      ["Worlds online", "06"],
      ["Company level", "31"],
    ],
  },
  {
    id: "engineering",
    index: "02",
    name: "Engineering",
    gx: -10,
    gy: 3,
    radius: 3,
    glyph: "EN",
    desc: "Where missions are forged. Sprints run like expeditions, and every merge moves the skyline.",
    stats: [
      ["Active missions", "12"],
      ["Sprint 28", "Day 06 / 10"],
      ["Velocity", "+9%"],
    ],
  },
  {
    id: "design",
    index: "03",
    name: "Design",
    gx: 9,
    gy: -8,
    radius: 3,
    glyph: "DS",
    desc: "The atelier. Systems, surfaces and language are shaped here before they exist anywhere else.",
    stats: [
      ["Systems shipped", "34"],
      ["Components", "412"],
      ["Review queue", "03"],
    ],
  },
  {
    id: "qa",
    index: "04",
    name: "Quality",
    gx: -5,
    gy: -11,
    radius: 2,
    glyph: "QA",
    desc: "The proving grounds. Nothing crosses into the world until it has survived this district.",
    stats: [
      ["Validations", "1,204"],
      ["Escaped defects", "0.4%"],
      ["Coverage", "93%"],
    ],
  },
  {
    id: "analytics",
    index: "05",
    name: "Analytics",
    gx: 10,
    gy: 7,
    radius: 3,
    glyph: "AN",
    desc: "The observatory. Signals from every corner of the company converge into foresight.",
    stats: [
      ["Signals tracked", "2,140"],
      ["Forecast accuracy", "88%"],
      ["Reports", "Live"],
    ],
  },
  {
    id: "launch",
    index: "06",
    name: "Launch",
    gx: -3,
    gy: 12,
    radius: 2,
    glyph: "LX",
    desc: "The gate. Releases leave from here — and when they do, the whole world sees it.",
    stats: [
      ["Next release", "v4.2"],
      ["Countdown", "06d 11h"],
      ["Readiness", "82%"],
    ],
  },
];

export const iso = (x: number, y: number, z = 0) => ({
  x: OX + (x - y) * S,
  y: OY + (x + y) * (S / 2) - z,
});

type Block = { x: number; y: number; h: number; district: number; tall?: boolean };

function buildBlocks(): Block[] {
  const rng = createRng(1202);
  const blocks: Block[] = [];
  DISTRICTS.forEach((d, di) => {
    const r = d.radius;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist > r + 0.5) continue;
        if (!rng.chance(d.hq ? 0.85 : 0.62)) continue;
        const falloff = 1 - dist / (r + 1);
        let h = rng.range(6, 16) + falloff * rng.range(14, 40);
        if (d.hq) h *= 1.8;
        blocks.push({ x: d.gx + dx, y: d.gy + dy, h, district: di });
      }
    }
    // signature tower
    blocks.push({ x: d.gx, y: d.gy, h: d.hq ? 168 : rng.range(64, 92), district: di, tall: true });
  });
  // draw order: farther first
  blocks.sort((a, b) => a.x + a.y - (b.x + b.y) || a.h - b.h);
  return blocks;
}

const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

interface WorldMapProps {
  active: number; // -1 = overview
  className?: string;
}

export const WorldMap = memo(function WorldMap({ active, className }: WorldMapProps) {
  const blocks = useMemo(buildBlocks, []);
  const rng = useMemo(() => createRng(99), []);

  const gridLines = useMemo(() => {
    const lines: string[] = [];
    const R = 24;
    for (let i = -R; i <= R; i += 2) {
      const a = iso(i, -R);
      const b = iso(i, R);
      lines.push(`M${a.x} ${a.y}L${b.x} ${b.y}`);
      const c = iso(-R, i);
      const d = iso(R, i);
      lines.push(`M${c.x} ${c.y}L${d.x} ${d.y}`);
    }
    return lines.join("");
  }, []);

  const roads = useMemo(
    () =>
      DISTRICTS.filter((d) => !d.hq).map((d) => {
        const a = iso(0, 0);
        const b = iso(d.gx, 0);
        const c = iso(d.gx, d.gy);
        return { id: d.id, d: `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}` };
      }),
    [],
  );

  const windows = useMemo(() => {
    const out: { x: number; y: number; d: number; o: number }[] = [];
    for (const b of blocks) {
      if (b.h < 18) continue;
      const rows = Math.floor(b.h / 9);
      for (let k = 1; k < rows; k++) {
        if (!rng.chance(0.45)) continue;
        const face = rng.chance(0.5);
        const p = face ? iso(b.x + 1, b.y + 0.5, k * 9) : iso(b.x + 0.5, b.y + 1, k * 9);
        out.push({ x: p.x, y: p.y, d: b.district, o: rng.range(0.35, 1) });
      }
    }
    return out;
  }, [blocks, rng]);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={cn("block", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id="wm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#37e5d8" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#37e5d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wm-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#37e5d8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#37e5d8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ground grid */}
      <path d={gridLines} stroke="rgba(255,255,255,0.032)" strokeWidth="1" fill="none" />
      <polygon
        points={poly([iso(-24, -24), iso(24, -24), iso(24, 24), iso(-24, 24)])}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* plazas */}
      {DISTRICTS.map((d, i) => {
        const r = d.radius + 0.9;
        const on = active === i;
        return (
          <g key={d.id}>
            {on && (
              <ellipse
                cx={iso(d.gx + 0.5, d.gy + 0.5).x}
                cy={iso(d.gx + 0.5, d.gy + 0.5).y}
                rx={r * S * 2.2}
                ry={r * S * 1.1}
                fill="url(#wm-glow)"
              />
            )}
            <polygon
              points={poly([
                iso(d.gx - r + 0.5, d.gy - r + 0.5),
                iso(d.gx + r + 0.5, d.gy - r + 0.5),
                iso(d.gx + r + 0.5, d.gy + r + 0.5),
                iso(d.gx - r + 0.5, d.gy + r + 0.5),
              ])}
              fill={on ? "rgba(55,229,216,0.035)" : "rgba(255,255,255,0.012)"}
              stroke={on ? "rgba(55,229,216,0.55)" : "rgba(255,255,255,0.08)"}
              strokeWidth="1"
              strokeDasharray={on ? "4 6" : undefined}
              className={cn("transition-all duration-700", on && "motion-safe:animate-dash")}
            />
          </g>
        );
      })}

      {/* roads */}
      {roads.map((r) => {
        const on = DISTRICTS[active]?.id === r.id || active === 0;
        return (
          <g key={r.id}>
            <path d={r.d} stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" strokeLinejoin="round" />
            <path
              d={r.d}
              stroke={on ? "rgba(55,229,216,0.7)" : "rgba(55,229,216,0.22)"}
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 13"
              strokeLinejoin="round"
              className="transition-all duration-700 motion-safe:animate-dash"
            />
          </g>
        );
      })}

      {/* blocks */}
      {blocks.map((b, i) => {
        const on = active === b.district;
        const top = [iso(b.x, b.y, b.h), iso(b.x + 1, b.y, b.h), iso(b.x + 1, b.y + 1, b.h), iso(b.x, b.y + 1, b.h)];
        const right = [iso(b.x + 1, b.y, b.h), iso(b.x + 1, b.y + 1, b.h), iso(b.x + 1, b.y + 1, 0), iso(b.x + 1, b.y, 0)];
        const left = [iso(b.x, b.y + 1, b.h), iso(b.x + 1, b.y + 1, b.h), iso(b.x + 1, b.y + 1, 0), iso(b.x, b.y + 1, 0)];
        const stroke = on ? "rgba(55,229,216,0.42)" : "rgba(255,255,255,0.07)";
        return (
          <g key={i} className="transition-opacity duration-700" style={{ opacity: active === -1 || on ? 1 : 0.55 }}>
            <polygon points={poly(left)} fill={on ? "#0d1a1e" : "#0b1216"} stroke={stroke} strokeWidth="0.75" />
            <polygon points={poly(right)} fill={on ? "#0a1517" : "#080e11"} stroke={stroke} strokeWidth="0.75" />
            <polygon points={poly(top)} fill={on ? "#173236" : "#141d22"} stroke={stroke} strokeWidth="0.75" />
            {b.tall && (
              <>
                <line
                  x1={iso(b.x + 0.5, b.y + 0.5, b.h).x}
                  y1={iso(b.x + 0.5, b.y + 0.5, b.h).y}
                  x2={iso(b.x + 0.5, b.y + 0.5, b.h + (on ? 70 : 28)).x}
                  y2={iso(b.x + 0.5, b.y + 0.5, b.h + (on ? 70 : 28)).y}
                  stroke="url(#wm-beam)"
                  strokeWidth={on ? 2 : 1}
                  className="transition-all duration-700"
                />
                <circle
                  cx={iso(b.x + 0.5, b.y + 0.5, b.h).x}
                  cy={iso(b.x + 0.5, b.y + 0.5, b.h).y}
                  r={on ? 3 : 2}
                  fill="#37e5d8"
                  className="motion-safe:animate-beacon"
                  style={{ animationDelay: `${(i % 7) * 0.4}s` }}
                />
              </>
            )}
          </g>
        );
      })}

      {/* windows */}
      {windows.map((w, i) => (
        <rect
          key={i}
          x={w.x - 1}
          y={w.y - 1}
          width="2"
          height="2"
          fill={active === w.d ? "#37e5d8" : "#cdece9"}
          className="transition-opacity duration-700"
          opacity={active === w.d ? w.o : active === -1 ? w.o * 0.5 : w.o * 0.18}
        />
      ))}

      {/* labels */}
      {DISTRICTS.map((d, i) => {
        const on = active === i;
        const top = iso(d.gx + 0.5, d.gy + 0.5, d.hq ? 168 : 92);
        return (
          <g key={d.id} className="transition-opacity duration-700" style={{ opacity: active === -1 || on ? 1 : 0.35 }}>
            <line x1={top.x} y1={top.y - 8} x2={top.x} y2={top.y - 34} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <text
              x={top.x + 10}
              y={top.y - 32}
              fill={on ? "#37e5d8" : "#a6b0b3"}
              fontFamily="var(--font-mono)"
              fontSize="11"
              letterSpacing="2.4"
              className="transition-colors duration-700"
            >
              {d.index} {d.name.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
