import { Options, IterableOutput, OutputIterator } from "../types";
import { IteratorWalker } from "./iterator-walker";

export function iterator<TOutput extends IterableOutput>(
  root: string,
  options: Options
): OutputIterator<TOutput> {
  const walker = new IteratorWalker<TOutput>(root, options);
  return walker.start();
}
