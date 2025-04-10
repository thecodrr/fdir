import fs from "fs";
import { WalkerState, Options } from "../../types";
import { dirname } from "path";

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

  fs.realpath(path, (error, resolvedPath) => {
    if (error) return queue.dequeue(suppressErrors ? null : error, state);

    fs.stat(resolvedPath, (error, stat) => {
      if (error) return queue.dequeue(suppressErrors ? null : error, state);

      if (stat.isDirectory() && isRecursive(path, resolvedPath, state))
        return queue.dequeue(null, state);

      callback(stat, resolvedPath);
      queue.dequeue(null, state);
    });
  });
};

const resolveSymlinks: ResolveSymlinkFunction = function (
  path,
  state,
  callback
) {
  const {
    queue,
    options: { suppressErrors },
  } = state;
  queue.enqueue();

  try {
    const resolvedPath = fs.realpathSync(path);
    const stat = fs.statSync(resolvedPath);

    if (stat.isDirectory() && isRecursive(path, resolvedPath, state)) return;

    callback(stat, resolvedPath);
  } catch (e) {
    if (!suppressErrors) throw e;
  }
};

export function build(
  options: Options,
  isSynchronous: boolean
): ResolveSymlinkFunction | null {
  if (!options.resolveSymlinks || options.excludeSymlinks) return null;

  return isSynchronous ? resolveSymlinks : resolveSymlinksAsync;
}

function isRecursive(path: string, resolved: string, state: WalkerState) {
  if (state.options.useRealPaths)
    return isRecursiveUsingRealPaths(resolved, state);

  let parent = dirname(path);
  let depth = 1;
  while (parent !== state.root && depth < 2) {
    const resolvedPath = state.symlinks.get(parent);
    const isSameRoot =
      !!resolvedPath &&
      (resolvedPath === resolved ||
        resolvedPath.startsWith(resolved) ||
        resolved.startsWith(resolvedPath));
    if (isSameRoot) depth++;
    else parent = dirname(parent);
  }
  state.symlinks.set(path, resolved);
  return depth > 1;
}

function isRecursiveUsingRealPaths(resolved: string, state: WalkerState) {
  return state.visited.includes(resolved + state.options.pathSeparator);
}
