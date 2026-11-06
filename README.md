# AST Markup Parser

> A lightweight, extensible markup parser and optimizer written in TypeScript.

This library provides tools for tokenizing, parsing, transforming, optimizing, serializing, and compressing markup. It also supports custom lexer and parser rules, allowing developers to extend the parsing system with their own syntax and AST node types.

## Features
- **Lexer:** Converts markup strings into structured tokens.
- **Parser:** Converts tokens into an Abstract Syntax Tree (AST).
- **Nested Elements:** Supports nested markup elements and sibling elements.
- **Sequences:** Represents multiple sibling nodes in a single AST.
- **Custom Rules:** Extend the lexer and parser with custom syntax.
- **Optimizer:** Applies transformation rules to AST nodes.
- **Text Merging:** Merges adjacent text nodes.
- **Serializer:** Converts AST nodes back into markup strings.
- **Compressor:** Optimizes markup using configurable transformation rules.

## Installation
```bash
npm install @sebastian-sereno/emmet-optimizer
```

## Testing

The project uses Vitest for unit testing.

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npx vitest
```

## Core Modules
### 1. Lexer

The lexer converts markup into tokens.

Example:

```ts
import { lex } from '@sebastian-sereno/emmet-optimizer';

const tokens = lex('<div>hello</div>');
```

Output:

```ts
[
  { type: 'open', value: 'div' },
  { type: 'text', value: 'hello' },
  { type: 'close', value: 'div' }
]
```

The lexer supports plain text and element boundaries.

### 2. Parser

The parser converts markup into an AST.

Example:

```ts
import { parse } from '@sebastian-sereno/emmet-optimizer';

const ast = parse('<div>hello</div>');
```

Output:

```ts
{
  children: [
    { type: 'text', value: 'hello' }
  ],
  name: 'div',
  type: 'element'
}
```

Supported parsing functionality:

- Plain text.
- Single elements.
- Nested elements.
- Multiple sibling elements.
- Sequences of nodes.
- Mismatched closing-tag detection.

Invalid markup, such as mismatched closing tags, produces a parsing error.

### 3. AST

The AST represents parsed markup as structured nodes.

The tests demonstrate the following node types:

- text: Represents plain text.
- element: Represents an element with a name and children.
- sequence: Represents multiple sibling nodes.
- custom-rule: Represents custom AST structures.

AST helper functions include:

```ts
import { element, sequence, text } from '@sebastian-sereno/emmet-optimizer';

const node = element('div', [
  text('hello')
]);
```

### 4. Custom Rules

Custom rules allow developers to extend the lexer and parser without modifying their core implementations.

A custom rule can define:

- A lexer function for recognizing custom syntax.
- A parser function for converting custom tokens into AST nodes.

Example: Custom Merge Groups

The tests implement a custom syntax using [[ and ]].

```ts
[[hello world]]
```

This produces:

```ts
{
  children: [
    { type: 'text', value: 'hello world' }
  ],
  type: 'merge-group'
}
```

Custom rules can also handle:

- Nested elements inside custom groups.
- Custom groups inside regular elements.
- Multiple text nodes.
- Elements that cross custom-group boundaries.
- Unexpected or missing closing tokens.

Example:

```ts
const result = parse(
  '[[hello <span>world</span>]]',
  { rules: [mergeGroupRule] }
);
```

The custom parser uses context.parseChildren() to parse nested content until its designated closing token. [See Test Example](https://github.com/sebastian-sereno/emmet-optimizer/tree/main/tests).

### 5. Optimizer

The optimizer applies transformation rules to AST nodes.

Example:

```ts
import {
  optimize,
  element,
  sequence,
  text,
  mergeAdjacentText
} from '@sebastian-sereno/emmet-optimizer';

const input = sequence([
  text('hello'),
  text(' '),
  text('world')
]);

const result = optimize(input, {
  rules: [mergeAdjacentText]
});
```

Output:

```ts
{
  children: [
    { type: 'text', value: 'hello world' }
  ],
  type: 'sequence'
}
```

The optimizer supports configurable transformation rules.

#### Built-in optimization rules

**mergeAdjacentText**

Combines consecutive text nodes into one text node.

It works both at the root sequence level and inside elements.

It does not merge text nodes across element boundaries.

**mergeBoundaryText**

The tests currently verify that custom-rule boundaries remain unchanged.

This rule currently leaves the tested merge boundaries intact.

### 6. Serializer

The serializer converts AST nodes back into markup strings.

Example:

```ts
import { 
  element,
  sequence,
  text, 
  serialize
} from '@sebastian-sereno/emmet-optimizer';

const ast = element('div', [
  text('hello')
]);

const result = serialize(ast);
```

Output:

```HTML
<div>hello</div>
```

The tests cover serialization of:

- Text nodes.
- Elements.
- Sequences containing multiple nodes.

### 7. Compressor

The compressor provides a convenient interface for optimizing markup strings.

Example:

```ts
import { compres } from '@sebastian-sereno/emmet-optimizer';

const result = compress('hello');
```

Output:

```ts
'hello'
```

The compressor preserves existing elements:

```ts
compress('<div>hello</div>');
```

It also supports custom optimization rules.

Example: Uppercase Text Rule

```ts
import { compress, isText } from '@sebastian-sereno/emmet-optimizer';

const result = compress('hello', {
  rules: [
    {
      optimize: (node) => {
        if (!isText(node)) return node;
        const value = node.value.toUpperCase();
        if (node.value === value) return node;
        return { ...node, value };
      }
    }
  ]
});
```

Output:

```ts
'HELLO'
```

## Test Coverage

The current test suite covers the following functionality:

| Module       | Tested functionality                           |
|--------------|------------------------------------------------|
| Lexer        | Text and element tokenization                  |
| Parser       | Text, elements, nesting, sequences, errors     |
| Custom Rules | Custom tokens, groups, nested parsing          |
| AST          | Text, element, and sequence construction       |
| Optimizer    | Adjacent text merging and boundaries           |
| Serializer   | Text, elements, and sequences                  |
| Compressor   | Plain text, element preservation, custom rules |


## Design Philosophy

The library is designed around a modular architecture.

Each component has a distinct responsibility:

1. The lexer identifies syntax and produces tokens.
2. The parser transforms tokens into an AST.
3. The optimizer transforms AST structures.
4. The serializer converts AST structures back into markup.
5. The compressor combines these capabilities into a convenient interface.
6. Custom rules extend the system without requiring modifications to the core modules.

This separation makes the library extensible and suitable for applications that need custom markup languages or structured text transformations.

## Extensibility

Developers can introduce their own:

- Token types.
- AST node types.
- Lexer rules.
- Parser rules.
- Optimization rules.

Custom rules can be composed with existing rules, allowing the parsing and optimization pipeline to evolve independently.

## License

All Rights Reserved - 2026