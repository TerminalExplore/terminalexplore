import { useEffect, useRef } from "react";
import { asciiBackground } from "asciify-engine";
import type { BackgroundType } from "asciify-engine";

interface Props {
  type?: BackgroundType;
  opacity?: number;
  color?: string;
}

export default function SectionBg({ type = "stars", opacity = 0.2, color = "#e8e8ea" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 760px)").matches;
    if (reduce) return;

    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !cleanup) {
        const { destroy } = asciiBackground(el, {
          type,
          colorScheme: "dark",
          opacity,
          color,
          accentColor: "#ffffff",
        });
        cleanup = destroy;
      } else if (!entry?.isIntersecting && cleanup) {
        cleanup();
        cleanup = undefined;
      }
    }, {
      rootMargin: "180px",
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [type, opacity, color]);

  return <div ref={ref} className="section-ascii-bg" aria-hidden="true" />;
}
