declare module "fdir" {
  type Options = {
    includeDirs?: boolean;
    includeBasePath?: boolean;
    maxDepth?: number;
    searchFn?: (filePath: string) => boolean;
    resolvePaths?: boolean;
    excludedDirs?: { [dirName: string]: boolean };
  };

  type FDir = {
    sync: (dir: String) => Array<String>;
    async: (dir: String) => Promise<Array<String>>;
  };
  function fdir(options: Options): FDir;
  export = fdir;
}
