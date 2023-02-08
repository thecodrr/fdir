import { FilterPredicate, Options } from "../../types";

export type PushDirectoryFunction = (
  directoryPath: string,
  paths: string[],
  filters?: FilterPredicate[]
) => void;

const pushDirectory: PushDirectoryFunction = (directoryPath, paths) => {
  paths.push(directoryPath);
};

const pushDirectoryFilter: PushDirectoryFunction = (
  directoryPath,
  paths,
  filters
) => {
  if (filters!.every((filter) => filter(directoryPath, true))) {
    paths.push(directoryPath);
  }
};

const empty: PushDirectoryFunction = () => {};

export function build(options: Options): PushDirectoryFunction {
  const { includeDirs, filters } = options;
  if (!includeDirs) return empty;

  return filters && filters.length ? pushDirectoryFilter : pushDirectory;
}
