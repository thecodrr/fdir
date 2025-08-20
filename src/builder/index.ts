import {
  Output,
  PathsOutput,
  Options,
} from "../types";
import type picomatch from "picomatch";
import { Builder as BuilderBase } from "./builder";

let pm: typeof picomatch | null = null;
/* c8 ignore next 6 */
try {
  require.resolve("picomatch");
  pm = require("picomatch");
} catch {
  // do nothing
}

export class Builder<
  TReturnType extends Output = PathsOutput,
  TGlobFunction = typeof picomatch,
> extends BuilderBase<TReturnType, TGlobFunction> {
    constructor(options?: Partial<Options<TGlobFunction>>) {
    super(pm ? { ...options, globFunction: options?.globFunction || pm as TGlobFunction } : options );
  }
}
