import { Options, PathSeparator } from "../../types";

function joinPathWithBasePath(filename: string, directoryPath: string) {
  return directoryPath + filename;
}

function joinPathWithRelativePath(root: string) {
  return function (filename: string, directoryPath: string) {
    return directoryPath.substring(root.length) + filename;
  };
}

function joinPath(filename: string) {
  return filename;
}

export function joinDirectoryPath(
  filename: string,
  directoryPath: string,
  separator: PathSeparator
) {
  return directoryPath + filename + separator;
}

export type JoinPathFunction = (
  filename: string,
  directoryPath: string
) => string;

export function build(root: string, options: Options): JoinPathFunction {
  const { relativePaths, includeBasePath } = options;

  return relativePaths && root
    ? joinPathWithRelativePath(root)
    : includeBasePath
    ? joinPathWithBasePath
    : joinPath;
}
