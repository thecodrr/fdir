import { FilterPredicate, Options, Counts } from "../../types";

export type PushFileFunction = (
  directoryPath: string,
  paths: string[],
  counts: Counts,
  filters?: FilterPredicate[]
) => void;

const pushFileFilterAndCount: PushFileFunction = (
  filename,
  _paths,
  counts,
  filters
) => {
  if (filters!.every((filter) => filter(filename, false))) counts.files++;
};

const pushFileFilter: PushFileFunction = (
  filename,
  paths,
  _counts,
  filters
) => {
  if (filters!.every((filter) => filter(filename, false))) paths.push(filename);
};

const pushFileCount: PushFileFunction = (
  _filename,
  _paths,
  counts,
  _filters
) => {
  counts.files++;
};

const pushFile: PushFileFunction = (filename, paths) => {
  paths.push(filename);
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
