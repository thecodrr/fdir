declare module "fdir" {
  export type GroupOutput = Group[];
  export type OnlyCountsOutput = { files: number; dirs: number };
  export type PathsOutput = string[];

  type FilterFn = (path: string, isDirectory: boolean) => boolean;
  type ExcludeFn = (dirName: string, dirPath: string) => boolean;
  type Callback = (error: Error, output: Output) => void;

  type Group = { dir: string; files: string[] };

  type Output = GroupOutput | OnlyCountsOutput | PathsOutput;

  type Options = {
    includeBasePath?: boolean;
    includeDirs?: boolean;
    normalizePath?: boolean;
    maxDepth?: number;
    resolvePaths?: boolean;
    suppressErrors?: boolean;
    group?: boolean;
    onlyCounts?: boolean;
    filters?: FilterFn[];
    resolveSymlinks?: boolean;
    excludeFiles?: boolean;
    exclude?: ExcludeFn;
  };

  class APIBuilder {
    /**
     * Crawl with promise (`async`/`await`)
     */
    withPromise(): Promise<Output>;

    /**
     * Crawl with callback
     * @param callback the callback
     */
    withCallback(callback: Callback): void;

    /**
     * Crawl synchronously
     */
    sync(): Output;
  }

  class Builder {
    /**
     * Prepend base path to all the paths
     */
    withBasePath(): Builder;

    /**
     * Include directories in the output
     */
    withDirs(): Builder;

    /**
     * Resolve and recurse over all symlinks
     */
     withSymlinks(): Builder;

    /**
     * The depth to crawl to before stopping
     * @param depth The depth
     */
    withMaxDepth(depth: number): Builder;

    /**
     * Resolve all paths before adding them
     */
    withFullPaths(): Builder;

    /**
     * Do not suppress errors
     */
    withErrors(): Builder;

    /**
     * Group files by directories they are in
     */
    group(): Builder;

    /**
     * Normalize the given path using `path.normalize()`
     */
    normalize(): Builder;

    /**
     * Filter files based on the `filterFn`
     * @param filterFn The filter function
     */
    filter(filterFn: FilterFn): Builder;

    /**
     * Filter files using glob patterns.
     * @param patterns The glob patterns
     * @remarks You will need to install `picomatch` to use this.
     */
    glob(...patterns: string[]): Builder;

    /**
     * Exclude the directories that satisfy a condition
     * @param excludeFn The exclusion function
     */
    exclude(excludeFn: ExcludeFn): Builder;

    /**
     * Return only counts in output
     */
    onlyCounts(): Builder;

    /**
     * Ignore all files and return only directories
     */
    onlyDirs(): Builder;

    /**
     * Finalize settings and start crawling
     * @param dirPath The path of the directory
     */
    crawl(dirPath: string): APIBuilder;

    /**
     * Start crawling with custom options
     * @param dirPath The path of the directory
     * @param options Custom options
     */
    crawlWithOptions(dirPath: string, options: Options): APIBuilder;
  }

  export { Builder as fdir };
}
