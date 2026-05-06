export function GhostLogo({
  className = "w-8 h-8",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M50 8C24 8 10 28 10 52V110L25 96L40 110L50 100L60 110L75 96L90 110V52C90 28 76 8 50 8Z"
        fill="currentColor"
        className="text-indigo-500 dark:text-indigo-400"
      />
      <circle cx="36" cy="52" r="9" fill="white" />
      <circle cx="64" cy="52" r="9" fill="white" />
      <circle cx="38" cy="54" r="5" fill="#1e1b4b" />
      <circle cx="66" cy="54" r="5" fill="#1e1b4b" />
      <circle cx="40" cy="52" r="2" fill="white" />
      <circle cx="68" cy="52" r="2" fill="white" />
    </svg>
  );
}
