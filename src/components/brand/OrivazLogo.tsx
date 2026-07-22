import { Link } from "react-router-dom";

type Props = {
  /** Show a small tagline under the wordmark */
  showTagline?: boolean;
  /** Mark size in px (default 40) */
  size?: number;
  /** Wrap in a Link to "/". Set false when used inside another link. */
  asLink?: boolean;
  className?: string;
};

/**
 * Orivaz brand lockup.
 *
 * The mark is a heritage shield (trust) cradling a home with layered
 * "history strata" beneath it — like the growth rings of a tree or the
 * strata of an archaeological record. A small keystone crowns the shield,
 * borrowing the visual grammar of institutions built to last.
 *
 * No words are needed on the mark itself: the silhouette reads as
 * "a home, protected, with a history worth keeping."
 */
export function OrivazLogo({
  showTagline = false,
  size = 40,
  asLink = true,
  className = "",
}: Props) {
  const content = (
    <span className={`group inline-flex items-center gap-3 font-semibold ${className}`}>
      {/* Mark */}
      <span
        className="relative shrink-0 transition-transform duration-500 group-hover:-translate-y-[1px]"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_1px_2px_rgba(15,23,42,0.25)]"
        >
          {/* Keystone — a small crown that reads as "established / built to last" */}
          <path
            d="M21 3H27L28 6H20L21 3Z"
            fill="#C9A24B"
          />

          {/* Heritage shield — the primary trust vessel */}
          <path
            d="M24 6L42 10V24C42 34 34 41.5 24 45C14 41.5 6 34 6 24V10L24 6Z"
            fill="#0F1E3D"
          />
          {/* Inner rule — engraved seal feel */}
          <path
            d="M24 9L39 12.4V24C39 32.3 32.4 38.7 24 41.8C15.6 38.7 9 32.3 9 24V12.4L24 9Z"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.18"
            strokeWidth="0.75"
          />

          {/* History strata — layered lines beneath the home read as
              tree rings / archaeological layers / years of record */}
          <path d="M12 33H36" stroke="#C9A24B" strokeOpacity="0.55" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M13 35.5H35" stroke="#C9A24B" strokeOpacity="0.4" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M14.5 38H33.5" stroke="#C9A24B" strokeOpacity="0.28" strokeWidth="0.8" strokeLinecap="round" />

          {/* The Home — centered, calm, symmetrical */}
          {/* Roof */}
          <path
            d="M24 15L34 23V31H14V23L24 15Z"
            fill="#F8FAFC"
          />
          {/* Roof shadow line to give weight */}
          <path
            d="M14 23L24 15L34 23"
            stroke="#0F1E3D"
            strokeOpacity="0.12"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
          {/* Chimney — small heritage detail */}
          <rect x="29.5" y="17" width="2" height="3.4" fill="#F8FAFC" />
          {/* Door — the human scale */}
          <path
            d="M22 31V26.5C22 25.4 22.9 24.5 24 24.5C25.1 24.5 26 25.4 26 26.5V31"
            fill="#0F1E3D"
          />
          {/* Doorknob — a whisper of craft */}
          <circle cx="25.2" cy="28" r="0.4" fill="#C9A24B" />
        </svg>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className="text-[1.25rem] font-extrabold tracking-[0.18em] text-foreground">
          ORIVAZ
        </span>
        {showTagline && (
          <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-[0.28em] text-primary">
            Home History
          </span>
        )}
      </span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link to="/" aria-label="Orivaz">
      {content}
    </Link>
  );
}
