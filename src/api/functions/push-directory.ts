import { Dirent } from "node:fs";
import { FilterPredicate, Options, TransformPredicate } from "../../types";

export type PushDirectoryFunction = (
  directoryPath: string,
  paths: string[],
  filters?: FilterPredicate[],
  transformer?: TransformPredicate
) => void;

function pushDirectoryWithRelativePath(root: string): PushDirectoryFunction {
  return function (directoryPath, paths, _filters, transformer) {
    const relativePath = (directoryPath || ".").substring(root.length);
    paths.push(transformer?.(relativePath, true) ?? relativePath);
  };
}

function pushDirectoryFilterWithRelativePath(
  root: string
): PushDirectoryFunction {
  return function (directoryPath, paths, filters, transformer) {
    const relativePath = directoryPath.substring(root.length);
    if (filters!.every((filter) => filter(relativePath, true))) {
      paths.push(transformer?.(relativePath, true) ?? relativePath);
    }
  };
}

const pushDirectory: PushDirectoryFunction = (
  directoryPath,
  paths,
  _filters,
  transformer
) => {
  const path = directoryPath || ".";
  paths.push(transformer?.(path, true) ?? path);
};

const pushDirectoryFilter: PushDirectoryFunction = (
  directoryPath,
  paths,
  filters,
  transformer
) => {
  if (filters!.every((filter) => filter(directoryPath, true))) {
    paths.push(transformer?.(directoryPath, true) ?? directoryPath);
  }
};

const empty: PushDirectoryFunction = () => {};

export function build(root: string, options: Options): PushDirectoryFunction {
  const { includeDirs, filters, relativePaths } = options;
  if (!includeDirs) return empty;

  if (relativePaths)
    return filters && filters.length
      ? pushDirectoryFilterWithRelativePath(root)
      : pushDirectoryWithRelativePath(root);
  return filters && filters.length ? pushDirectoryFilter : pushDirectory;
}
