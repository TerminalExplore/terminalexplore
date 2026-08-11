export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.35" opacity="0.55" />
      <path d="M7 9.2 10.1 12 7 14.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.2 15.1h5.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5.2 5.4h13.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.28" />
      <circle cx="6.5" cy="5.4" r="0.75" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
