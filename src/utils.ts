import { sep, normalize, resolve } from "path";
import { PathSeparator } from "./types";

export function cleanPath(path: string) {
  let normalized = normalize(path);

  // we have to remove the last path separator
  // to account for / root path
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep)
    normalized = normalized.substring(0, normalized.length - 1);

  return normalized;
}

const SLASHES_REGEX = /[\\/]/g;
export function convertSlashes(path: string, separator: PathSeparator) {
  return path.replace(SLASHES_REGEX, separator);
}

// A native path in the output's separator, which leaves it as is when native
export function toOutputPath(path: string, separator: PathSeparator) {
  return separator === sep ? path : convertSlashes(path, separator);
}

const WINDOWS_ROOT_DIR_REGEX = /^[a-z]:[\\/]$/i;
export function isRootDirectory(path: string) {
  return path === "/" || WINDOWS_ROOT_DIR_REGEX.test(path);
}

// Normalizes a path for the file system in the platform's own syntax, where a
// POSIX name can contain a backslash, and ends it with the native separator
export function normalizePath(
  path: string,
  options: { resolvePaths?: boolean; normalizePath?: boolean }
) {
  const { resolvePaths, normalizePath } = options;
  const pathNeedsCleaning =
    (process.platform === "win32" && path.includes("/")) ||
    path.startsWith(".");

  if (resolvePaths) path = resolve(path);
  if (normalizePath || pathNeedsCleaning) path = cleanPath(path);

  if (path === ".") return "";

  // On Windows a "/" gets the path cleaned above, so only `sep` can end it
  return path[path.length - 1] === sep ? path : path + sep;
}
