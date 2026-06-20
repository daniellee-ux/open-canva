import path from 'node:path';

/**
 * The SINGLE shared convention for the `rel` string carried in `data-ox-loc`.
 *
 * Both halves of click-to-source must agree on the base directory or every edit
 * 403s for any non-default `designsDir` (e.g. `src/designs`): the loc tag is
 * injected relative to the designs *parent*, so the write-back resolver must
 * resolve it against the same parent. Defining the round-trip here keeps the
 * tagging plugin, the write-back resolver, and the comment listing in lockstep.
 */

/** Absolute design file → the posix `rel` embedded in `data-ox-loc`. */
export function relFromAbs(designsRoot: string, abs: string): string {
  return path.relative(path.dirname(designsRoot), abs).replace(/\\/g, '/');
}

/** A `rel` from `data-ox-loc` → the absolute design file it points at. */
export function absFromRel(designsRoot: string, rel: string): string {
  return path.resolve(path.dirname(designsRoot), rel);
}
