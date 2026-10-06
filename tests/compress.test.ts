import { describe, expect, it } from 'vitest';
import { isText } from '../src/ast';
import { compress } from '../src/compress';

describe('compress', () => {
  it('compresses plain text', () => {
    expect(compress('hello')).toBe('hello');
  });

  it('preserves elements', () => {
    expect(compress('<div>hello</div>')).toBe('<div>hello</div>');
  });

  it('allows custom rules', () => {
    const result = compress('hello', {
      rules: [
        {
          optimize: (node) => {
            if (!isText(node)) return node;
            const value = node.value.toUpperCase();
            if (node.value === value) return node;
            return { ...node, value };
          },
        },
      ],
    });

    expect(result).toBe('HELLO');
  });
});
