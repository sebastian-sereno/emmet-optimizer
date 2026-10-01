import { hasChildren, type Node } from './ast.js';

import type { CustomRule } from './parser.js';

export interface OptimizerOptions {
  rules?: CustomRule[];
  maxPasses?: number;
  maxChanges?: number;
}

export function optimize(node: Node, options: OptimizerOptions = {}): Node {
  const { rules = [], maxPasses = 100, maxChanges = 10_000 } = options;

  let changes = 0;
  let current = node;

  if (hasChildren(current)) {
    const children = current.children.map((child) => optimize(child, options));
    current = { ...current, children };
  }

  const optimizerRules = rules
    .map((rule) => rule.optimize)
    .filter((rule): rule is NonNullable<CustomRule['optimize']> => rule !== undefined);

  let changed = true;

  for (let pass = 0; pass < maxPasses; pass++) {
    changed = false;

    for (const rule of optimizerRules) {
      const next = rule(current);
      if (next === current) continue;

      current = next;
      changed = true;
      changes++;

      if (changes >= maxChanges)
        throw new Error(
          `Optimizer exceeded maximum changes (${maxChanges}).` +
            `A rule may be oscillating or never reaching a stable state.`,
        );
    }

    if (!changed) return current;
  }

  throw new Error(
    `Optimizer exceeded maximum passes (${maxPasses}).` +
      `A rule may be oscillating or never reaching a stable state.`,
  );
}
