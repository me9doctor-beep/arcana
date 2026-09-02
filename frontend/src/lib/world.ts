/**
 * Shared layout for the hero environment.
 * The canvas paints the structures and the DOM places hover hotspots
 * at the very same normalized coordinates.
 */
export const HORIZON = 0.74; // fraction of viewport height where the city meets the fog
export const HERO_TRAVEL = 0.7; // how many viewport-heights of scroll the hero "descent" lasts

export interface Landmark {
  id: string;
  x: number; // 0..1 of viewport width
  y: number; // 0..1 of viewport height (position of the hotspot light)
  height: number; // structure height as fraction of viewport height
  width: number; // structure width in px (base, scaled by viewport)
  label: string;
  meta: string;
}

export const LANDMARKS: Landmark[] = [
  {
    id: "engineering",
    x: 0.19,
    y: 0.585,
    height: 0.31,
    width: 54,
    label: "Engineering Guild",
    meta: "Active missions · 12",
  },
  {
    id: "hq",
    x: 0.5,
    y: 0.665,
    height: 0.44,
    width: 68,
    label: "Arcana HQ",
    meta: "148 active members",
  },
  {
    id: "product",
    x: 0.81,
    y: 0.6,
    height: 0.28,
    width: 60,
    label: "Product World",
    meta: "Progress · 87%",
  },
];

export const CHAPTERS = [
  { id: "hero", label: "Threshold" },
  { id: "idea", label: "The Idea" },
  { id: "world", label: "The World" },
  { id: "quest", label: "The Quest" },
  { id: "guild", label: "The Guild" },
  { id: "intelligence", label: "Intelligence" },
  { id: "progression", label: "Progression" },
  { id: "chronicle", label: "Chronicle" },
  { id: "evolves", label: "Evolution" },
  { id: "enter", label: "Enter" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];
