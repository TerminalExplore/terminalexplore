import { useEffect, useRef } from "react";
import type { Content } from "../content";

function renderWatchBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const panelW = width * 0.62;
  const step = 42;
  const scan = (time * 55) % (height + 160) - 80;

  ctx.strokeStyle = "rgba(235,235,235,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < panelW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(panelW, y + 0.5);
    ctx.stroke();
  }

  const blocks = [
    [0.08, 0.18, 0.12, 0.08],
    [0.31, 0.16, 0.2, 0.11],
    [0.52, 0.28, 0.1, 0.18],
    [0.1, 0.66, 0.18, 0.12],
    [0.42, 0.7, 0.16, 0.08],
    [0.64, 0.52, 0.08, 0.14],
  ] as const;

  blocks.forEach(([x, y, w, h], i) => {
    const px = x * panelW;
    const py = y * height;
    const bw = w * panelW;
    const bh = h * height;
    const pulse = 0.06 + Math.max(0, Math.sin(time * 1.6 + i)) * 0.045;
    ctx.strokeStyle = `rgba(245,245,245,${0.12 + pulse})`;
    ctx.strokeRect(px, py, bw, bh);
    ctx.fillStyle = `rgba(245,245,245,${0.018 + pulse * 0.3})`;
    ctx.fillRect(px, py, bw, bh);
  });

  ctx.strokeStyle = "rgba(245,245,245,0.13)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(panelW * 0.14, height * 0.22);
  ctx.lineTo(panelW * 0.42, height * 0.22);
  ctx.lineTo(panelW * 0.58, height * 0.37);
  ctx.lineTo(panelW * 0.58, height * 0.58);
  ctx.lineTo(panelW * 0.3, height * 0.72);
  ctx.lineTo(panelW * 0.16, height * 0.72);
  ctx.stroke();

  for (let i = 0; i < 7; i++) {
    const phase = (time * 0.16 + i * 0.137) % 1;
    const x = panelW * (0.12 + phase * 0.52);
    const y = height * (0.19 + ((i * 0.17 + phase * 0.45) % 0.55));
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  ctx.fillStyle = "rgba(245,245,245,0.06)";
  for (let i = 0; i < 24; i++) {
    const x = panelW * (0.06 + ((i * 0.073) % 0.72));
    const y = height * (0.1 + ((i * 0.119 + time * 0.018) % 0.74));
    ctx.fillRect(x, y, 18 + (i % 4) * 12, 1);
  }

  const scanGradient = ctx.createLinearGradient(0, scan - 50, 0, scan + 50);
  scanGradient.addColorStop(0, "rgba(255,255,255,0)");
  scanGradient.addColorStop(0.5, "rgba(255,255,255,0.075)");
  scanGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = scanGradient;
  ctx.fillRect(0, scan - 50, panelW, 100);

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, panelW, 1);
  }
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
        renderWatchBackdrop(ctx, rect.width, rect.height, reducedMotion ? 0 : now / 1000);
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
