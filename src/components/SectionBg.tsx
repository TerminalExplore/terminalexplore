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
    const { destroy } = asciiBackground(el, {
      type,
      colorScheme: "dark",
      opacity,
      color,
      accentColor: "#ffffff",
    });
    return destroy;
  }, [type, opacity, color]);

  return <div ref={ref} className="section-ascii-bg" aria-hidden="true" />;
}
