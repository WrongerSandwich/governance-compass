/**
 * archetype-remap.ts
 *
 * Re-exports the post-revision archetype resolution helpers for use in build
 * scripts.  The canonical implementation lives in src/lib/study/archetypeResolution.ts
 * so that both the build pipeline and the API route share one source.
 *
 * This thin wrapper exists so scripts can import from a scripts/data/ path
 * without crossing the src/ boundary directly in tsconfig.
 */

// Re-export everything from the shared src module.
export {
  computeDistance,
  postRevisionArchetypeForCluster,
  LEGACY_ARCHETYPE_ID_MAP,
} from "../../src/lib/study/archetypeResolution";

export type { PostRevisionArchetypeMatch } from "../../src/lib/study/archetypeResolution";
