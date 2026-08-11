interface Props {
  name: "terminal" | "pulse" | "gear" | "globe";
}

export default function FeatIcon({ name }: Props) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "terminal":
      return (
        <svg {...common}>
          <path d="M4 6.5h16v11H4z" />
          <path d="m7.5 10 2.4 2-2.4 2" />
          <path d="M12 14h4.5" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common}>
          <path d="M4 13h3l2-6 4 11 2.2-5H20" />
          <path d="M4 19h16" opacity="0.28" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <path d="M5 7.5h14" />
          <path d="M5 12h14" />
          <path d="M5 16.5h14" />
          <path d="M8.5 5.5v4" />
          <path d="M15.5 10v4" />
          <path d="M11 14.5v4" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <path d="M4.5 12a7.5 7.5 0 0 1 15 0 7.5 7.5 0 0 1-15 0Z" />
          <path d="M4.8 10h14.4" />
          <path d="M4.8 14h14.4" />
          <path d="M12 4.5c2 2.2 2 12.8 0 15" />
          <path d="M12 4.5c-2 2.2-2 12.8 0 15" />
        </svg>
      );
  }
}
