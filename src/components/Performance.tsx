import { useEffect, useState } from "react";
import type { Content } from "../content";
import SectionBg from "./SectionBg";

export default function Performance({ t }: { t: Content }) {
  const s = t.performance;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || s.items.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % s.items.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [paused, s.items.length]);

  return (
    <section id="performance" className="section section--performance">
      <SectionBg type="stars" opacity={0.35} />
      <div className="section-fade section-fade--performance" />
      <div className="container section-z">
        <div className="perf-header">
          <span className="tag-mono">{s.tag}</span>
          <h2>{s.heading}</h2>
        </div>
        <div className="perf-grid">
          <div
            className="perf-list"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {s.items.map((item, i) => (
              <div
                key={i}
                className={`perf-item${i === active ? " active" : ""}`}
                onClick={() => setActive(i)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(i);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="perf-bar" />
                <div className="perf-body">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="perf-terminal">
            <div className="term-chrome">
              <div className="chrome-dots">
                <i></i>
                <i></i>
                <i></i>
              </div>
              <span className="term-title">{s.termTitle}</span>
            </div>
            <div className="term-body">
              <div className="term-row term-header">
                {s.termHeader.map((h, i) => (
                  <span key={i}>{h}</span>
                ))}
              </div>
              {s.rows.map((row, i) => (
                <div className="term-row" key={i}>
                  <span>
                    <b>{row.region}</b> {row.name}
                  </span>
                  <span className="accent">{row.latency}</span>
                  <span className="dot-live" />
                </div>
              ))}
            </div>
            <div className="term-stats">
              {s.stats.map((stat, i) => (
                <div key={i}>
                  <span className="label">{stat.label}</span>
                  <span className="accent">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
