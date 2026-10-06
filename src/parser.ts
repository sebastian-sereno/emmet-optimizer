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

  parseChildren(stopToken?: Token<TCustomToken>['type'] | 'close'): Node[];
  parseElement(stopToken?: Token<TCustomToken>['type'] | 'close'): Node;

  deferredElements: {
    name: string;
    children: Node[];
  }[];
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
    deferredElements: [],
    parseChildren: (stopToken) => tryParseChildren<TCustomToken>(context, stopToken),
    parseElement: (stopToken) => tryParseElement<TCustomToken>(context, stopToken),
    position: 0,
    rules: parseRules,
    tokens,
  };

  const children = context.parseChildren();

  if (context.position < tokens.length) {
    const token = tokens.at(context.position)!;
    throw new ParseError(`Unexpected token "${token.type}" at position ${context.position}`);
  }

  return children.length === 1 ? children.at(0)! : sequence(children);
}

function tryParseChildren<TCustomToken extends TokenBase = never>(
  context: ParseContext<TCustomToken>,
  stopToken?: Token<TCustomToken>['type'] | 'close',
): Node[] {
  const children: Node[] = [];

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position]!;
    if (stopToken && token.type === stopToken) return children;

    if (context.deferredElements.length > 0) {
      const deferred = parseDeferredElement(context);
      children.push(deferred);
      continue;
    }

    if (token.type === 'text' && 'value' in token) {
      children.push(text(token.value));
      context.position++;
      continue;
    }

    if (token.type === 'open') {
      children.push(...flattenNode(context.parseElement(stopToken)));
      continue;
    }

    // if (token.type === 'close' && context.deferredElements.length > 0) {
    //   const expectedName = context.deferredElements.at(-1)!;

    //   if (token.value === expectedName) {
    //     context.deferredElements.pop();
    //     context.position++;
    //     children.push(element(expectedName, []));
    //     continue;
    //   }
    // }

    let handled = false;

    for (const rule of context.rules) {
      const startPosition = context.position;
      const result = rule(context);

      if (result !== undefined) {
        if (context.position <= startPosition)
          throw new ParseError('A parse rule returned a node without consuming input');

        children.push(result);
        handled = true;
        break;
      }

      if (context.position < startPosition)
        throw new ParseError('A parse rule moved the parser position backwards');
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

function flattenNode(node: Node): Node[] {
  return node.type === 'sequence' ? node.children! : [node];
}

function parseDeferredElement<TCustomToken extends TokenBase>(
  context: ParseContext<TCustomToken>,
): Node {
  const deferred = context.deferredElements.at(-1)!;

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position]!;

    if (token.type === 'text' && 'value' in token) {
      deferred.children.push(text(token.value));
      context.position++;
      continue;
    }

    if (token.type === 'open') {
      deferred.children.push(context.parseElement());
      continue;
    }

    if (token.type === 'close') {
      if (token.value !== deferred.name) {
        throw new ParseError(
          `Mismatched closing tag: expected </${deferred.name}> ` + `but found </${token.value}>`,
        );
      }

      context.position++;
      context.deferredElements.pop();

      return element(deferred.name, deferred.children);
    }

    let handled = false;

    for (const rule of context.rules) {
      const startPosition = context.position;
      const result = rule(context);

      if (result !== undefined) {
        if (context.position <= startPosition)
          throw new ParseError('A parse rule returned a node without consuming input');

        deferred.children.push(result);
        handled = true;
        break;
      }

      if (context.position < startPosition)
        throw new ParseError('A parse rule moved the parser position backwards');
      if (context.position !== startPosition)
        throw new ParseError('A parse rule consumed input but did not return a node');
    }

    if (handled) continue;

    throw new ParseError(`Unexpected token "${token.type}" at position ${context.position}`);
  }

  throw new ParseError(`Expected closing tag for <${deferred.name}>`);
}

function tryParseElement<TCustomToken extends TokenBase = never>(
  context: ParseContext<TCustomToken>,
  stopToken?: Token<TCustomToken>['type'] | 'close',
): Node {
  const opening = context.tokens[context.position];

  if (opening?.type !== 'open') throw new ParseError('Expected opening element');

  context.position++;

  const name = opening.value;
  if (!name) throw new ParseError('Element name cannot be empty');

  const children = tryParseElementChildren<TCustomToken>(context, stopToken);
  const closing = context.tokens[context.position];

  if (closing?.type !== 'close' && closing !== undefined) {
    context.deferredElements.push({ children: [], name });
    return sequence(children);
  }

  if (closing?.type !== 'close') {
    throw new ParseError(`Expected closing tag for <${name}>`);
  } else if (closing.value !== name)
    throw new ParseError(
      `Mismatched closing tag: expected </${name}> ` + `but found </${closing.value}>`,
    );

  context.position++;

  return element(name, children);
}

function tryParseElementChildren<TCustomToken extends TokenBase = never>(
  context: ParseContext<TCustomToken>,
  parentStopToken?: Token<TCustomToken>['type'] | 'close',
): Node[] {
  const children: Node[] = [];

  while (context.position < context.tokens.length) {
    const token = context.tokens[context.position]!;

    if (token.type === 'close') {
      return children;
    }

    if (parentStopToken && token.type === parentStopToken) {
      return children;
    }

    if (token.type === 'text' && 'value' in token) {
      children.push(text(token.value));
      context.position++;
      continue;
    }

    if (token.type === 'open') {
      children.push(...flattenNode(context.parseElement(parentStopToken)));
      continue;
    }

    let handled = false;

    for (const rule of context.rules) {
      const startPosition = context.position;
      const result = rule(context);

      if (result !== undefined) {
        if (context.position <= startPosition)
          throw new ParseError('A parse rule returned a node without consuming input');

        children.push(result);
        handled = true;
        break;
      }

      if (context.position < startPosition)
        throw new ParseError('A parse rule moved the parser position backwards');
      if (context.position !== startPosition)
        throw new ParseError('A parse rule consumed input but did not return a node');
    }

    if (handled) continue;

    if (parentStopToken && token.type === parentStopToken) {
      return children;
    }

    throw new ParseError(`Unexpected token "${token.type}" at position ${context.position}`);
  }

  if (parentStopToken) throw new ParseError(`Expected closing token: ${parentStopToken}`);

  return children;
}
