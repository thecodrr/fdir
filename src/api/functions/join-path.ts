import { relative } from "path";
import { Options, PathSeparator } from "../../types";
import { convertSlashes } from "../../utils";

export function joinPathWithBasePath(filename: string, directoryPath: string) {
  return directoryPath + filename;
}

function joinPathWithRelativePath(root: string, options: Options) {
  return function (filename: string, directoryPath: string) {
    const sameRoot = directoryPath.startsWith(root);
    if (sameRoot) return directoryPath.replace(root, "") + filename;
    else
      return (
        convertSlashes(relative(root, directoryPath), options.pathSeparator) +
        options.pathSeparator +
        filename
      );
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
    ? joinPathWithRelativePath(root, options)
    : includeBasePath
      ? joinPathWithBasePath
      : joinPath;
}
