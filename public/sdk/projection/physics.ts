import type { VGEvent } from "../core/event";
import { buildTimeline } from "../recording/timeline";

export type PhysicsOptions = {
  stepMs?: number;
  springK?: number;
  damping?: number;
  drag?: number;
};

type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  fixed: boolean;
};

type Spring = {
  id: string;
  from: string;
  to: string;
  rest: number;
  k: number;
  damping: number;
  active: boolean;
};

export type PhysicsState = {
  time: number;
  particles: Particle[];
  springs: Spring[];
};

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function simulatePhysics(events: VGEvent[], options: PhysicsOptions = {}): PhysicsState {
  const stepMs = options.stepMs ?? 33.333;
  const springK = options.springK ?? 0.6;
  const damping = options.damping ?? 0.2;
  const drag = options.drag ?? 0.02;

  const particles = new Map<string, Particle>();
  const springs = new Map<string, Spring>();

  const timeline = buildTimeline(events, { stepMs });
  let currentTime = 0;
  let timeIndex = 0;

  const step = (dt: number) => {
    const forces = new Map<string, { fx: number; fy: number }>();
    particles.forEach((p) => {
      forces.set(p.id, { fx: 0, fy: 0 });
    });

    springs.forEach((s) => {
      if (!s.active) return;
      const a = particles.get(s.from);
      const b = particles.get(s.to);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
      const nx = dx / dist;
      const ny = dy / dist;
      const stretch = dist - s.rest;
      const relVx = b.vx - a.vx;
      const relVy = b.vy - a.vy;
      const relAlong = relVx * nx + relVy * ny;
      const forceMag = s.k * stretch + s.damping * relAlong;

      const fa = forces.get(a.id)!;
      const fb = forces.get(b.id)!;
      fa.fx += forceMag * nx;
      fa.fy += forceMag * ny;
      fb.fx -= forceMag * nx;
      fb.fy -= forceMag * ny;
    });

    particles.forEach((p) => {
      if (p.fixed) return;
      const f = forces.get(p.id)!;
      p.vx += (f.fx / p.mass) * dt;
      p.vy += (f.fy / p.mass) * dt;
      p.vx *= (1 - drag);
      p.vy *= (1 - drag);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
  };

  const applyEvent = (evt: VGEvent) => {
    if (evt.type === "node.add" && evt.payload) {
      const id = (evt.payload as any).id || evt.id;
      if (particles.has(id)) return;
      particles.set(id, {
        id,
        x: num((evt.payload as any).x, 0),
        y: num((evt.payload as any).y, 0),
        vx: 0,
        vy: 0,
        mass: num((evt.payload as any).mass, 1),
        fixed: Boolean((evt.payload as any).fixed),
      });
      return;
    }
    if (evt.type === "node.move" && evt.payload) {
      const id = (evt.payload as any).id;
      const p = id ? particles.get(id) : undefined;
      if (!p) return;
      p.x = num((evt.payload as any).x, p.x);
      p.y = num((evt.payload as any).y, p.y);
      p.vx = 0;
      p.vy = 0;
      return;
    }
    if (evt.type === "node.select" && evt.payload) {
      const id = (evt.payload as any).id;
      const p = id ? particles.get(id) : undefined;
      if (!p) return;
      if (typeof (evt.payload as any).fixed === "boolean") {
        p.fixed = Boolean((evt.payload as any).fixed);
      }
      return;
    }
    if (evt.type === "edge.add" && evt.payload) {
      const id = (evt.payload as any).id || evt.id;
      const from = (evt.payload as any).from;
      const to = (evt.payload as any).to;
      if (!from || !to) return;
      const a = particles.get(from);
      const b = particles.get(to);
      const dx = a && b ? b.x - a.x : num((evt.payload as any).x2, 0) - num((evt.payload as any).x1, 0);
      const dy = a && b ? b.y - a.y : num((evt.payload as any).y2, 0) - num((evt.payload as any).y1, 0);
      const dist = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
      const rest = num((evt.payload as any).length, dist);
      springs.set(id, {
        id,
        from,
        to,
        rest,
        k: num((evt.payload as any).k, springK),
        damping: num((evt.payload as any).damping, damping),
        active: true,
      });
      return;
    }
    if (evt.type === "edge.remove" && evt.payload) {
      const id = (evt.payload as any).id;
      const s = id ? springs.get(id) : undefined;
      if (s) s.active = false;
    }
  };

  while (timeIndex < timeline.length) {
    const next = timeline[timeIndex];
    const target = next.t;
    const dt = stepMs / 1000;
    while (currentTime + dt <= target) {
      step(dt);
      currentTime += dt;
    }
    applyEvent(next.evt);
    timeIndex += 1;
  }

  return {
    time: currentTime,
    particles: Array.from(particles.values()),
    springs: Array.from(springs.values()),
  };
}
