"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  target: number;
  duration?: number; // ms
  className?: string;
}

export function CountUp({ target, duration = 600, className }: CountUpProps) {
  // Start at target so SSR/slow JS shows the correct number
  const [value, setValue] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          // Reset to 0 then animate up
          setValue(0);
          requestAnimationFrame(() => {
            const start = performance.now();
            function tick(now: number) {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - (1 - progress) * (1 - progress);
              setValue(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className={className}>{value}</span>;
}
