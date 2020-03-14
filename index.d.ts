declare module "fdir" {
  type Options = {
    includeDirs?: boolean;
    includeBasePath?: boolean;
    maxDepth?: number;
    searchFn?: (filePath: string) => boolean;
    resolvePaths?: boolean;
    isExcludedDir?: (dirPath: string) => boolean;
  };

  function sync(dir: String, options: Options): Array<String>;
  function async(dir: String, options: Options): Promise<Array<String>>;
  export = sync;
  export = async;
}
