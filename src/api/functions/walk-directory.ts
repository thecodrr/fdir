import { WalkerState } from "../../types";
import type { Dirent } from "fs";

export type WalkDirectoryFunction = (
  state: WalkerState,
  crawlPath: string,
  directoryPath: string,
  depth: number,
  callback: (entries: Dirent[], directoryPath: string, depth: number) => void
) => void;

const readdirOpts = { withFileTypes: true } as const;

const walkAsync: WalkDirectoryFunction = (
  state,
  crawlPath,
  directoryPath,
  currentDepth,
  callback
) => {
  state.queue.enqueue();

  if (currentDepth < 0) return state.queue.dequeue(null, state);

  const { fs } = state;

  state.visited.push(crawlPath);

  // Perf: Node >= 10 introduced withFileTypes that helps us
  // skip an extra fs.stat call.
  fs.readdir(crawlPath || ".", readdirOpts, (error, entries = []) => {
    callback(entries, directoryPath, currentDepth);

    state.queue.dequeue(state.options.suppressErrors ? null : error, state);
  });
};

const walkSync: WalkDirectoryFunction = (
  state,
  crawlPath,
  directoryPath,
  currentDepth,
  callback
) => {
  const { fs } = state;
  if (currentDepth < 0) return;
  state.visited.push(crawlPath);

  let entries: Dirent[] = [];
  try {
    entries = fs.readdirSync(crawlPath || ".", readdirOpts);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
  callback(entries, directoryPath, currentDepth);
};

export function build(isSynchronous: boolean): WalkDirectoryFunction {
  return isSynchronous ? walkSync : walkAsync;
}
