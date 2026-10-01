import { element, type Node, sequence, text } from './ast.js';
import { type LexerRule, lex, type Token, type TokenBase } from './lexer.js';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface ParseContext<TCustomToken extends TokenBase = never> {
  tokens: Token<TCustomToken>[];
  position: number;
  rules: ParseRule<TCustomToken>[];

  parseChildren(stopToken?: Token<TCustomToken>['type']): Node[];
  parseElement(): Node;
}

export type ParseRule<TCustomToken extends TokenBase = never> = (
  context: ParseContext<TCustomToken>,
) => Node | undefined;

export interface CustomRule<TCustomToken extends TokenBase = never> {
  lexer?: LexerRule<TCustomToken>;
  parser?: ParseRule<TCustomToken>;
  optimize?: (node: Node) => Node;
}

export interface ParserOptions<TCustomToken extends TokenBase = never> {
  rules?: CustomRule<TCustomToken>[];
}

export function parse<TCustomToken extends TokenBase = never>(
  input: string,
  options: ParserOptions<TCustomToken> = {},
): Node {
  const customRules = options.rules ?? [];
  const lexerRules = customRules.map((rule) => rule.lexer).filter((rule) => rule != null);
  const parseRules = customRules.map((rule) => rule.parser).filter((rule) => rule != null);

  const tokens = lex(input, lexerRules);

  const context: ParseContext<TCustomToken> = {
    parseChildren: (stopToken) => parseChildren(context as ParseContext<any>, stopToken),
    parseElement: () => parseElement(context),
    position: 0,
    rules: parseRules,
    tokens,
  };

  const children = context.parseChildren();

  if (context.position < tokens.length) {
    const token = tokens[context.position]!;
    throw new ParseError(`Unexpected token "${token.type}" at position ${context.position}`);
  }

  if (children.length === 0) return sequence([]);
  if (children.length === 1) return children[0]!;

  return sequence(children);
}

function parseChildren<TCustomToken extends TokenBase = never>(
  context: ParseContext<TCustomToken>,
  stopToken?: Token<TCustomToken>['type'],
): Node[] {
  const children: Node[] = [];

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position]!;

    if (stopToken && token.type === stopToken) {
      return children;
    }

    if (token.type === 'text' && 'value' in token) {
      children.push(text(token.value));
      context.position++;
      continue;
    }

    if (token.type === 'open') {
      children.push(context.parseElement());
      continue;
    }

    let handled = false;

    for (const rule of context.rules) {
      const startPosition = context.position;
      const result = rule(context);

      if (result !== undefined) {
        children.push(result);
        handled = true;
        break;
      }

      if (context.position !== startPosition)
        throw new ParseError('A parse rule consumed input but did not return a node');
    }

    if (handled) continue;

    if (token.type === 'close') {
      if (stopToken === 'close') return children;
      throw new ParseError(`Unexpected closing tag: </${token.value}>`);
    }

    throw new ParseError(`Unexpected token "${token.type}" at position ${context.position}`);
  }

  if (stopToken) throw new ParseError(`Expected closing token: ${stopToken}`);

  return children;
}

function parseElement<TCustomToken extends TokenBase>(context: ParseContext<TCustomToken>): Node {
  const opening = context.tokens[context.position];

  if (opening?.type !== 'open') {
    throw new ParseError('Expected opening element');
  }

  context.position++;

  const name = opening.value;
  if (!name) throw new ParseError('Element name cannot be empty');

  const children = context.parseChildren('close' as any);
  const closing = context.tokens[context.position];

  if (closing?.type !== 'close') {
    throw new ParseError(`Expected closing tag for <${name}>`);
  } else if (closing.value !== name)
    throw new ParseError(
      `Mismatched closing tag: expected </${name}> ` + `but found </${closing.value}>`,
    );

  context.position++;

  return element(name, children);
}
