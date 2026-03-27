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
      className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
    >
      Compare with Mine
    </button>
  );
}
