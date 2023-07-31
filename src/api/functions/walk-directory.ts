import { WalkerState } from "../../types";
import fs from "fs";

export type WalkDirectoryFunction = (
  state: WalkerState,
  directoryPath: string,
  depth: number,
  callback: (entries: fs.Dirent[], directoryPath: string, depth: number) => void
) => void;

const readdirOpts = { withFileTypes: true } as const;

const walkAsync: WalkDirectoryFunction = (
  state,
  directoryPath,
  currentDepth,
  callback
) => {
  state.queue.enqueue();

  if (currentDepth < 0) {
    state.queue.dequeue(null, state);
    return;
  }

  state.counts.directories++;

  // Perf: Node >= 10 introduced withFileTypes that helps us
  // skip an extra fs.stat call.
  fs.readdir(
    directoryPath || ".",
    readdirOpts,
    function process(error, entries = []) {
      callback(entries, directoryPath, currentDepth);

      state.queue.dequeue(state.options.suppressErrors ? null : error, state);
    }
  );
};

const walkSync: WalkDirectoryFunction = (
  state,
  directoryPath,
  currentDepth,
  callback
) => {
  if (currentDepth < 0) {
    return;
  }
  state.counts.directories++;

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(directoryPath || ".", readdirOpts);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
  callback(entries, directoryPath, currentDepth);
};

export function build(isSynchronous: boolean): WalkDirectoryFunction {
  return isSynchronous ? walkSync : walkAsync;
}
