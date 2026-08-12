import Blog from "./Blog";
import type { Lang } from "../content";

export default function BlogHome({ lang }: { lang: Lang }) {
  return (
    <main className="blog-home">
      <Blog lang={lang} standalone />
    </main>
  );
}
