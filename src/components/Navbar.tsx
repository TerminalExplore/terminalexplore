import type { Content, Lang } from "../content";

interface Props {
  t: Content;
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function Navbar({ t, lang, setLang }: Props) {
  const nav = t.nav;

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <button type="button" className="nav-logo" onClick={() => scrollToSection("top")}>
          <span className="nav-logo-prompt">~/</span>
          <span>{nav.brand}</span>
        </button>
        <div className="nav-links">
          {nav.links.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollToSection(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="nav-lang"
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            aria-label="Switch language"
          >
            {nav.lang}
          </button>
          <button type="button" className="btn-nav" onClick={() => scrollToSection("cta")}>
            {nav.signup}
          </button>
        </div>
      </div>
    </nav>
  );
}
