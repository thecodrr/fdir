declare module "fdir" {
  type Options = {
    includeDirs?: boolean;
    excludeBasePath?: boolean;
    maxDepth?: number;
    searchFn?: (filePath: string) => boolean;
    resolvePaths?: boolean;
    isExcludedDir?: (dirPath: string) => boolean;
    ignoreErrors?: boolean;
  };

  /**
   * Synchronously walks the directory recursively
   * @param directoryPath Path to the directory
   * @param options Options
   */
  function sync(directoryPath: string, options?: Options): string[];

  /**
   * Asynchronously walks the directory recursively
   * @param directoryPath Path to the directory
   * @param options Options
   */
  function async(directoryPath: string, options?: Options): Promise<string[]>;

  export { sync, async };
}
