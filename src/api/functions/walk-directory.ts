import { WalkerState } from "../../types";
import type { Dirent } from "fs";

export type WalkDirectoryFunction = (
  state: WalkerState,
  fullPath: string,
  relativePath: string,
  depth: number,
  callback: (
    entries: Dirent[],
    fullPath: string,
    relativePath: string,
    depth: number
  ) => void
) => void;

const readdirOpts = { withFileTypes: true } as const;

const walkAsync: WalkDirectoryFunction = (
  state,
  fullPath,
  relativePath,
  currentDepth,
  callback
) => {
  state.queue.enqueue();

  if (currentDepth < 0) return state.queue.dequeue(null, state);

  const { fs } = state;

  state.visited.push(fullPath);
  state.counts.directories++;

  // Perf: Node >= 10 introduced withFileTypes that helps us
  // skip an extra fs.stat call.
  fs.readdir(fullPath || ".", readdirOpts, (error, entries = []) => {
    callback(entries, fullPath, relativePath, currentDepth);

    state.queue.dequeue(state.options.suppressErrors ? null : error, state);
  });
};

const walkSync: WalkDirectoryFunction = (
  state,
  fullPath,
  relativePath,
  currentDepth,
  callback
) => {
  const { fs } = state;
  if (currentDepth < 0) return;
  state.visited.push(fullPath);
  state.counts.directories++;

  let entries: Dirent[] = [];
  try {
    entries = fs.readdirSync(fullPath || ".", readdirOpts);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
  callback(entries, fullPath, relativePath, currentDepth);
};

export function build(isSynchronous: boolean): WalkDirectoryFunction {
  return isSynchronous ? walkSync : walkAsync;
}
