import { useEffect, useState } from "react";
import { api } from "../api";
import type { Lang } from "../content";
import type { Post } from "../types";
import SectionBg from "./SectionBg";

function formatDate(value: string, lang: Lang) {
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export default function Blog({ lang = "en" }: { lang?: Lang }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const emptyText = lang === "ru" ? "Посты скоро появятся." : "Posts are coming soon.";
  const readText = lang === "ru" ? "читать ->" : "read ->";

  useEffect(() => {
    api.getPosts().then(setPosts).catch(() => {});
  }, []);

  return (
    <section id="blog" className="section section--blog">
      <SectionBg type="grid" opacity={0.25} />
      <div className="section-fade section-fade--blog" />
      <div className="container section-z">
        <div className="blog-header">
          <span className="tag-mono">blog</span>
          <h2>explore your terminal</h2>
        </div>
        {posts.length > 0 ? (
          <div className="blog-grid">
            {posts.map((post) => (
              <a className="blog-card" key={post.id} href={`/post/${post.slug}`}>
                <div className="blog-card-top">
                  <span className="blog-tag">{post.tag || "notes"}</span>
                  <span className="mono dim-sm">{formatDate(post.created_at, lang)}</span>
                </div>
                {post.cover_url && <img className="blog-cover" src={post.cover_url} alt="" loading="lazy" />}
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-card-bottom">
                  <span className="blog-read-more">{readText}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="blog-empty">
            <span className="mono">status</span>
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}
