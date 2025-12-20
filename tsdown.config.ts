import { defineConfig } from "tsdown/config";

export default defineConfig([
  {
    entry: "src/index.ts",
    format: ["esm"],
    target: "node12",
    nodeProtocol: true,
    dts: true,
    exports: true,
    fixedExtension: true,
  },
  {
    entry: "src/index.ts",
    format: ["cjs"],
    target: "node12",
    nodeProtocol: "strip",
    dts: true,
    exports: true,
    fixedExtension: true,
  },
]);
