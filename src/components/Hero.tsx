import { useEffect, useRef } from "react";
import type { Content } from "../content";

const RAMP = " .:-=+*#%@";

function renderGlobe(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const cols = Math.floor(width / 7);
  const rows = Math.floor(height / 14);
  if (cols < 1 || rows < 1) return;

  const buf: { ch: string; lum: number }[] = new Array(cols * rows);

  const cellW = 7;
  const cellH = 14;
  const rPix = width * 0.5;
  const cxPix = 0;
  const cyPix = height * 0.5;

  const rot = time * 0.4;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const tilt = 0.42;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const period = cols * 1.6;
  const chars = RAMP.length - 1;

  for (let j = 0; j < rows; j++) {
    const yp = (j * cellH - cyPix) / rPix;
    if (yp < -1 || yp > 1) continue;
    const sinLat = yp;
    const cosLat = Math.sqrt(1 - sinLat * sinLat);
    const lat = Math.asin(sinLat);

    for (let i = 0; i < cols; i++) {
      const xp = (i * cellW - cxPix) / rPix;
      const d2 = xp * xp + sinLat * sinLat;
      if (d2 > 1) continue;

      const cosLon = cosLat === 0 ? 0 : xp / cosLat;
      let lon = Math.acos(Math.max(-1, Math.min(1, cosLon)));
      if (i * cellW - cxPix < 0) lon = -lon;

      const y3 = Math.cos(lat) * Math.cos(lon);
      const z3 = Math.cos(lat) * Math.sin(lon) * sinR + Math.sin(lat) * cosR;

      const zt = y3 * sinT + z3 * cosT;

      if (zt < 0) continue;

      const xt = Math.cos(lat) * Math.sin(lon) * cosR - Math.sin(lat) * sinR;
      const yt = y3 * cosT - z3 * sinT;

      const u = (lon + Math.PI) / (2 * Math.PI);
      const v = (lat + Math.PI / 2) / Math.PI;
      const checker =
        Math.floor(u * period) % 2 === Math.floor(v * period * 0.5) % 2 ? 1 : 0.5;

      const nx = Math.cos(lat) * Math.sin(lon);
      const nz = Math.cos(lat) * Math.cos(lon);
      const lx = 0.45;
      const ly = 0.55;
      const lz = 0.72;
      const llen = Math.sqrt(lx * lx + ly * ly + lz * lz);
      let diffuse = (nx * lx + Math.sin(lat) * ly + nz * lz) / llen;
      diffuse = Math.max(0, diffuse);

      const edge = Math.sqrt(xt * xt + yt * yt);
      const limb = Math.pow(zt, 0.55) * (1 - edge * 0.18);

      const lum = checker * (diffuse * 0.7 + 0.22) * limb;
      const idx = Math.round(lum * chars);
      const ch = RAMP[Math.max(0, Math.min(chars, idx))];

      const bi = j * cols + i;
      if (!buf[bi] || buf[bi].lum < lum) {
        buf[bi] = { ch, lum };
      }
    }
  }

  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);
  ctx.font = "14px 'JetBrains Mono', 'Fira Code', monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cell = buf[j * cols + i];
      if (!cell || cell.ch === " ") continue;
      const lum = cell.lum;
      const val = Math.round(232 * lum);
      ctx.fillStyle = `rgb(${val},${val},${val})`;
      ctx.fillText(cell.ch, i * 7, j * 14);
    }
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
        renderGlobe(ctx, rect.width, rect.height, reducedMotion ? 0 : now / 1000);
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
        id="hero-globe"
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
          <div className="hero-ops">
            <div className="hero-ops-head">
              <span>ops.snapshot</span>
              <b>LIVE</b>
            </div>
            <div className="hero-ops-grid">
              <span>frontend</span><b>200</b>
              <span>api</span><b>healthy</b>
              <span>deploy</span><b>atomic</b>
              <span>backup</span><b>daily</b>
            </div>
            <div className="hero-ops-foot">
              <span>uptime 99.9%</span>
              <span>latency 4ms</span>
            </div>
          </div>
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
