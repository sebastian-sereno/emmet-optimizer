import { describe, expect, it } from 'vitest';
import { element, sequence, text } from '../src/ast';
import { serialize } from '../src/serializer';

describe('serializer', () => {
  it('serializes text', () => {
    expect(serialize(text('hello'))).toBe('hello');
  });

  it('serializes elements', () => {
    expect(serialize(element('div', [text('hello')]))).toBe('<div>hello</div>');
  });

  it('serializes sequences', () => {
    expect(serialize(sequence([text('hello'), element('b', [text('world')])]))).toBe(
      'hello<b>world</b>',
    );
  });
});
