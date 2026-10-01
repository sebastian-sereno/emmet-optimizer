import { hasChildren, isText, type Node } from '../ast.js';
import type { CustomRule } from '../parser.js';

export const mergeAdjacentText: CustomRule = {
  optimize: (node: Node): Node => {
    if (!hasChildren(node)) return node;

    const children = node.children;
    const merged: Node[] = [];

    for (const child of children) {
      const previous = merged[merged.length - 1];

      if (previous && isText(previous) && isText(child)) {
        merged[merged.length - 1] = {
          type: 'text',
          value: previous.value + child.value,
        };
      } else merged.push(child);
    }

    const changed =
      merged.length !== children.length || merged.some((child, index) => child !== children[index]);

    if (!changed) return node;
    return { ...node, children: merged };
  },
};
