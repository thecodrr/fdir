import type picomatch from "picomatch";
import { Builder } from "./builder";

export { Builder };

let pm: typeof picomatch | null = null;
/* c8 ignore next 6 */
try {
  require.resolve("picomatch");
  pm = require("picomatch");
} catch {
  // do nothing
}

Builder.defaultGlobFunction = pm || null;
