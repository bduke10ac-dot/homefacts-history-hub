import { Link } from "react-router-dom";

type Props = {
  /** Show the "Home History" tagline under the wordmark */
  showTagline?: boolean;
  /** Mark size in px (default 36) */
  size?: number;
  /** Wrap in a Link to "/". Set false when used inside another link. */
  asLink?: boolean;
  className?: string;
};

/**
 * Orivaz brand lockup: Verified Home-History Seal + ORIVAZ wordmark.
 * Communicates trust (seal + verification check) and home history (house silhouette).
 */
export function OrivazLogo({
  showTagline = true,
  size = 36,
  asLink = true,
  className = "",
}: Props) {
  const content = (
    <span className={`group inline-flex items-center gap-3 font-semibold ${className}`}>
      {/* Mark */}
      <span
        className="relative shrink-0 transition-transform duration-500 group-hover:-rotate-3"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-sm"
        >
          {/* Navy seal foundation */}
          <circle cx="20" cy="20" r="20" fill="#0F172A" />
          {/* Faint inner ring — evokes a notary stamp border */}
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.14"
            strokeWidth="0.75"
          />
          {/* History arc / timeline curve */}
          <path
            d="M31 20C31 26.0751 26.0751 31 20 31C13.9249 31 9 26.0751 9 20"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* House silhouette (the subject: the home) */}
          <path d="M20 12L13 18V26H27V18L20 12Z" fill="#ffffff" />
          {/* Door detail */}
          <path
            d="M18 26V22H22V26"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Verification badge — the trust mark */}
          <circle cx="29" cy="11" r="5" fill="#2563EB" />
          <path
            d="M27 11L28.5 12.5L31 9.5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className="text-[1.25rem] font-extrabold tracking-[0.14em] text-foreground">
          ORIVAZ
        </span>
        {showTagline && (
          <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-[0.22em] text-primary">
            Home History
          </span>
        )}
      </span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link to="/" aria-label="Orivaz — verified home history">
      {content}
    </Link>
  );
}
