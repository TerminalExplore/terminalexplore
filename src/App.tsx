import { useEffect, useState } from "react";
import { content, type Lang } from "./content";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Integration from "./components/Integration";
import Performance from "./components/Performance";
import Blog from "./components/Blog";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Admin from "./components/Admin";
import BlogPostPage from "./components/BlogPostPage";
import StaticPage from "./components/StaticPage";
import CasesPage from "./components/CasesPage";
import { api } from "./api";
import { setHomeSeo } from "./seo";

type Route =
  | { page: "home" }
  | { page: "admin" }
  | { page: "blog-post"; slug: string }
  | { page: "static"; slug: string };

function parsePath(): Route {
  const p = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (p === "admin") return { page: "admin" };
  if (p.startsWith("post/")) return { page: "blog-post", slug: p.slice(5) };
  if (["cases", "status", "privacy", "terms"].includes(p))
    return { page: "static", slug: p };
  return { page: "home" };
}

const isBlog = window.location.hostname === "blog.tmxpl.ru";

export default App;
function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [route, setRoute] = useState<Route>(parsePath);
  const t = content[lang];

  useEffect(() => {
    const onPop = () => setRoute(parsePath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (route.page !== "blog-post") setHomeSeo();
  }, [route.page]);

  useEffect(() => {
    api.trackView(window.location.pathname).catch(() => {});
  }, [route]);

  if (route.page === "admin") {
    return (
      <main style={{ minHeight: "100vh", paddingTop: "var(--nav-h)" }}>
        <Admin />
      </main>
    );
  }

  if (isBlog) {
    if (route.page === "blog-post") {
      return (
        <div className="blog-site">
          <header className="blog-navbar">
            <a href="/" className="nav-logo">explore&nbsp;your&nbsp;terminal</a>
          </header>
          <main style={{ paddingTop: "var(--nav-h)" }}>
            <BlogPostPage slug={route.slug} api={api} />
          </main>
          <Footer t={t} />
        </div>
      );
    }
    return (
      <div className="blog-site">
        <header className="blog-navbar">
          <a href="/" className="nav-logo">explore&nbsp;your&nbsp;terminal</a>
        </header>
        <main style={{ paddingTop: "var(--nav-h)" }}>
          <Blog lang={lang} />
        </main>
        <Footer t={t} />
      </div>
    );
  }

  if (route.page === "blog-post") {
    return (
      <main style={{ minHeight: "100vh", paddingTop: "var(--nav-h)" }}>
        <BlogPostPage slug={route.slug} api={api} />
      </main>
    );
  }

  if (route.page === "static") {
    if (route.slug === "cases") {
      return (
        <>
          <Navbar t={t} lang={lang} setLang={setLang} />
          <main style={{ minHeight: "100vh", paddingTop: "var(--nav-h)" }}>
            <CasesPage />
          </main>
          <Footer t={t} />
        </>
      );
    }
    return (
      <>
        <Navbar t={t} lang={lang} setLang={setLang} />
        <main style={{ minHeight: "100vh", paddingTop: "var(--nav-h)" }}>
          <StaticPage t={t} slug={route.slug} />
        </main>
        <Footer t={t} />
      </>
    );
  }

  return (
    <>
      <Navbar t={t} lang={lang} setLang={setLang} />
      <main>
        <Hero t={t} />
        <Integration t={t} />
        <Performance t={t} />
        <Blog lang={lang} />
        <Features t={t} />
        <CTA t={t} />
      </main>
      <Footer t={t} />
    </>
  );
}
