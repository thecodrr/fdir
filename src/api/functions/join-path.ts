import { relative } from "path";
import { Options } from "../../types";
import { convertSlashes } from "../../utils";

export function joinPathWithBasePath(filename: string, directoryPath: string) {
  return directoryPath + filename;
}

function joinPathWithRelativePath(root: string, options: Options) {
  return function (filename: string, directoryPath: string) {
    const sameRoot = directoryPath.startsWith(root);
    if (sameRoot) return directoryPath.slice(root.length) + filename;
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
