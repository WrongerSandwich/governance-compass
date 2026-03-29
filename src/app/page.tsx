import Link from "next/link";
import { ReturningUserLink } from "@/components/ReturningUserLink";
import { GovernanceCompassMark } from "@/components/GovernanceCompassMark";
import { CountUp } from "@/components/CountUp";
import { StaggeredList } from "@/components/StaggeredList";
import { axes } from "@/data/axes";

export default function Home() {
  return (
    <main className="min-h-screen px-4">
      {/* Hero */}
      <div className="max-w-xl mx-auto pt-16 pb-12 text-center">
        <GovernanceCompassMark size={72} className="mx-auto mb-5" animate />
        <h1 className="text-[32px] font-serif font-medium text-text-primary mb-5 leading-tight">
          The Governance Compass
        </h1>
        <p className="text-[15px] text-text-secondary mb-3 leading-relaxed max-w-md mx-auto">
          A research-backed assessment across 12 governance axes — from
          economic philosophy to international engagement. Far beyond left
          and right.
        </p>
        <p className="text-sm text-text-tertiary mb-8 leading-relaxed max-w-md mx-auto">
          Compare your positions with friends axis by axis. See where
          you align, where you diverge, and understand each
          other&apos;s perspectives on how society should be governed.
        </p>
        <Link
          href="/quiz"
          className="block mx-auto max-w-xs bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150 text-center focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
        >
          Begin assessment
        </Link>
        <p className="mt-3 text-xs font-serif italic text-text-tertiary">
          ~20 minutes &middot; 3 question formats &middot; No account required
        </p>
        <ReturningUserLink />
      </div>

      {/* Features */}
      <div className="max-w-3xl mx-auto pb-20">
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium text-center mb-10">
          What you&apos;ll discover
        </h2>

        {/* 12 axes — typographic breakout */}
        <div className="text-center mb-8">
          <CountUp
            target={12}
            duration={600}
            className="text-[56px] font-serif font-medium text-text-primary leading-none"
          />
          <p className="text-[17px] font-serif font-medium text-text-primary mt-1">
            governance axes
          </p>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
            Your positions mapped across economic, political, social, and
            international domains. No oversimplified quadrants.
          </p>
        </div>

        {/* Axis poles preview — cartographic reference grid */}
        <StaggeredList
          staggerMs={40}
          className="grid gap-y-3 max-w-md mx-auto mb-14"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          {axes.map((axis) => (
            <div key={axis.id} className="col-span-3 grid" style={{ gridTemplateColumns: "subgrid" }}>
              <span className="text-right text-xs font-mono text-text-tertiary">{axis.poleALabel.split(" ")[0]}</span>
              <span className="text-center text-xs font-mono text-text-tertiary opacity-40 px-2">&larr;&rarr;</span>
              <span className="text-left text-xs font-mono text-text-tertiary">{axis.poleBLabel.split(" ")[0]}</span>
              <p className="col-span-3 text-center text-[11px] text-text-tertiary opacity-70 -mt-1">
                {axis.tagline}
              </p>
            </div>
          ))}
        </StaggeredList>

        {/* "Beyond the assessment" section hidden for v1 */}

        {/* Footer */}
        <div className="border-t border-border-secondary mt-12 pt-6 text-center">
          <p className="text-xs text-text-tertiary">
            <Link href="/methodology" className="hover:text-text-secondary transition-colors duration-150">Research-backed methodology</Link>
            {" "}&middot;{" "}
            <Link href="/axes" className="hover:text-text-secondary transition-colors duration-150">12 axes explained</Link>
            {" "}&middot;{" "}
            Privacy-first &middot; No data sold
          </p>
        </div>
      </div>
    </main>
  );
}
