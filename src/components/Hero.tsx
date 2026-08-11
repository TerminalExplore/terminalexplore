import { useEffect, useRef } from "react";
import type { Content } from "../content";

function stroke(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  width = 1
) {
  ctx.strokeStyle = `rgba(235,235,235,${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();
}

function renderTopoBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const panelW = width * 0.6;
  const cx = panelW * 0.48;
  const cy = height * 0.5;
  const drift = time * 0.18;

  for (let i = 0; i < 9; i++) {
    const rx = panelW * (0.18 + i * 0.046);
    const ry = height * (0.14 + i * 0.032);
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.08; a += 0.08) {
      const wobble = Math.sin(a * 3 + i * 0.7 + drift) * 8 + Math.cos(a * 5 - drift) * 4;
      const x = cx + Math.cos(a) * (rx + wobble);
      const y = cy + Math.sin(a) * (ry + wobble * 0.55);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    stroke(ctx, 0.035 + i * 0.011);
  }

  for (let i = 0; i < 13; i++) {
    const x = panelW * (0.08 + i * 0.055);
    ctx.beginPath();
    ctx.moveTo(x, height * 0.12);
    ctx.lineTo(x + Math.sin(i) * 36, height * 0.82);
    stroke(ctx, 0.028);
  }

  const nodes = [
    [0.18, 0.28],
    [0.36, 0.22],
    [0.52, 0.34],
    [0.48, 0.64],
    [0.24, 0.7],
  ] as const;

  ctx.beginPath();
  nodes.forEach(([x, y], i) => {
    const px = x * panelW;
    const py = y * height;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  stroke(ctx, 0.13, 1.2);

  nodes.forEach(([x, y], i) => {
    const px = x * panelW;
    const py = y * height;
    const pulse = 0.22 + Math.sin(time * 2 + i) * 0.06;
    ctx.fillStyle = `rgba(245,245,245,${pulse})`;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const b = nodes[(i + 1) % nodes.length];
    const phase = (time * 0.22 + i * 0.19) % 1;
    const x = (a[0] + (b[0] - a[0]) * phase) * panelW;
    const y = (a[1] + (b[1] - a[1]) * phase) * height;
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  const gradient = ctx.createLinearGradient(panelW * 0.2, 0, panelW, 0);
  gradient.addColorStop(0, "rgba(255,255,255,0.02)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.055)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, panelW, height);
}

export default function Hero({ t }: { t: Content }) {
  const backdropRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = backdropRef.current;
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
        renderTopoBackdrop(ctx, rect.width, rect.height, reducedMotion ? 0 : now / 1000);
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
        ref={backdropRef}
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
