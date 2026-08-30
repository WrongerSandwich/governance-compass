"use client";

import { useRouter } from "next/navigation";
import { useStorageValue } from "@/lib/client-storage";

export function CompareButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const stored = useStorageValue("local", "profileId");
  const myProfileId = stored && stored !== profileId ? stored : null;

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
