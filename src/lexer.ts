export interface TokenBase {
  type: string;
  value?: string;
}

export type BuiltInToken =
  | { type: 'text'; value: string }
  | { type: 'open'; value: string }
  | { type: 'close'; value: string };

export type Token<TCustomToken extends TokenBase = never> = BuiltInToken | TCustomToken;

export type LexerRule<TCustomToken extends TokenBase = never> = (
  input: string,
  index: number,
  flushText: () => void,
  tokens: Token<TCustomToken>[],
) => number | null;

export function lex<TCustomToken extends TokenBase = never>(
  input: string,
  rules: LexerRule<TCustomToken>[] = [],
): Token<TCustomToken>[] {
  const tokens: Token<TCustomToken>[] = [];

  let buffer = '';

  const flushText = () => {
    if (buffer.length > 0) {
      tokens.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  let i = 0;

  while (i < input.length) {
    let handled = false;

    for (const rule of rules) {
      const nextIndex = rule(input, i, flushText, tokens);

      if (nextIndex !== null) {
        i = nextIndex;
        handled = true;
        break;
      }
    }

    if (handled) continue;

    if (input[i] === '<') {
      const closeEnd = input.indexOf('>', i);

      if (closeEnd !== -1) {
        flushText();
        const raw = input.slice(i, closeEnd + 1);

        if (raw.startsWith('</')) tokens.push({ type: 'close', value: raw.slice(2, -1).trim() });
        else tokens.push({ type: 'open', value: raw.slice(1, -1).trim() });

        i = closeEnd + 1;
        continue;
      }
    }

    buffer += input[i];
    i++;
  }

  flushText();

  return tokens;
}
