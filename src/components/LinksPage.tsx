const primaryLinks = [
  {
    label: "Telegram",
    value: "@TerExpBot",
    href: "https://t.me/TerExpBot",
    meta: "fast contact",
  },
  {
    label: "Email",
    value: "tmxpl@authecode.ru",
    href: "mailto:tmxpl@authecode.ru",
    meta: "projects",
  },
  {
    label: "GitHub",
    value: "TerminalExplore",
    href: "https://github.com/TerminalExplore",
    meta: "code",
  },
];

const resourceLinks = [
  { label: "Website", href: "https://www.tmxpl.ru", meta: "main" },
  { label: "Blog", href: "https://blog.tmxpl.ru", meta: "notes" },
  { label: "Cases", href: "https://www.tmxpl.ru/cases", meta: "work" },
];

export default function LinksPage() {
  return (
    <main className="links-page">
      <div className="links-noise" aria-hidden="true" />
      <section className="links-shell">
        <div className="links-head">
          <div>
            <span className="tag-mono">~/links</span>
            <h1>TerminalExplore</h1>
          </div>
          <span className="links-status">online</span>
        </div>

        <p className="links-lead">
          Code, infrastructure, deployment, monitoring and automation. All useful links in one place.
        </p>

        <div className="links-primary">
          {primaryLinks.map((link) => (
            <a key={link.label} className="links-card" href={link.href} target="_blank" rel="noreferrer">
              <span>{link.meta}</span>
              <strong>{link.label}</strong>
              <b>{link.value}</b>
            </a>
          ))}
        </div>

        <div className="links-list">
          {resourceLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              <span>{link.meta}</span>
              <strong>{link.label}</strong>
              <b>open</b>
            </a>
          ))}
        </div>

        <div className="links-foot">
          <span>tmxpl.ru</span>
          <span>web projects in production</span>
        </div>
      </section>
    </main>
  );
}
