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

export function isRootDirectory(path: string) {
  return path === "/" || /^[a-z]:\\$/i.test(path);
}

export function normalizePath(
  path: string,
  options: {
    resolvePaths?: boolean;
    normalizePath?: boolean;
    pathSeparator: PathSeparator;
  }
) {
  const { resolvePaths, normalizePath, pathSeparator } = options;
  const pathNeedsCleaning =
    (process.platform === "win32" && path.includes("/")) ||
    path.startsWith(".");

  if (resolvePaths) path = resolve(path);
  if (normalizePath || pathNeedsCleaning) path = cleanPath(path);

  if (path === ".") return "";

  const needsSeperator = path[path.length - 1] !== pathSeparator;
  return convertSlashes(
    needsSeperator ? path + pathSeparator : path,
    pathSeparator
  );
}
