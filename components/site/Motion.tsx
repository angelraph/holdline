"use client";
import { useEffect, useRef, useState } from "react";

/** Fade-and-rise on scroll, like Linear's section reveals. */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: { children: React.ReactNode; delay?: number; as?: "div" | "section" | "li"; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: "0px 0px 0px 0px", threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${on ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Live ticking countdown, like Stripe's live counter. */
export function Countdown({ to, label }: { to: string; label: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(`${to}T23:59:59`).getTime();
  const ms = now === null ? 0 : Math.max(0, target - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="countdown" aria-live="off">
      <span className="cd-dot" />
      <span className="cd-label">{label}</span>
      <span className="cd-num">{now === null ? "--d --:--:--" : `${d}d ${p(h)}:${p(m)}:${p(s)}`}</span>
    </div>
  );
}

/** Product preview that flattens from a 3D tilt as it scrolls into view (Linear). */
export function TiltOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top - window.innerHeight * 0.15) / (window.innerHeight * 0.7)));
        el.style.setProperty("--tilt", `${(1 - p) * 18}deg`);
        el.style.setProperty("--lift", `${(1 - p) * 40}px`);
        el.style.setProperty("--fade", `${0.55 + p * 0.45}`);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="tilt">{children}</div>;
}

/** Cursor-following spotlight on cards (Vercel / Linear). */
export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`spot ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/** Flowing gradient ribbon in brand colours (Stripe's hero wave, drawn on canvas). */
export function Ribbon({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    const colors = ["#0b5d82", "#0e8a8a", "#13b38a", "#22d38f", "#7cf0c0"];
    const draw = () => {
      const w = c.clientWidth, h = c.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const k = i / 26;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const y = h * (0.62 - k * 0.34) + Math.sin(x * 0.0045 + t * 0.6 + k * 2.4) * (40 + k * 60) + Math.sin(x * 0.011 - t * 0.4 + k * 5) * 16 - x * 0.18;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const g = ctx.createLinearGradient(0, 0, w, 0);
        colors.forEach((col, j) => g.addColorStop(j / (colors.length - 1), col));
        ctx.strokeStyle = g;
        ctx.globalAlpha = 0.08 + k * 0.5 * (1 - k);
        ctx.lineWidth = 1.2 + (1 - Math.abs(k - 0.5) * 2) * 7;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      t += 0.012;
      if (!still) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);
  return <canvas ref={ref} className={`ribbon ${className}`} aria-hidden />;
}
