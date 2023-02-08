import { sep } from "path";
import { Options } from "../../types";

function joinPathWithBasePath(filename: string, directoryPath: string) {
  return directoryPath + filename;
}

function joinPathWithRelativePath(relativePath: string) {
  relativePath += relativePath[relativePath.length - 1] === sep ? "" : sep;
  return function(filename: string, directoryPath: string) {
    return directoryPath.substring(relativePath.length) + filename;
  };
}

function joinPath(filename: string) {
  return filename;
}

export function joinDirectoryPath(filename: string, directoryPath: string) {
  return directoryPath + filename + sep;
}

export type JoinPathFunction = (
  filename: string,
  directoryPath: string
) => string;

export function build(root: string, options: Options): JoinPathFunction {
  const { relativePaths, includeBasePath } = options;

  return relativePaths
    ? joinPathWithRelativePath(root)
    : includeBasePath
    ? joinPathWithBasePath
    : joinPath;
}
