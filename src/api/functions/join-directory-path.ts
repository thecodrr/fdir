import { relative } from "path";
import { Options, PathSeparator } from "../../types";
import { convertSlashes } from "../../utils";

function joinDirectoryPathWithRelativePath(root: string, options: Options) {
  return function (
    dirname: string,
    parentPath: string,
    separator: PathSeparator
  ) {
    const sameRoot = parentPath.startsWith(root);
    if (sameRoot)
      return joinDirectoryPath(
        dirname,
        parentPath.slice(root.length),
        separator
      );
    else
      return joinDirectoryPath(
        dirname,
        convertSlashes(relative(root, parentPath), separator) + separator,
        separator
      );
  };
}

export function joinDirectoryPath(
  dirname: string,
  parentPath: string,
  separator: PathSeparator
) {
  if (!dirname) return parentPath || ".";
  return parentPath + dirname + separator;
}

export type JoinDirectoryPathFunction = (
  dirname: string,
  parentPath: string,
  separator: PathSeparator
) => string;

export function build(
  root: string,
  options: Options
): JoinDirectoryPathFunction {
  const { relativePaths } = options;

  return relativePaths && root
    ? joinDirectoryPathWithRelativePath(root, options)
    : joinDirectoryPath;
}
