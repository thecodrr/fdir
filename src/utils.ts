import { sep, normalize } from "path";

export function cleanPath(path: string) {
  let normalized = normalize(path);

  // to account for / path
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep)
    normalized = normalized.substring(0, normalized.length - 1);
  return normalized;
}
