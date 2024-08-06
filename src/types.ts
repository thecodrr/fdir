import { Queue } from "./api/queue";

export type Counts = {
  files: number;
  directories: number;
  /**
   * @deprecated use `directories` instead. Will be removed in v7.0.
   */
  dirs: number;
};

export type Group = {
  directory: string;
  files: string[];

  /**
   * @deprecated use `directory` instead. Will be removed in v7.0.
   */
  dir: string;
};

export type GroupOutput = Group[];
export type OnlyCountsOutput = Counts;
export type PathsOutput = string[];

export type Output = OnlyCountsOutput | PathsOutput | GroupOutput;

export type WalkerState = {
  paths: string[];
  groups: Group[];
  counts: Counts;
  options: Options;
  queue: Queue;
};

export type ResultCallback<TOutput extends Output> = (
  error: Error | null,
  output: TOutput
) => void;

export type FilterPredicate = (path: string, isDirectory: boolean) => boolean;
export type ExcludePredicate = (dirName: string, dirPath: string) => boolean;
export type PathSeparator = "/" | "\\";
export type Options = {
  includeBasePath?: boolean;
  includeDirs?: boolean;
  normalizePath?: boolean;
  maxDepth: number;
  maxFiles?: number;
  resolvePaths?: boolean;
  suppressErrors: boolean;
  group?: boolean;
  onlyCounts?: boolean;
  filters: FilterPredicate[];
  resolveSymlinks?: boolean;
  useRealPaths?: boolean;
  excludeFiles?: boolean;
  exclude?: ExcludePredicate;
  relativePaths?: boolean;
  pathSeparator: PathSeparator;
  signal?: AbortSignal;
};
