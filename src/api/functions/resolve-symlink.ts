import fs from "fs";
import { WalkerState, Options } from "../../types";

export type ResolveSymlinkFunction = (
  path: string,
  state: WalkerState,
  callback: (stat: fs.Stats, path: string) => void
) => void;

const resolveSymlinksAsync: ResolveSymlinkFunction = function (
  path,
  state,
  callback
) {
  const {
    queue,
    options: { suppressErrors },
  } = state;
  queue.enqueue();

  fs.stat(path, (error, stat) => {
    if (error) {
      queue.dequeue(suppressErrors ? null : error, state);
      return;
    }

    callback(stat, path);
    queue.dequeue(null, state);
  });
};

const resolveSymlinksWithRealPathsAsync: ResolveSymlinkFunction = function (
  path,
  state,
  callback
) {
  const {
    queue,
    options: { suppressErrors },
  } = state;
  queue.enqueue();

  fs.realpath(path, (error, resolvedPath) => {
    if (error) {
      queue.dequeue(suppressErrors ? null : error, state);
      return;
    }

    fs.lstat(resolvedPath, (_error, stat) => {
      callback(stat, resolvedPath);

      queue.dequeue(null, state);
    });
  });
};

const resolveSymlinksSync: ResolveSymlinkFunction = function (
  path,
  state,
  callback
) {
  try {
    const stat = fs.statSync(path);
    callback(stat, path);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
};

const resolveSymlinksWithRealPathsSync: ResolveSymlinkFunction = function (
  path,
  state,
  callback
) {
  try {
    const resolvedPath = fs.realpathSync(path);
    const stat = fs.lstatSync(resolvedPath);
    callback(stat, resolvedPath);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
};

export function build(
  options: Options,
  isSynchronous: boolean
): ResolveSymlinkFunction | null {
  if (!options.resolveSymlinks) return null;

  if (options.useRealPaths)
    return isSynchronous
      ? resolveSymlinksWithRealPathsSync
      : resolveSymlinksWithRealPathsAsync;
  return isSynchronous ? resolveSymlinksSync : resolveSymlinksAsync;
}
