import { Output, Options } from "../types";
import { Walker } from "./walker";

export function sync<TOutput extends Output>(
  root: string,
  options: Options
): TOutput {
  const walker = new Walker<TOutput>(root, options);
  return walker.start() as TOutput;
}
