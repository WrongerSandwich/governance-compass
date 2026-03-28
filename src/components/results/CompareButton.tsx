"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CompareButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("profileId");
    if (stored && stored !== profileId) {
      setMyProfileId(stored);
    }
  }, [profileId]);

  if (!myProfileId) return null;

  return (
    <button
      onClick={() => router.push(`/compare/${myProfileId}/${profileId}`)}
      className="border border-stone-600 text-stone-600 py-2 px-6 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150"
    >
      Compare with mine
    </button>
  );
}
