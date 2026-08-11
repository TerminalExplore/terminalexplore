import type { Content } from "../content";
import SectionBg from "./SectionBg";

export default function CTA({ t }: { t: Content }) {
  const s = t.cta;
  return (
    <section id="cta" className="section section--cta">
      <SectionBg type="aurora" opacity={0.4} />
      <div className="section-fade section-fade--cta" />
      <div className="cta-inner section-z">
        <div className="cta-badge">
          <span className="dot-live" />
          <span>{s.badge}</span>
        </div>
        <h2>{s.heading}</h2>
        <p>{s.desc}</p>
        <a href="https://t.me/TerExpBot" className="btn-primary">
          {s.button}
        </a>
      </div>
    </section>
  );
}
