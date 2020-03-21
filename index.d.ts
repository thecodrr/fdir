declare module "fdir" {
  type Options = {
    includeDirs?: boolean;
    includeBasePath?: boolean;
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
  function sync(directoryPath: String, options?: Options): Array<String>;

  /**
   * Asynchronously walks the directory recursively
   * @param directoryPath Path to the directory
   * @param options Options
   */
  function async(
    directoryPath: String,
    options?: Options
  ): Promise<Array<String>>;

  export { sync, async };
}
