import { type OptimizerOptions, optimize } from './optimizer.js';
import { type CustomRule, parse } from './parser.js';
import { mergeAdjacentText } from './rules/mergeAdjacentText.js';
import { mergeBoundaryText } from './rules/mergeBoundaryText.js';
import { serialize } from './serializer.js';

export type CompressOptions = OptimizerOptions;

const defaultRules: CustomRule[] = [mergeAdjacentText, mergeBoundaryText];

export function compress(input: string, options: CompressOptions = {}): string {
  const ast = parse(input);
  const optimized = optimize(ast, { rules: options.rules ?? defaultRules });
  return serialize(optimized);
}
