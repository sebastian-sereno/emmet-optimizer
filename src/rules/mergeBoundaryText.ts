import type { CustomRule } from '../parser.js';

/**
 * Future rule for merging text across [[...]] boundaries.
 *
 * This is intentionally a no-op for now.
 *
 * Example future behavior might transform something like:
 *
 *   hello[[world]]!
 *
 * depending on the eventual merge semantics.
 */
export const mergeBoundaryText: CustomRule = {};
