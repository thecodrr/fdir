declare module "fdir" {
  export type GroupOutput = Group[];
  export type OnlyCountsOutput = { files: number; dirs: number };
  export type PathsOutput = string[];

  export type FilterFn = (path: string, isDirectory: boolean) => boolean;
  export type ExcludeFn = (dirName: string, dirPath: string) => boolean;
  export type Callback = (error: Error, output: Output) => void;

  export type Group = { dir: string; files: string[] };

  export type Output = GroupOutput | OnlyCountsOutput | PathsOutput;

  export type Options = {
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
    relativePaths?: boolean;
    useRealPaths?: boolean;
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
     * Recursively follow all symlinks
     * @param {boolean} resolvePaths  By default, `fdir` returns original paths to files irrespective of whether they are inside a symlinked directory or not. If you want the paths to be relative to the symlink, set this flag to `false`. (Default is `true`).
     */
    withSymlinks(resolvePaths?: boolean): Builder;

    /**
     * Return paths relative to the root directory
     */
    withRelativePaths(): Builder;

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
