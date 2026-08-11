import { useEffect, useState } from "react";
import { renderMarkdown } from "../markdown";
import { setPostSeo } from "../seo";
import type { Post } from "../types";

interface Props {
  slug: string;
  api: {
    getPost: (slug: string) => Promise<Post>;
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "long", day: "2-digit" }).format(new Date(value));
}

export default function BlogPostPage({ slug, api }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.getPost(slug)
      .then((data) => {
        setPost(data);
        setPostSeo(data);
      })
      .catch((e) => setErr(e.message));
  }, [slug, api]);

  if (err) return <section className="post-page"><p className="dim-sm">Пост не найден.</p></section>;
  if (!post) return <section className="post-page"><p className="dim-sm">Загрузка...</p></section>;

  return (
    <section className="post-page">
      <article className="post-content">
        <a href="/" className="post-back mono">← назад</a>
        <header className="post-header">
          <div className="post-meta mono">
            <span className="blog-tag">{post.tag || "notes"}</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
          {post.cover_url && <img className="post-cover" src={post.cover_url} alt="" />}
          <h1>{post.title}</h1>
          {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
        </header>
        <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
      </article>
    </section>
  );
}
