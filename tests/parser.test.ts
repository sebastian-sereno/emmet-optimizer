import { describe, expect, it } from 'vitest';
import { parse } from '../src/parser';

describe('parser', () => {
  it('parses text', () => {
    expect(parse('hello')).toEqual({ type: 'text', value: 'hello' });
  });

  it('parses siblings', () => {
    expect(parse('<span>hello</span><span>world</span>')).toEqual({
      children: [
        { children: [{ type: 'text', value: 'hello' }], name: 'span', type: 'element' },
        { children: [{ type: 'text', value: 'world' }], name: 'span', type: 'element' },
      ],
      type: 'sequence',
    });
  });

  it('parses an element', () => {
    expect(parse('<div>hello</div>')).toEqual({
      children: [{ type: 'text', value: 'hello' }],
      name: 'div',
      type: 'element',
    });
  });

  it('parses a sequence', () => {
    expect(parse('hello world!')).toEqual({ type: 'text', value: 'hello world!' });
  });

  it('supports nested elements', () => {
    expect(parse('<div><span>Hello</span></div>')).toEqual({
      children: [
        {
          children: [{ type: 'text', value: 'Hello' }],
          name: 'span',
          type: 'element',
        },
      ],
      name: 'div',
      type: 'element',
    });
  });

  it('rejects mismatched tags', () => {
    expect(() => parse('<div>Hello</span>')).toThrow(
      'Mismatched closing tag: expected </div> but found </span>',
    );
  });
});
