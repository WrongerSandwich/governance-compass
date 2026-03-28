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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account</h1>
        <p className="text-gray-500 mb-8">{session?.user?.email}</p>

        {/* Profile link / claim */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Your Profile
          </h2>
          {profileId ? (
            <Link
              href={`/results/${profileId}`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              View your results &rarr;
            </Link>
          ) : (
            <div>
              <p className="text-gray-600 text-sm mb-3">
                If you took the assessment before creating an account, you can
                link those results to your account.
              </p>
              <button
                onClick={handleClaim}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Claim Anonymous Profile
              </button>
              {claimStatus && (
                <p className="text-sm mt-2 text-gray-600">{claimStatus}</p>
              )}
            </div>
          )}
        </section>

        {/* Axis visibility */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Privacy
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Hide governance dimensions from comparisons. Hidden dimensions
            won&apos;t appear when others compare with you.
          </p>
          <div className="space-y-5">
            {Object.entries(axesByDomain).map(([domain, domainAxes]) => (
              <div key={domain}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {domain}
                </h3>
                <div className="space-y-1">
                  {domainAxes.map((a) => (
                    <label
                      key={a.axisId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-700 text-sm">{a.axisName}</span>
                      <input
                        type="checkbox"
                        checked={!a.hidden}
                        onChange={() => toggleVisibility(a.axisId, !a.hidden)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Groups */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Groups
          </h2>
          {groups.length > 0 ? (
            <div className="space-y-2 mb-6">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">{g.name}</div>
                  <div className="text-xs text-gray-500">
                    {g.memberCount} members &middot; {g.inviteCode}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              You&apos;re not in any groups yet.
            </p>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Create a Group
            </h3>
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateGroup}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Join a Group
            </h3>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Invite code (e.g., ABCD-1234)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleJoinGroup}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
