"use client";

import { useEffect, useRef } from "react";

/**
 * The eight tool icons are generic icon-style renderings (rounded rect +
 * lines, a folded-page shape, etc.) rather than trademarked logo
 * reproductions — same call made for these exact shapes in the standalone
 * mockup this page ports (see homepage-mockup-spec.md).
 */
const CHAOS_ICONS: { key: string; color: string; path: React.ReactNode }[] = [
  {
    key: "notion-like",
    color: "#9ca3af",
    path: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </>
    ),
  },
  {
    key: "code-host",
    color: "#e5e7eb",
    path: (
      <>
        <path d="M6 3v12a3 3 0 0 0 3 3h9" />
        <circle cx="6" cy="3" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M18 8v8" />
      </>
    ),
  },
  {
    key: "chat",
    color: "#a78bfa",
    path: (
      <>
        <rect x="9" y="2" width="6" height="20" rx="3" />
        <rect x="2" y="9" width="20" height="6" rx="3" />
      </>
    ),
  },
  {
    key: "editor",
    color: "#60a5fa",
    path: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
  },
  {
    key: "browser-tabs",
    color: "#facc15",
    path: (
      <>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 6l2-3h5l2 3" />
      </>
    ),
  },
  {
    key: "terminal",
    color: "#4ade80",
    path: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="6 9 10 12 6 15" />
        <line x1="12" y1="15" x2="16" y2="15" />
      </>
    ),
  },
  {
    key: "text-file",
    color: "#f472b6",
    path: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
  },
  {
    key: "bookmark",
    color: "#38bdf8",
    path: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  },
];

const ICON_SIZE = 56;
const MOUSE_RADIUS = 110;
const MOUSE_FORCE = 0.55;
const MAX_SPEED = 1.4;
const REPEL_SPEED_CAP = MAX_SPEED * 1.3;

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  pulsePhase: number;
}

/**
 * Icons drift, bounce off the stage walls, and gently repel from the mouse —
 * ported from the mockup's requestAnimationFrame loop onto refs instead of
 * direct DOM queries.
 */
export function ChaosVisual() {
  const stageRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    const icons = iconRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (!stage || !icons.length) return;

    let bounds = stage.getBoundingClientRect();
    const handleResize = () => {
      bounds = stage.getBoundingClientRect();
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = icons.map((el, i) => {
      const angle = (i / icons.length) * Math.PI * 2;
      return {
        el,
        x: bounds.width / 2 + Math.cos(angle) * (bounds.width * 0.28) - ICON_SIZE / 2,
        y: bounds.height / 2 + Math.sin(angle) * (bounds.height * 0.28) - ICON_SIZE / 2,
        vx: (Math.random() - 0.5) * MAX_SPEED,
        vy: (Math.random() - 0.5) * MAX_SPEED,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.6,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    let mouseX = -9999;
    let mouseY = -9999;
    let mouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;
    };
    const handleMouseLeave = () => {
      mouseActive = false;
      mouseX = -9999;
      mouseY = -9999;
    };
    stage.addEventListener("mousemove", handleMouseMove);
    stage.addEventListener("mouseleave", handleMouseLeave);

    let t = 0;
    let frameId = 0;

    function tick() {
      t += 1;
      const w = bounds.width;
      const h = bounds.height;

      for (const p of particles) {
        if (mouseActive) {
          const cx = p.x + ICON_SIZE / 2;
          const cy = p.y + ICON_SIZE / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < MOUSE_RADIUS) {
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_FORCE;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > REPEL_SPEED_CAP) {
          p.vx = (p.vx / speed) * REPEL_SPEED_CAP;
          p.vy = (p.vy / speed) * REPEL_SPEED_CAP;
        }
        if (speed < 0.15) {
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x <= 0) {
          p.x = 0;
          p.vx *= -1;
        }
        if (p.x >= w - ICON_SIZE) {
          p.x = w - ICON_SIZE;
          p.vx *= -1;
        }
        if (p.y <= 0) {
          p.y = 0;
          p.vy *= -1;
        }
        if (p.y >= h - ICON_SIZE) {
          p.y = h - ICON_SIZE;
          p.vy *= -1;
        }

        p.rot += p.rotSpeed;
        const scale = 1 + Math.sin(t * 0.03 + p.pulsePhase) * 0.08;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${scale})`;
      }

      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full lg:max-w-[420px] lg:flex-1">
      <p className="mb-2.5 text-center text-sm font-medium text-muted-foreground/70">
        Your knowledge today...
      </p>
      <div
        ref={stageRef}
        className="relative h-80 overflow-hidden rounded-2xl border border-border bg-card"
      >
        {CHAOS_ICONS.map((icon, i) => (
          <div
            key={icon.key}
            ref={(el) => {
              iconRefs.current[i] = el;
            }}
            className="absolute top-0 left-0 size-14 rounded-xl border border-border bg-secondary p-3.5"
            style={{ color: icon.color, willChange: "transform", pointerEvents: "none" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              {icon.path}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
