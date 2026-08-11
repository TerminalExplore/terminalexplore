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

  const panelW = width * 0.76;
  const solidW = width * 0.54;
  const step = 42;
  const scan = (time * 55) % (height + 160) - 80;
  const fadeAlpha = (x: number) => {
    if (x <= solidW) return 1;
    return Math.max(0, 1 - (x - solidW) / (panelW - solidW));
  };

  ctx.lineWidth = 1;
  for (let x = 0; x < panelW; x += step) {
    ctx.strokeStyle = `rgba(235,235,235,${0.035 * fadeAlpha(x)})`;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    const gradient = ctx.createLinearGradient(0, 0, panelW, 0);
    gradient.addColorStop(0, "rgba(235,235,235,0.035)");
    gradient.addColorStop(solidW / panelW, "rgba(235,235,235,0.035)");
    gradient.addColorStop(1, "rgba(235,235,235,0)");
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(panelW, y + 0.5);
    ctx.stroke();
  }

  const blocks = [
    [0.08, 0.18, 0.12, 0.08],
    [0.31, 0.16, 0.18, 0.1],
    [0.1, 0.66, 0.16, 0.1],
    [0.44, 0.7, 0.14, 0.08],
  ] as const;

  blocks.forEach(([x, y, w, h], i) => {
    const px = x * panelW;
    const py = y * height;
    const bw = w * panelW;
    const bh = h * height;
    const pulse = 0.06 + Math.max(0, Math.sin(time * 1.6 + i)) * 0.045;
    const fade = fadeAlpha(px + bw);
    ctx.strokeStyle = `rgba(245,245,245,${(0.12 + pulse) * fade})`;
    ctx.strokeRect(px, py, bw, bh);
    ctx.fillStyle = `rgba(245,245,245,${(0.018 + pulse * 0.3) * fade})`;
    ctx.fillRect(px, py, bw, bh);
  });

  const coreX = panelW * 0.38;
  const coreY = height * 0.47;
  const coreW = panelW * 0.2;
  const coreH = height * 0.16;
  const coreFade = fadeAlpha(coreX + coreW);
  ctx.strokeStyle = `rgba(255,255,255,${0.22 * coreFade})`;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(coreX, coreY, coreW, coreH);
  ctx.fillStyle = `rgba(255,255,255,${0.035 * coreFade})`;
  ctx.fillRect(coreX, coreY, coreW, coreH);
  ctx.fillStyle = `rgba(255,255,255,${0.2 * coreFade})`;
  ctx.font = "10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("CORE / EDGE", coreX + 12, coreY + 18);
  ctx.fillText("latency 04ms", coreX + 12, coreY + coreH - 16);

  const racks = [
    [0.5, 0.18, 0.09, 0.44],
    [0.62, 0.28, 0.085, 0.38],
    [0.2, 0.34, 0.1, 0.36],
    [0.08, 0.28, 0.075, 0.46],
  ] as const;

  racks.forEach(([x, y, w, h], rackIndex) => {
    const px = x * panelW;
    const py = y * height;
    const rw = w * panelW;
    const rh = h * height;
    const rackFade = fadeAlpha(px + rw);
    ctx.strokeStyle = `rgba(245,245,245,${0.18 * rackFade})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, rw, rh);
    ctx.fillStyle = "rgba(245,245,245,0.018)";
    ctx.fillRect(px, py, rw, rh);
    ctx.strokeStyle = `rgba(245,245,245,${0.08 * rackFade})`;
    ctx.beginPath();
    ctx.moveTo(px + rw, py);
    ctx.lineTo(px + rw + 14 * rackFade, py + 14);
    ctx.lineTo(px + rw + 14 * rackFade, py + rh + 14);
    ctx.lineTo(px + rw, py + rh);
    ctx.stroke();

    const units = 9;
    for (let u = 1; u < units; u++) {
      const uy = py + (rh / units) * u;
      ctx.strokeStyle = `rgba(245,245,245,${0.075 * rackFade})`;
      ctx.beginPath();
      ctx.moveTo(px + 6, uy);
      ctx.lineTo(px + rw - 6, uy);
      ctx.stroke();
    }

    for (let u = 0; u < units; u++) {
      const uy = py + (rh / units) * u + rh / units / 2;
      const pulse = 0.18 + Math.max(0, Math.sin(time * 2.2 + rackIndex + u * 0.7)) * 0.18;
      ctx.fillStyle = `rgba(245,245,245,${pulse * rackFade})`;
      ctx.fillRect(px + rw - 13, uy - 1.5, 3, 3);
      ctx.fillStyle = `rgba(245,245,245,${0.1 * rackFade})`;
      ctx.fillRect(px + 9, uy - 1, rw * 0.34, 2);
    }

    ctx.fillStyle = `rgba(245,245,245,${0.16 * rackFade})`;
    ctx.font = "9px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(`RACK-0${rackIndex + 1}`, px + 6, py - 12);
  });

  const routeGradient = ctx.createLinearGradient(0, 0, panelW, 0);
  routeGradient.addColorStop(0, "rgba(245,245,245,0.13)");
  routeGradient.addColorStop(solidW / panelW, "rgba(245,245,245,0.13)");
  routeGradient.addColorStop(1, "rgba(245,245,245,0)");
  ctx.strokeStyle = routeGradient;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(panelW * 0.14, height * 0.22);
  ctx.lineTo(panelW * 0.42, height * 0.22);
  ctx.lineTo(panelW * 0.5, height * 0.4);
  ctx.lineTo(panelW * 0.62, height * 0.48);
  ctx.lineTo(panelW * 0.5, height * 0.58);
  ctx.lineTo(panelW * 0.3, height * 0.72);
  ctx.lineTo(panelW * 0.16, height * 0.72);
  ctx.stroke();

  const packetRoutes = [
    [[0.25, 0.52], [0.5, 0.4]],
    [[0.5, 0.4], [0.63, 0.47]],
    [[0.5, 0.56], [0.3, 0.72]],
    [[0.42, 0.22], [0.55, 0.18]],
    [[0.12, 0.51], [0.38, 0.55]],
    [[0.48, 0.48], [0.68, 0.56]],
    [[0.31, 0.38], [0.45, 0.48]],
  ] as const;

  packetRoutes.forEach((route, i) => {
    const phase = (time * 0.2 + i * 0.21) % 1;
    const [a, b] = route;
    const x = (a[0] + (b[0] - a[0]) * phase) * panelW;
    const y = (a[1] + (b[1] - a[1]) * phase) * height;
    ctx.fillStyle = `rgba(255,255,255,${0.58 * fadeAlpha(x)})`;
    ctx.fillRect(x - 2, y - 2, 4, 4);
  });

  const alerts = [
    [0.08, 0.14, "SSH"],
    [0.57, 0.2, "API"],
    [0.17, 0.78, "DB"],
    [0.66, 0.72, "TLS"],
  ] as const;

  alerts.forEach(([x, y, label], i) => {
    const px = x * panelW;
    const py = y * height;
    const fade = fadeAlpha(px + 64);
    const blink = 0.18 + Math.max(0, Math.sin(time * 2.8 + i)) * 0.12;
    ctx.strokeStyle = `rgba(255,255,255,${blink * fade})`;
    ctx.strokeRect(px, py, 58, 22);
    ctx.fillStyle = `rgba(255,255,255,${0.18 * fade})`;
    ctx.font = "9px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(label, px + 8, py + 14);
  });

  for (let i = 0; i < 24; i++) {
    const x = panelW * (0.06 + ((i * 0.073) % 0.72));
    const y = height * (0.1 + ((i * 0.119 + time * 0.018) % 0.74));
    ctx.fillStyle = `rgba(245,245,245,${0.06 * fadeAlpha(x)})`;
    ctx.fillRect(x, y, 18 + (i % 4) * 12, 1);
  }

  const scanGradient = ctx.createLinearGradient(0, scan - 50, 0, scan + 50);
  scanGradient.addColorStop(0, "rgba(255,255,255,0)");
  scanGradient.addColorStop(0.5, "rgba(255,255,255,0.065)");
  scanGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = scanGradient;
  ctx.fillRect(0, scan - 50, solidW, 100);

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
