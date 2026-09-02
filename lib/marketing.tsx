import Link from "next/link";

export const MAPS_URL = "https://maps.app.goo.gl/uXotNg5kVUvXVT4t5";
export const INSTAGRAM_URL = "https://www.instagram.com/marshallliquor.613";
export const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=100093053714579";

export function BrandMark() {
  return (
    <span
      className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M3 7.5l9-4 9 4v9l-9 4-9-4v-9z" />
        <path d="M3 7.5l9 4 9-4" />
        <path d="M12 11.5v9" />
        <path d="M7.5 5.25l9 4" />
      </svg>
    </span>
  );
}

export function BrandLockup({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <BrandMark />
      <span className="font-heading text-lg sm:text-xl leading-none text-foreground">
        Marshall <span className="text-primary italic">Liquor</span>
      </span>
    </Link>
  );
}

export function SocialIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground/70 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
    >
      {icon}
    </a>
  );
}

export function InstagramGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M13.5 22v-8.25h2.79l.42-3.24H13.5V8.44c0-.94.26-1.58 1.6-1.58h1.71V3.96A22.87 22.87 0 0 0 14.31 3.8c-2.46 0-4.15 1.5-4.15 4.26v2.45H7.4v3.24h2.76V22h3.34z" />
    </svg>
  );
}

/* --------------------------------- footer ------------------------------ */

export function MarketingFooter({
  nav,
}: {
  nav: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <BrandLockup />
          <p className="text-xs text-muted-foreground max-w-xs">
            Please drink responsibly. Must be 21+ to purchase alcohol.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <SocialIconLink
              href={INSTAGRAM_URL}
              label="Instagram"
              icon={<InstagramGlyph />}
            />
            <SocialIconLink
              href={FACEBOOK_URL}
              label="Facebook"
              icon={<FacebookGlyph />}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {nav.map((n) =>
            n.external ? (
              <a
                key={n.href}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {n.label}
              </a>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className="hover:text-foreground"
              >
                {n.label}
              </Link>
            ),
          )}
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Marshall Liquor Store. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
