import type { Content } from "../content";

export default function Footer({ t }: { t: Content }) {
  const f = t.footer;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {f.columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="footer-brand">{f.brand}</span>
          <span className="dim-sm">{f.copyright}</span>
          <span className="dim-sm">
            {f.credit}{" "}
            <a href={f.creditUrl} target="_blank" rel="noreferrer">
              asciify-engine
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
