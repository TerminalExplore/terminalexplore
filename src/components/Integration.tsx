import type { Content } from "../content";
import SectionBg from "./SectionBg";

export default function Integration({ t }: { t: Content }) {
  const s = t.integration;
  return (
    <section id="integration" className="section section--integration">
      <SectionBg type="rain" opacity={0.35} />
      <div className="section-fade section-fade--integration" />
      <div className="container section-z">
        <div className="code-layout">
          <div className="code-intro">
            <span className="tag-mono">{s.tag}</span>
            <h2 dangerouslySetInnerHTML={{ __html: s.heading }} />
            <p>{s.desc}</p>
            <div className="code-ctas">
              <a href="#cta" className="btn-primary">
                {s.ctaPrimary}
              </a>
              <a href="#features" className="btn-text">
                {s.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="code-card">
            <div className="code-chrome">
              <div className="chrome-dots">
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div className="chrome-tabs">
                {s.tabs.map((tab) => (
                  <span
                    key={tab.name}
                    className={`chrome-tab${tab.active ? " active" : ""}`}
                  >
                    {tab.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="code-install-bar">
              <span className="dim">$</span> {s.install}
            </div>
            <pre className="code-body">
              <code>
                {s.code.map((line, i) => (
                  <span key={i}>
                    {line.map((span, j) => (
                      <span key={j} className={span.cls}>
                        {span.text}
                      </span>
                    ))}
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
