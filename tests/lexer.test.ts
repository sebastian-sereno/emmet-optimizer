import { describe, expect, it } from 'vitest';
import { lex } from '../src/lexer';

describe('lexer', () => {
  it('lexes plain text', () => {
    expect(lex('hello world')).toEqual([{ type: 'text', value: 'hello world' }]);
  });

  it('lexes elements', () => {
    expect(lex('<div>hello</div>')).toEqual([
      { type: 'open', value: 'div' },
      { type: 'text', value: 'hello' },
      { type: 'close', value: 'div' },
    ]);
  });
});
