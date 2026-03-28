"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ReturningUserLink() {
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    setProfileId(localStorage.getItem("profileId"));
  }, []);

  if (!profileId) return null;

  return (
    <p className="mt-2">
      <Link
        href={`/results/${profileId}`}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
      >
        or view your existing results
      </Link>
    </p>
  );
}
