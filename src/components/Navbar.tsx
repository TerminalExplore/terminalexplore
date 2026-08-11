import type { Content, Lang } from "../content";
import Logo from "./Logo";

interface Props {
  t: Content;
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function Navbar({ t, lang, setLang }: Props) {
  const nav = t.nav;
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#top" className="nav-logo">
          <span className="nav-logo-mark">
            <Logo size={18} />
          </span>
          <span>{nav.brand}</span>
        </a>
        <div className="nav-links">
          {nav.links.map((l) => (
            <a key={l.id} href={`#${l.id}`}>
              {l.label}
            </a>
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
          <a href="#cta" className="btn-nav">
            {nav.signup}
          </a>
        </div>
      </div>
    </nav>
  );
}
