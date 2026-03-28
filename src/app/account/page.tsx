"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AxisVisibility {
  axisId: number;
  axisName: string;
  domain: string;
  hidden: boolean;
}

interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [axes, setAxes] = useState<AxisVisibility[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const stored = localStorage.getItem("profileId");
    setProfileId(stored);

    fetch("/api/account/data")
      .then((r) => r.json())
      .then((data) => {
        setAxes(data.axisVisibility || []);
        setGroups(data.groups || []);
        if (data.profileId) setProfileId(data.profileId);
      })
      .catch(() => {});
  }, [session]);

  const handleClaim = async () => {
    const token = localStorage.getItem("anonymousToken");
    if (!token) {
      setClaimStatus("No anonymous profile found to claim.");
      return;
    }
    const res = await fetch("/api/auth/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousToken: token }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfileId(data.profileId);
      setClaimStatus("Profile claimed successfully!");
    } else {
      const data = await res.json();
      setClaimStatus(data.error || "Failed to claim profile.");
    }
  };

  const toggleVisibility = async (axisId: number, hidden: boolean) => {
    await fetch("/api/account/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axisId, hidden }),
    });
    setAxes((prev) =>
      prev.map((a) => (a.axisId === axisId ? { ...a, hidden } : a))
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName }),
    });
    if (res.ok) {
      setNewGroupName("");
      window.location.reload();
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode.trim() }),
    });
    if (res.ok) {
      setJoinCode("");
      window.location.reload();
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-text-tertiary">Loading...</p>
      </main>
    );
  }

  // Group axes by domain
  const axesByDomain = axes.reduce<Record<string, AxisVisibility[]>>(
    (acc, axis) => {
      if (!acc[axis.domain]) acc[axis.domain] = [];
      acc[axis.domain].push(axis);
      return acc;
    },
    {}
  );

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-1">Account</h1>
        <p className="text-text-tertiary text-sm mb-8">{session?.user?.email}</p>

        {/* Profile link / claim */}
        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-6">
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
            Your profile
          </h2>
          {profileId ? (
            <Link
              href={`/results/${profileId}`}
              className="text-stone-600 hover:text-stone-800 text-sm"
            >
              View your results &rarr;
            </Link>
          ) : (
            <div>
              <p className="text-text-secondary text-sm mb-3">
                If you took the assessment before creating an account, you can
                link those results to your account.
              </p>
              <button
                onClick={handleClaim}
                className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150"
              >
                Claim anonymous profile
              </button>
              {claimStatus && (
                <p className="text-sm mt-2 text-text-secondary">{claimStatus}</p>
              )}
            </div>
          )}
        </section>

        {/* Axis visibility */}
        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-6">
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-1">
            Privacy
          </h2>
          <p className="text-sm text-text-tertiary mb-4">
            Hide governance axes from comparisons. Hidden axes
            won&apos;t appear when others compare with you.
          </p>
          <div className="space-y-5">
            {Object.entries(axesByDomain).map(([domain, domainAxes]) => (
              <div key={domain}>
                <h3 className="text-[11px] uppercase tracking-[0.08em] text-stone-800 font-medium mb-2">
                  {domain}
                </h3>
                <div className="space-y-1">
                  {domainAxes.map((a) => (
                    <label
                      key={a.axisId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-text-secondary text-sm">{a.axisName}</span>
                      <input
                        type="checkbox"
                        checked={!a.hidden}
                        onChange={() => toggleVisibility(a.axisId, !a.hidden)}
                        className="rounded border-border-primary text-stone-600 focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Groups */}
        <section className="bg-surface-1 rounded-[12px] border border-border-secondary p-6 mb-6">
          <h2 className="text-[18px] font-serif font-medium text-text-primary mb-4">
            Groups
          </h2>
          {groups.length > 0 ? (
            <div className="space-y-2 mb-6">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="block bg-surface-2 rounded-[8px] p-3 hover:bg-stone-100 transition-colors duration-150"
                >
                  <div className="font-medium text-text-primary">{g.name}</div>
                  <div className="text-xs text-text-tertiary">
                    {g.memberCount} members &middot; {g.inviteCode}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary mb-4">
              You&apos;re not in any groups yet.
            </p>
          )}

          <div className="border-t border-border-secondary pt-4 mt-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Create a group
            </h3>
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="flex-1 rounded-[8px] border border-border-primary px-3 py-2 text-sm bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
              />
              <button
                onClick={handleCreateGroup}
                className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150"
              >
                Create
              </button>
            </div>
          </div>

          <div className="border-t border-border-secondary pt-4 mt-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Join a group
            </h3>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Invite code (e.g., ABCD-1234)"
                className="flex-1 rounded-[8px] border border-border-primary px-3 py-2 text-sm bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
              />
              <button
                onClick={handleJoinGroup}
                className="border border-stone-600 text-stone-600 px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-stone-100 transition-colors duration-150"
              >
                Join
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
