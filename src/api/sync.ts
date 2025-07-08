import type { Output, Options } from "../types.ts";
import { Walker } from "./walker.ts";

export function sync<TOutput extends Output>(
  root: string,
  options: Options
): TOutput {
  const walker = new Walker<TOutput>(root, options);
  return walker.start() as TOutput;
}
