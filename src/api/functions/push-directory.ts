import { FilterPredicate, Options } from "../../types";

export type PushDirectoryFunction = (
  directoryPath: string,
  paths: string[],
  pushPath: (path: string, arr: string[]) => void,
  filters?: FilterPredicate[]
) => void;

function pushDirectoryWithRelativePath(root: string): PushDirectoryFunction {
  return function (directoryPath, paths, pushPath) {
    pushPath(directoryPath.substring(root.length) || ".", paths);
  };
}

function pushDirectoryFilterWithRelativePath(
  root: string
): PushDirectoryFunction {
  return function (directoryPath, paths, pushPath, filters) {
    const relativePath = directoryPath.substring(root.length) || ".";
    if (filters!.every((filter) => filter(relativePath, true))) {
      pushPath(relativePath, paths);
    }
  };
}

const pushDirectory: PushDirectoryFunction = (
  directoryPath,
  paths,
  pushPath
) => {
  pushPath(directoryPath || ".", paths);
};

const pushDirectoryFilter: PushDirectoryFunction = (
  directoryPath,
  paths,
  pushPath,
  filters
) => {
  const path = directoryPath || ".";
  if (filters!.every((filter) => filter(path, true))) {
    pushPath(path, paths);
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
