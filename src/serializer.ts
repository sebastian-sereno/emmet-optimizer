import { isCustomNode, type Node } from './ast.js';

export interface SerializationContext {
  serialize(node: Node): string;
}

export type SerializationRule<N extends Node = Node> = (
  node: N,
  context: SerializationContext,
) => string;

export interface SerializerOptions {
  rules?: SerializationRule[];
}

export function serialize<N extends Node>(node: N, options: SerializerOptions = {}): string {
  const context: SerializationContext = {
    serialize: (child) => serialize(child, options),
  };

  if (isCustomNode(node)) {
    for (const rule of options.rules ?? []) {
      const result = rule(node, context);

      if (result !== undefined) {
        return result;
      }
    }

    throw new Error(`No serializer registered for custom node "${node.type}"`);
  }

  switch (node.type) {
    case 'text':
      return node.value;

    case 'element':
      return (
        `<${node.name}>` +
        node.children.map((child) => serialize(child, options)).join('') +
        `</${node.name}>`
      );

    case 'sequence':
      return node.children.map((child) => serialize(child, options)).join('');
  }
}
