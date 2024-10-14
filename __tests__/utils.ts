import path from "path";

export type APITypes = (typeof apiTypes)[number];
export const apiTypes = ["withPromise", "sync"] as const;

export function root() {
  return process.platform === "win32" ? process.cwd().split(path.sep)[0] : "/";
}

export function cwd() {
  return `.${path.sep}`;
}

export function restricted() {
  return process.platform === "win32"
    ? path.join(root(), "Windows", "System32")
    : "/etc";
}

export function normalize(paths: string[]) {
  return paths.map((p) =>
    path.isAbsolute(p) ? path.resolve(p) : path.normalize(p)
  );
}
