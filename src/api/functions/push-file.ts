import {
  FilterPredicate,
  Options,
  Counts,
  TransformPredicate,
} from "../../types";

export type PushFileFunction = (
  directoryPath: string,
  paths: string[],
  counts: Counts,
  filters?: FilterPredicate[],
  transform?: TransformPredicate
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
  filters,
  transformer
) => {
  if (filters!.every((filter) => filter(filename, false)))
    paths.push(transformer?.(filename, false) ?? filename);
};

const pushFileCount: PushFileFunction = (_filename, _paths, counts) => {
  counts.files++;
};

const pushFile: PushFileFunction = (
  filename,
  paths,
  _counts,
  _filters,
  transformer
) => {
  paths.push(transformer?.(filename, false) ?? filename);
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
