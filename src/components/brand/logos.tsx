"use client";

import { useEffect, useRef } from "react";

const TEETH = 14;

/**
 * Modelfuel gear-M mark as an inline SVG (monochrome via currentColor). The
 * gear ring + teeth rotate continuously (~40s/rev) and speed up with scroll
 * velocity; the central "M" stays upright.
 */
export function GearLogo({ className }: { className?: string }) {
  const gearRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = gearRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let angle = 0;
    let boost = 0; // extra deg/sec injected by scrolling
    let last = performance.now();
    let lastScrollY = window.scrollY;
    const base = 360 / 40; // deg per second → 40s per revolution

    const onScroll = () => {
      const y = window.scrollY;
      boost += (y - lastScrollY) * 0.8;
      lastScrollY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      angle = (angle + (base + boost) * dt) % 360;
      boost *= 0.9; // decay back to base speed
      if (Math.abs(boost) < 0.01) boost = 0;
      el.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const teeth = Array.from({ length: TEETH }, (_, i) => (
    <rect
      key={i}
      x={93}
      y={4}
      width={14}
      height={28}
      rx={2}
      transform={`rotate(${(360 / TEETH) * i} 100 100)`}
    />
  ));

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Modelfuel"
    >
      <g
        ref={gearRef}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <g fill="currentColor">{teeth}</g>
        <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="11" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="4" />
      </g>
      <text
        x="100"
        y="104"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="82"
        fontWeight={900}
        fill="currentColor"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        M
      </text>
    </svg>
  );
}

/** Small monochrome Story Protocol "S" mark. */
export function StoryMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Story Protocol"
    >
      <text
        x="50"
        y="54"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="92"
        fontWeight={900}
        fill="currentColor"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        S
      </text>
    </svg>
  );
}
