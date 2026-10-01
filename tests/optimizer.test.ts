import { describe, expect, it } from 'vitest';
import { element, sequence, text } from '../src/ast';
import { optimize } from '../src/optimizer';
import { mergeAdjacentText } from '../src/rules/mergeAdjacentText';
import { mergeBoundaryText } from '../src/rules/mergeBoundaryText';

describe('optimizer', () => {
  it('merges adjacent text nodes', () => {
    const input = sequence([text('hello'), text(' '), text('world')]);
    const result = optimize(input, { rules: [mergeAdjacentText] });

    expect(result).toEqual({
      children: [{ type: 'text', value: 'hello world' }],
      type: 'sequence',
    });
  });

  it('merges adjacent text inside elements', () => {
    const input = element('div', [text('hello'), text(' '), text('world')]);
    const result = optimize(input, { rules: [mergeAdjacentText] });

    expect(result).toEqual({
      children: [{ type: 'text', value: 'hello world' }],
      name: 'div',
      type: 'element',
    });
  });

  it('does not merge across an element', () => {
    const input = sequence([text('hello'), element('b', [text('world')]), text('!')]);
    const result = optimize(input, { rules: [mergeAdjacentText] });

    expect(result).toEqual(input);
  });

  it('currently leaves merge boundaries unchanged', () => {
    const input = sequence([
      text('hello'),
      { children: [text('world')], type: 'custom-rule' },
      text('!'),
    ]);
    const result = optimize(input, { rules: [mergeBoundaryText] });

    expect(result).toEqual(input);
  });
});
