import { useEffect, useState } from "react";
import { api } from "../api";
import type { Post } from "../types";
import SectionBg from "./SectionBg";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);

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
        <div className="blog-grid">
          {posts.map((post) => (
            <a className="blog-card" key={post.id} href={`/post/${post.slug}`}>
              <div className="blog-card-top">
                <span className="blog-tag">{post.tag || "notes"}</span>
                <span className="mono dim-sm">{formatDate(post.created_at)}</span>
              </div>
              {post.cover_url && <img className="blog-cover" src={post.cover_url} alt="" loading="lazy" />}
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="blog-card-bottom">
                <span className="blog-read-more">читать -&gt;</span>
              </div>
            </a>
          ))}
          {posts.length === 0 && <p className="dim-sm">Пока нет опубликованных постов.</p>}
        </div>
      </div>
    </section>
  );
}
