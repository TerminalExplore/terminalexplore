import type { Content } from "../content";

export default function StaticPage({ t, slug }: { t: Content; slug: string }) {
  const page = t.pages[slug];
  if (!page) return null;
  return (
    <section className="post-page">
      <div className="container">
        <div className="post-content">
          <a href="/" className="post-back mono">← домой</a>
          <header className="post-header">
            <h1>{page.title}</h1>
          </header>
          <div className="post-body">
            <p>{page.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
