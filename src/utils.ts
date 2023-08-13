import { sep, normalize } from "path";
import { PathSeparator } from "./types";

export function cleanPath(path: string) {
  let normalized = normalize(path);

  // we have to remove the last path separator
  // to account for / root path
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep)
    normalized = normalized.substring(0, normalized.length - 1);

  return normalized;
}

const SLASHES_REGEX = /[\\/]+/g;
export function convertSlashes(path: string, separator: PathSeparator) {
  return path.replace(SLASHES_REGEX, separator);
}
