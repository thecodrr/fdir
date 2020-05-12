declare module "fdir" {
  type FilterFn = (filePath: string) => boolean;
  type ExcludeFn = (dirPath: string) => boolean;
  type Callback = (error: Error, output: Output) => void;

  type Group = { dir: string; files: string[] };
  type GroupOutput = Group[];
  type OnlyCountsOutput = { files: number; dirs: number };
  type PathsOutput = string[];

  type Output = GroupOutput | OnlyCountsOutput | PathsOutput;

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
     * Create a new Builder fluently.
     * Shorthand for: `new Builder()`
     */
    static new(): Builder;

    /**
     * Prepend base path to all the paths
     */
    withBasePath(): Builder;

    /**
     * Include directories in the output
     */
    withDirs(): Builder;

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
     * Finalize settings and start crawling
     */
    crawl(dirPath: string): APIBuilder;
  }

  export default Builder;
}
