import { FilterPredicate, Options, Counts } from "../../types";

export type PushFileFunction = (
  directoryPath: string,
  paths: string[],
  pushPath: (path: string, arr: string[]) => void,
  counts: Counts,
  filters?: FilterPredicate[]
) => void;

const pushFileFilterAndCount: PushFileFunction = (
  filename,
  _paths,
  _pushPath,
  counts,
  filters
) => {
  if (filters!.every((filter) => filter(filename, false))) counts.files++;
};

const pushFileFilter: PushFileFunction = (
  filename,
  paths,
  pushPath,
  counts,
  filters
) => {
  if (filters!.every((filter) => filter(filename, false))) {
    pushPath(filename, paths);
    counts.files++;
  }
};

const pushFileCount: PushFileFunction = (
  _filename,
  _paths,
  _pushPath,
  counts,
  _filters
) => {
  counts.files++;
};

const pushFile: PushFileFunction = (filename, paths, pushPath, counts) => {
  pushPath(filename, paths);
  counts.files++;
};

const empty: PushFileFunction = () => {};

export function build(options: Options): PushFileFunction {
  const { excludeFiles, filters, onlyCounts } = options;
  if (excludeFiles) return empty;

  if (filters && filters.length) {
    return onlyCounts ? pushFileFilterAndCount : pushFileFilter;
  } else if (onlyCounts) {
    return pushFileCount;
  } else {
    return pushFile;
  }
}
