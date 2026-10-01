export interface BaseNode {
  type: string;
}

export interface TextNode extends BaseNode {
  type: 'text';
  value: string;
}

export interface ElementNode extends BaseNode {
  type: 'element';
  name: string;
  children: Node[];
}

export interface SequenceNode extends BaseNode {
  type: 'sequence';
  children: Node[];
}

export interface CustomNode extends BaseNode {
  type: string;
  children?: Node[];
  [key: string]: unknown;
}

export type Node = TextNode | ElementNode | SequenceNode | CustomNode;

export function text(value: string): TextNode {
  return {
    type: 'text',
    value,
  };
}

export function element(name: string, children: Node[] = []): ElementNode {
  return {
    children,
    name,
    type: 'element',
  };
}

export function sequence(children: Node[] = []): SequenceNode {
  return {
    children,
    type: 'sequence',
  };
}

export function isText(node: Node): node is TextNode {
  return node.type === 'text';
}

export function hasChildren(node: Node): node is Node & { children: Node[] } {
  return 'children' in node && Array.isArray(node.children);
}

export function isCustomNode(node: Node): node is CustomNode {
  return node.type !== 'text' && node.type !== 'element' && node.type !== 'sequence';
}
