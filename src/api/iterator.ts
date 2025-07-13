import { Options, IterableOutput } from "../types";
import { IteratorWalker } from "./iterator-walker";

export function iterator<TOutput extends IterableOutput>(
  root: string,
  options: Options
): AsyncIterable<TOutput[number]> {
  const walker = new IteratorWalker<TOutput>(root, options);
  return walker.start();
}
