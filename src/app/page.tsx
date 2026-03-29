import Link from "next/link";
import { ReturningUserLink } from "@/components/ReturningUserLink";
import { GovernanceCompassMark } from "@/components/GovernanceCompassMark";
import { CountUp } from "@/components/CountUp";
import { StaggeredList } from "@/components/StaggeredList";

export default function Home() {
  return (
    <main className="min-h-screen px-4">
      {/* Hero */}
      <div className="max-w-xl mx-auto pt-16 pb-12 text-center">
        <GovernanceCompassMark size={72} className="mx-auto mb-5" />
        <h1 className="text-[32px] font-serif font-medium text-text-primary mb-5 leading-tight">
          The governance compass
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
          className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-6 gap-y-1.5 max-w-lg mx-auto mb-14"
        >
          {[
            ["Collective", "Market"],
            ["Ecological", "Growth"],
            ["Distributed", "Centralized"],
            ["Popular", "Institutional"],
            ["Liberty", "Security"],
            ["Electoral", "Performance"],
            ["Progressive", "Traditional"],
            ["Pluralism", "Cohesion"],
            ["Constructivism", "Essentialism"],
            ["Internationalism", "Sovereignty"],
            ["Non-Intervention", "Intervention"],
            ["Precautionary", "Innovation"],
          ].map(([a, b]) => (
            <div
              key={a}
              className="flex items-center justify-center gap-1.5 text-xs font-mono text-text-tertiary"
            >
              <span className="text-right flex-1">{a}</span>
              <span className="opacity-40 shrink-0">&larr;&rarr;</span>
              <span className="text-left flex-1">{b}</span>
            </div>
          ))}
        </StaggeredList>

        {/* Other features */}
        <div className="border-t border-border-secondary pt-8 max-w-xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium text-center mb-6">
            Beyond the assessment
          </p>
          <div className="grid min-[560px]:grid-cols-2 gap-8">
            <div className="text-center min-[560px]:text-left">
              <h3 className="text-[17px] font-serif font-medium text-text-primary mb-2">
                Compare and discuss
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Share your results and compare side-by-side with friends. Create
                groups to see where your circle stands on each axis.
              </p>
            </div>
            <div className="text-center min-[560px]:text-left">
              <h3 className="text-[17px] font-serif font-medium text-text-primary mb-2">
                Living profile
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Add annotations explaining your reasoning on any axis.
                Revisit your results and share nuanced context with others.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-secondary mt-12 pt-6 text-center">
          <p className="text-xs text-text-tertiary">
            Research-backed methodology &middot; Privacy-first &middot; No data sold
          </p>
        </div>
      </div>
    </main>
  );
}
