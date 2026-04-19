import type { AnchorHTMLAttributes, ReactNode } from "react";

const INTERNAL_HOSTNAME = "governance-compass.org";

function isExternalHref(href: string | undefined): boolean {
  if (!href) return false;
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    return url.hostname !== INTERNAL_HOSTNAME;
  } catch {
    return false;
  }
}

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

/**
 * External link with hover-only underline, Stone 700 color, and a small
 * arrow indicator. Visually distinct from inline glossary terms (warm
 * gold + dotted underline) so users don't expect a tooltip.
 */
export function ExternalLink({ href, children, className, ...rest }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-stone-700 hover:underline underline-offset-2 transition-colors duration-150 ${className ?? ""}`}
      {...rest}
    >
      {children}
      <span aria-hidden="true" className="inline-block ml-0.5 text-[0.85em] opacity-70">
        &#8599;
      </span>
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

export { isExternalHref };
