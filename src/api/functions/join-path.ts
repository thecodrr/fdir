import { relative } from "path";
import { Options, PathSeparator } from "../../types";
import { toOutputPath } from "../../utils";

export function joinPathWithBasePath(filename: string, directoryPath: string) {
  return directoryPath + filename;
}

function joinPathWithRelativePath(root: string, options: Options) {
  return function (
    filename: string,
    outputPath: string,
    directoryPath: string
  ) {
    const sameRoot = directoryPath.startsWith(root);
    // The output path is the native path with other separators, so the root
    // ends at the same index in both
    if (sameRoot) return outputPath.slice(root.length) + filename;
    else
      return (
        toOutputPath(relative(root, directoryPath), options.pathSeparator) +
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

// Joins a name to its directory's output path. The native path serves
// `relative()`, when a resolved symlink leads outside the root.
export type JoinPathFunction = (
  filename: string,
  outputPath: string,
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
