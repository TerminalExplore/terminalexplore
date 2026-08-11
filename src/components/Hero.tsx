import { useEffect, useRef } from "react";
import type { Content } from "../content";

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  alpha: number,
  width = 1
) {
  ctx.strokeStyle = `rgba(235,235,235,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function renderOpsBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const cx = width * 0.42;
  const horizon = height * 0.3;
  const floor = height * 0.9;
  const drift = (time * 34) % 48;

  for (let i = -18; i <= 18; i++) {
    const x = cx + i * 48;
    line(ctx, x, floor, cx + i * 6, horizon, 0.04);
  }

  for (let i = 0; i < 16; i++) {
    const p = i / 15;
    const y = horizon + Math.pow(p, 1.85) * (floor - horizon) + drift * p * 0.18;
    line(ctx, width * 0.04, y, width * 0.66, y, 0.035 + p * 0.035);
  }

  const nodes = [
    [0.15, 0.3],
    [0.28, 0.22],
    [0.48, 0.28],
    [0.56, 0.51],
    [0.43, 0.7],
    [0.22, 0.66],
  ] as const;

  for (let i = 0; i < nodes.length - 1; i++) {
    const [ax, ay] = nodes[i];
    const [bx, by] = nodes[i + 1];
    line(ctx, ax * width, ay * height, bx * width, by * height, 0.11, 1.1);

    const phase = (time * 0.28 + i * 0.17) % 1;
    const px = (ax + (bx - ax) * phase) * width;
    const py = (ay + (by - ay) * phase) * height;
    ctx.fillStyle = "rgba(245,245,245,0.62)";
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }

  const bracketLeft = width * 0.12;
  const bracketTop = height * 0.31;
  const bracketRight = width * 0.58;
  const bracketBottom = height * 0.68;
  line(ctx, bracketLeft, bracketTop, bracketLeft + 58, bracketTop, 0.16, 1);
  line(ctx, bracketLeft, bracketTop, bracketLeft, bracketTop + 58, 0.16, 1);
  line(ctx, bracketRight - 70, bracketBottom, bracketRight, bracketBottom, 0.12, 1);
  line(ctx, bracketRight, bracketBottom - 70, bracketRight, bracketBottom, 0.12, 1);

  ctx.font = "11px 'JetBrains Mono', 'Fira Code', monospace";
  ctx.textBaseline = "middle";
  for (let i = 0; i < nodes.length; i++) {
    const [x, y] = nodes[i];
    const pulse = 0.18 + Math.sin(time * 2 + i) * 0.06;
    ctx.strokeStyle = `rgba(245,245,245,${pulse})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x * width - 13, y * height - 13, 26, 26);
    ctx.fillStyle = "rgba(245,245,245,0.32)";
    ctx.fillText(`n${i + 1}`, x * width + 18, y * height);
  }

  for (let i = 0; i < 26; i++) {
    const x = ((i * 97) % Math.floor(width * 0.62)) + width * 0.06;
    const y = ((i * 53 + time * 12) % Math.floor(height * 0.62)) + height * 0.16;
    const w = 16 + (i % 5) * 9;
    ctx.fillStyle = `rgba(235,235,235,${0.018 + (i % 3) * 0.01})`;
    ctx.fillRect(x, y, w, 1);
  }
}

export default function Hero({ t }: { t: Content }) {
  const globeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = globeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      if (visible && now - lastFrame > 66) {
        renderOpsBackdrop(ctx, rect.width, rect.height, reducedMotion ? 0 : now / 1000);
        lastFrame = now;
      }
      raf = requestAnimationFrame(frame);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <section id="top" className="hero">
      <canvas
        ref={globeRef}
        id="hero-backdrop"
        width="988"
        height="917"
        aria-hidden="true"
      />
      <div className="hero-fade" />
      <div className="hero-content">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="dot-live" />
            <span>{t.hero.eyebrow}</span>
          </div>
          <h1 dangerouslySetInnerHTML={{ __html: t.hero.title }} />
        </div>
        <div className="hero-right">
          <p>{t.hero.right}</p>
          <ul className="hero-notes">
            <li>React / TypeScript / Node.js</li>
            <li>Docker, Linux, CI/CD</li>
            <li>Monitoring, networks, bots</li>
          </ul>
          <div className="hero-actions">
            <a href="#features" className="btn-hero">{t.hero.cta}</a>
            <a href="/cases" className="btn-hero btn-hero--muted">{t.pages.cases.title}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
