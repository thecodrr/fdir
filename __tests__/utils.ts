import path from "path";
import type { APIBuilder } from "../src/builder/api-builder";
import type { IterableOutput } from "../src/types";

export type APITypes = (typeof apiTypes)[number];
export const apiTypes = ["withPromise", "sync", "withIterator"] as const;

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

export async function execute<T extends IterableOutput>(
  api: APIBuilder<T>,
  type: APITypes
): Promise<T> {
  let files: T[number][] = [];

  if (type === "withIterator") {
    for await (const file of api[type]()) {
      files.push(file);
    }
  } else {
    files = await api[type]();
  }
  return files as T;
}
