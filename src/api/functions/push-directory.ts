import { FilterPredicate, Options, Counts } from "../../types";

export type PushDirectoryFunction = (
  directoryPath: string,
  paths: string[],
  pushPath: (path: string, arr: string[]) => void,
  counts: Counts,
  filters?: FilterPredicate[]
) => void;

function pushDirectoryWithRelativePath(root: string): PushDirectoryFunction {
  return function (directoryPath, paths, pushPath, counts) {
    pushPath(directoryPath.substring(root.length) || ".", paths);
    counts.directories++;
  };
}

function pushDirectoryFilterWithRelativePath(
  root: string
): PushDirectoryFunction {
  return function (directoryPath, paths, pushPath, counts, filters) {
    const relativePath = directoryPath.substring(root.length) || ".";
    if (filters!.every((filter) => filter(relativePath, true))) {
      pushPath(relativePath, paths);
      counts.directories++;
    }
  };
}

const pushDirectory: PushDirectoryFunction = (
  directoryPath,
  paths,
  pushPath,
  counts
) => {
  pushPath(directoryPath || ".", paths);
  counts.directories++;
};

const pushDirectoryFilter: PushDirectoryFunction = (
  directoryPath,
  paths,
  pushPath,
  counts,
  filters
) => {
  const path = directoryPath || ".";
  if (filters!.every((filter) => filter(path, true))) {
    pushPath(path, paths);
    counts.directories++;
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
