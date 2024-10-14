import fs from "fs";
import { WalkerState, Options } from "../../types";
import { dirname } from "path";
import { readlink } from "fs/promises";

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
    options: { suppressErrors, useRealPaths },
  } = state;
  queue.enqueue();

  fs.realpath(path, (error, resolvedPath) => {
    if (error) return queue.dequeue(suppressErrors ? null : error, state);

    fs.stat(resolvedPath, (error, stat) => {
      if (error) return queue.dequeue(suppressErrors ? null : error, state);

      if (stat.isDirectory()) {
        isRecursiveAsync(path, resolvedPath, state).then((isRecursive) => {
          if (isRecursive) return queue.dequeue(null, state);
          callback(stat, useRealPaths ? resolvedPath : path);
          queue.dequeue(null, state);
        });
      } else {
        callback(stat, useRealPaths ? resolvedPath : path);
        queue.dequeue(null, state);
      }
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
    options: { suppressErrors, useRealPaths },
  } = state;
  queue.enqueue();

  try {
    const resolvedPath = fs.realpathSync(path);
    const stat = fs.statSync(resolvedPath);

    if (stat.isDirectory() && isRecursive(path, resolvedPath, state)) return;

    callback(stat, useRealPaths ? resolvedPath : path);
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

async function isRecursiveAsync(
  path: string,
  resolved: string,
  state: WalkerState
) {
  if (state.options.useRealPaths)
    return isRecursiveUsingRealPaths(resolved, state);

  let parent = dirname(path);
  if (parent + state.options.pathSeparator === state.root || parent === path)
    return false;
  try {
    const resolvedParent =
      state.symlinks.get(parent) || (await readlink(parent));
    if (resolvedParent !== resolved) return false;
    state.symlinks.set(path, resolved);
    return true;
  } catch (e) {
    return isRecursiveAsync(parent, resolved, state);
  }
}

function isRecursiveUsingRealPaths(resolved: string, state: WalkerState) {
  return state.visited.includes(resolved + state.options.pathSeparator);
}

function isRecursive(path: string, resolved: string, state: WalkerState) {
  if (state.options.useRealPaths)
    return isRecursiveUsingRealPaths(resolved, state);

  let parent = dirname(path);
  if (parent + state.options.pathSeparator === state.root || parent === path)
    return false;
  try {
    const resolvedParent =
      state.symlinks.get(parent) || fs.readlinkSync(parent);
    if (resolvedParent !== resolved) return false;
    state.symlinks.set(path, resolved);
    return true;
  } catch (e) {
    return isRecursive(parent, resolved, state);
  }
}
