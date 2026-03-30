"use client";

import { glossary } from "@/data/glossary";
import { GlossaryTerm } from "./GlossaryTerm";

interface AnnotatedTextProps {
  text: string;
}

/**
 * Scans text for glossary terms and wraps the first occurrence of each
 * in a GlossaryTerm tooltip. Terms are matched case-insensitively.
 * Only the first match per term per AnnotatedText call is annotated.
 */
export function AnnotatedText({ text }: AnnotatedTextProps) {
  // Sort glossary entries by pattern length (longest first) to avoid
  // partial matches (e.g., "popular sovereignty" before "sovereignty")
  const sorted = glossary
    .flatMap((entry) =>
      entry.patterns.map((pattern) => ({ pattern, entry }))
    )
    .sort((a, b) => b.pattern.length - a.pattern.length);

  // Find all matches with positions
  const matches: { start: number; end: number; entry: typeof glossary[0] }[] = [];
  const usedEntries = new Set<string>();
  const textLower = text.toLowerCase();

  for (const { pattern, entry } of sorted) {
    if (usedEntries.has(entry.id)) continue;

    // Word-boundary-aware search
    const patternLower = pattern.toLowerCase();
    let searchFrom = 0;
    while (searchFrom < textLower.length) {
      const idx = textLower.indexOf(patternLower, searchFrom);
      if (idx === -1) break;

      // Check word boundaries
      const before = idx > 0 ? textLower[idx - 1] : " ";
      const after = idx + patternLower.length < textLower.length ? textLower[idx + patternLower.length] : " ";
      const isWordBoundary = !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);

      if (isWordBoundary) {
        // Check no overlap with existing matches
        const overlaps = matches.some(
          (m) => idx < m.end && idx + patternLower.length > m.start
        );
        if (!overlaps) {
          matches.push({ start: idx, end: idx + patternLower.length, entry });
          usedEntries.add(entry.id);
          break; // first occurrence only
        }
      }
      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) return <>{text}</>;

  // Sort matches by position and build fragments
  matches.sort((a, b) => a.start - b.start);

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      fragments.push(text.slice(cursor, match.start));
    }
    fragments.push(
      <GlossaryTerm key={match.start} entry={match.entry}>
        {text.slice(match.start, match.end)}
      </GlossaryTerm>
    );
    cursor = match.end;
  }

  if (cursor < text.length) {
    fragments.push(text.slice(cursor));
  }

  return <>{fragments}</>;
}
