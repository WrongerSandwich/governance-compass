"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

interface ReturningUserLinkProps {
  label?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  /** Wrapper element type. Defaults to "p" (block). Use "span" for inline usage. */
  as?: "p" | "span" | "div";
  /** Optional non-clickable content rendered inside the wrapper before the link
   *  (e.g. a separator). Only rendered when the link itself renders. */
  prefix?: ReactNode;
}

export function ReturningUserLink({
  label = "or view your existing results",
  className = "text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150",
  wrapperClassName = "mt-2",
  as: Wrapper = "p",
  prefix,
}: ReturningUserLinkProps = {}) {
  const [resultsHref, setResultsHref] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastResults");
    if (!stored) return;
    if (stored.startsWith("id:")) {
      setResultsHref(`/results/${stored.slice(3)}`);
    } else {
      setResultsHref(`/results?r=${stored}`);
    }
  }, []);

  if (!resultsHref) return null;

  return (
    <Wrapper className={wrapperClassName}>
      {prefix}
      <Link href={resultsHref} className={className}>
        {label}
      </Link>
    </Wrapper>
  );
}
