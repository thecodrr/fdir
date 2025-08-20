import type picomatch from "picomatch";
import { Builder } from "./builder/index";

export { Builder as fdir };
export type Fdir = typeof Builder;

export * from "./types";

let pm: typeof picomatch | null = null;
/* c8 ignore next 6 */
try {
  require.resolve("picomatch");
  pm = require("picomatch");
} catch {
  // do nothing
}

Builder.defaultGlobFunction = pm || null;
