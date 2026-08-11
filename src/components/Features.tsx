import type { Content } from "../content";
import SectionBg from "./SectionBg";
import FeatIcon from "./FeatIcon";

export default function Features({ t }: { t: Content }) {
  const s = t.features;
  return (
    <section id="features" className="section section--features">
      <SectionBg type="pulse" opacity={0.3} />
      <div className="section-fade section-fade--features" />
      <div className="container section-z">
        <div className="feat-header">
          <span className="tag-mono">{s.tag}</span>
          <h2>{s.heading}</h2>
        </div>
        <div className="feat-grid">
          {s.cards.map((card) => (
            <div className="feat-card" key={card.num}>
              <div className="feat-icon">
                <FeatIcon name={card.icon} />
              </div>
              <span className="feat-num">{card.num}</span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <div className="feat-tags">
                {card.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
