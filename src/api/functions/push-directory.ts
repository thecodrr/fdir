import { FilterPredicate, Options } from "../../types";

export type PushDirectoryFunction = (
  directoryPath: string,
  paths: string[],
  filters?: FilterPredicate[]
) => void;

function pushDirectoryWithRelativePath(root: string): PushDirectoryFunction {
  return function (directoryPath, paths) {
    paths.push(directoryPath.substring(root.length) || ".");
  };
}

function pushDirectoryFilterWithRelativePath(
  root: string
): PushDirectoryFunction {
  return function (directoryPath, paths, filters) {
    const relativePath = directoryPath.substring(root.length) || ".";
    if (filters!.every((filter) => filter(relativePath, true))) {
      paths.push(relativePath);
    }
  };
}

const pushDirectory: PushDirectoryFunction = (directoryPath, paths) => {
  paths.push(directoryPath || ".");
};

const pushDirectoryFilter: PushDirectoryFunction = (
  directoryPath,
  paths,
  filters
) => {
  const path = directoryPath || ".";
  if (filters!.every((filter) => filter(path, true))) {
    paths.push(path);
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
