import { useEffect, useState } from "react";
import type { Content, Lang } from "../content";

interface Props {
  t: Content;
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function Navbar({ t, lang, setLang }: Props) {
  const nav = t.nav;
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <span className={lang === "en" ? "is-active" : ""}>EN</span>
            <span className={lang === "ru" ? "is-active" : ""}>RU</span>
          </button>
          <button type="button" className="btn-nav" onClick={() => scrollToSection("cta")}>
            {nav.signup}
          </button>
        </div>
      </div>
      <button
        type="button"
        className={`scroll-top ${showTop ? "is-visible" : ""}`}
        onClick={() => scrollToSection("top")}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </nav>
  );
}
