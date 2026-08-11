import { useEffect, useRef } from "react";
import type { Content } from "../content";

const RAMP = " .:-=+*#%@";
const WIRE = ["/", "=", "\\", "|", "\\", "/", "+", "-", "|", "."];

function renderAsciiBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const panelW = width * 0.58;
  const cellW = 8;
  const cellH = 14;
  const cols = Math.ceil(panelW / cellW);
  const rows = Math.ceil(height / cellH);
  const phase = Math.floor(time * 8);

  ctx.font = "13px 'JetBrains Mono', 'Fira Code', monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x / cols;
      const py = y / rows;
      const titleZone = px > 0.18 && px < 0.86 && py > 0.32 && py < 0.68;
      const edgeZone = px < 0.08 || px > 0.9 || py < 0.12 || py > 0.8;
      const ring =
        Math.abs(px - 0.53) * 1.55 +
        Math.abs(py - 0.5) * 1.12 +
        Math.sin(x * 0.18 + y * 0.09 + time * 0.45) * 0.06;

      let alpha = edgeZone ? 0.105 : 0.052;
      if (titleZone) alpha *= 0.18;
      if (ring > 0.43 && ring < 0.56) alpha += titleZone ? 0.01 : 0.07;
      if ((x + phase) % 23 === 0 && y % 5 === 0) alpha += 0.045;
      if (px > 0.86) alpha *= 0.35;

      if (alpha < 0.018) continue;

      const rampIndex = Math.abs((x * 7 + y * 11 + phase) % RAMP.length);
      const ch =
        x % 19 === 0 || y % 9 === 0
          ? WIRE[Math.abs(x + y + phase) % WIRE.length]
          : RAMP[rampIndex];

      ctx.fillStyle = `rgba(232,232,232,${Math.min(alpha, 0.22)})`;
      ctx.fillText(ch, x * cellW, y * cellH);
    }
  }

  const panelRight = panelW - cellW * 3;
  ctx.fillStyle = "rgba(245,245,245,0.14)";
  ctx.fillText("+-- deploy / api / monitor", panelW * 0.13, height * 0.25);
  ctx.fillText("+-- containers: healthy", panelW * 0.6, height * 0.72);
  ctx.fillStyle = "rgba(245,245,245,0.08)";
  ctx.fillRect(panelRight, height * 0.1, 1, height * 0.74);
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
        renderAsciiBackdrop(ctx, rect.width, rect.height, reducedMotion ? 0 : now / 1000);
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
