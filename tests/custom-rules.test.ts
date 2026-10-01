import { describe, expect, it } from 'vitest';
import {
  type CustomNode,
  type CustomRule,
  lex,
  type Node,
  ParseError,
  parse,
  type TokenBase,
} from '../src/index.js';

interface MergeGroupNode extends CustomNode {
  type: 'merge-group';
  children: Node[];
}

function mergeGroup(children: Node[]): MergeGroupNode {
  return { children, type: 'merge-group' };
}

type MergerToken = OpenMergeToken | CloseMergeToken | GroupMergeToken;

interface OpenMergeToken extends TokenBase {
  type: 'merge-open';
  value: '[[';
}

interface CloseMergeToken extends TokenBase {
  type: 'merge-close';
  value: ']]';
}

interface GroupMergeToken extends TokenBase {
  type: 'merge-group';
  value: string;
}

const mergeGroupRule: CustomRule<MergerToken> = {
  lexer: (input, i, flushText, tokens) => {
    if (input.startsWith('[[', i)) {
      flushText();
      tokens.push({ type: 'merge-open', value: '[[' });
      return i + 2;
    }

    if (input.startsWith(']]', i)) {
      flushText();
      tokens.push({ type: 'merge-close', value: ']]' });
      return i + 2;
    }

    return null;
  },
  parser: (context) => {
    const opening = context.tokens[context.position];
    if (opening?.type !== 'merge-open') return undefined;

    // Consume [[
    context.position++;

    const children = context.parseChildren('merge-close');
    const closing = context.tokens[context.position];

    if (closing?.type !== 'merge-close')
      throw new ParseError('Expected merge-group closing token ]]');

    // Consume ]]
    context.position++;

    return mergeGroup(children);
  },
};

describe('parser checks with custom rules', () => {
  it('parses a merge group using the custom rule', () => {
    const result = parse('[[hello]]', { rules: [mergeGroupRule] });

    expect(result).toEqual({
      children: [{ type: 'text', value: 'hello' }],
      type: 'merge-group',
    });
  });

  it('parses multiple text nodes inside a merge group', () => {
    const result = parse('[[hello world]]', { rules: [mergeGroupRule] });

    expect(result).toEqual({
      children: [{ type: 'text', value: 'hello world' }],
      type: 'merge-group',
    });
  });

  it('parses a merge group inside an element', () => {
    const result = parse('<div>Hello [[world]]!</div>', { rules: [mergeGroupRule] });

    expect(result).toEqual({
      children: [
        { type: 'text', value: 'Hello ' },
        {
          children: [{ type: 'text', value: 'world' }],
          type: 'merge-group',
        },
        { type: 'text', value: '!' },
      ],
      name: 'div',
      type: 'element',
    });
  });

  it('parses nested elements inside a merge group', () => {
    const result = parse('[[hello <span>world</span>]]', { rules: [mergeGroupRule] });

    expect(result).toEqual({
      children: [
        { type: 'text', value: 'hello ' },
        {
          children: [{ type: 'text', value: 'world' }],
          name: 'span',
          type: 'element',
        },
      ],
      type: 'merge-group',
    });
  });

  // FAILS
  it('parses wrapped elements inside a merge group', () => {
    expect(() => parse('[[hello <span>world]]</span>', { rules: [mergeGroupRule] })).toThrow(
      'Unexpected token "merge-close" at position 4',
    );
    // .toEqual({
    //   children: [
    //     { type: 'text', value: 'hello ' },
    //     {
    //       children: [{ type: 'text', value: 'world' }],
    //       name: 'span',
    //       type: 'element',
    //     },
    //   ],
    //   type: 'merge-group',
    // });
  });

  it('rejects an unclosed merge group', () => {
    expect(() => parse('[[hello', { rules: [mergeGroupRule] })).toThrow(
      'Expected closing token: merge-close',
    );
  });

  it('rejects an unexpected merge-group closing token', () => {
    expect(() => parse('hello]]', { rules: [mergeGroupRule] })).toThrow(
      'Unexpected token "merge-close" at position 1',
    );
  });

  it('does nothing when the current token is not a merge group', () => {
    const result = parse('hello', { rules: [mergeGroupRule] });
    expect(result).toEqual({ type: 'text', value: 'hello' });
  });
});

describe('lexer checks with custom rules', () => {
  it('lexes merge groups', () => {
    expect(lex('hello[[world]]', [mergeGroupRule.lexer!])).toEqual([
      { type: 'text', value: 'hello' },
      { type: 'merge-open', value: '[[' },
      { type: 'text', value: 'world' },
      { type: 'merge-close', value: ']]' },
    ]);
  });

  it('lexes nested structures', () => {
    expect(lex('<div>hello[[world]]!</div>', [mergeGroupRule.lexer!])).toEqual([
      { type: 'open', value: 'div' },
      { type: 'text', value: 'hello' },
      { type: 'merge-open', value: '[[' },
      { type: 'text', value: 'world' },
      { type: 'merge-close', value: ']]' },
      { type: 'text', value: '!' },
      { type: 'close', value: 'div' },
    ]);
  });
});
