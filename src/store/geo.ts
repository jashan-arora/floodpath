import type { LatLng } from '../data/types';

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function distance(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cumulative distance in metres at each vertex. */
export function cumulative(line: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + distance(line[i - 1], line[i]));
  return out;
}

export function pointAt(line: LatLng[], cum: number[], d: number): LatLng {
  if (d <= 0) return line[0];
  const total = cum[cum.length - 1];
  if (d >= total) return line[line.length - 1];
  let i = 1;
  while (cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  const [a, b] = [line[i - 1], line[i]];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function bearingAt(line: LatLng[], cum: number[], d: number): number {
  const a = pointAt(line, cum, Math.max(0, d - 4));
  const b = pointAt(line, cum, d + 4);
  const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Project `p` onto the polyline: distance along it, and how far `p` is from it (metres). */
export function project(line: LatLng[], cum: number[], p: LatLng): { along: number; offset: number } {
  const k = Math.cos(rad(p[0]));
  let best = { along: 0, offset: Infinity };
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]];
    const ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0], px = p[1] * k, py = p[0];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    const q: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const offset = distance(p, q);
    if (offset < best.offset) best = { along: cum[i - 1] + (cum[i] - cum[i - 1]) * t, offset };
  }
  return best;
}

/** The part of `line` between two distances along it. */
export function slice(line: LatLng[], cum: number[], from: number, to: number): LatLng[] {
  const out: LatLng[] = [pointAt(line, cum, from)];
  for (let i = 0; i < line.length; i++) if (cum[i] > from && cum[i] < to) out.push(line[i]);
  out.push(pointAt(line, cum, to));
  return out;
}
