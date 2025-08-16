import { basename, dirname, sep } from "path";
import { convertSlashes, isRootDirectory, normalizePath } from "../utils";
import { ResultCallback, WalkerState, Options } from "../types";
import * as joinPath from "./functions/join-path";
import * as joinDirectoryPath from "./functions/join-directory-path";
import * as pushDirectory from "./functions/push-directory";
import * as pushFile from "./functions/push-file";
import * as getArray from "./functions/get-array";
import * as groupFiles from "./functions/group-files";
import * as resolveSymlink from "./functions/resolve-symlink";
import * as invokeCallback from "./functions/invoke-callback";
import * as walkDirectory from "./functions/walk-directory";
import { Queue } from "./queue";
import type { Dirent } from "fs";
import * as nativeFs from "fs";
import { Output } from "../types";
import { Counter } from "./counter";
import { Aborter } from "./aborter";

export class Walker<TOutput extends Output> {
  private readonly root: string;
  private readonly isSynchronous: boolean;
  private readonly state: WalkerState;
  private readonly joinDirectoryPath: joinDirectoryPath.JoinDirectoryPathFunction;
  private readonly joinPath: joinPath.JoinPathFunction;
  private readonly pushDirectory: pushDirectory.PushDirectoryFunction;
  private readonly pushFile: pushFile.PushFileFunction;
  private readonly getArray: getArray.GetArrayFunction;
  private readonly groupFiles: groupFiles.GroupFilesFunction;
  private readonly resolveSymlink: resolveSymlink.ResolveSymlinkFunction | null;
  private readonly walkDirectory: walkDirectory.WalkDirectoryFunction;
  private readonly callbackInvoker: invokeCallback.InvokeCallbackFunction<TOutput>;

  constructor(
    root: string,
    options: Options,
    callback?: ResultCallback<TOutput>
  ) {
    this.isSynchronous = !callback;
    this.callbackInvoker = invokeCallback.build(options, this.isSynchronous);

    this.root = normalizePath(root, options);
    this.state = {
      root: isRootDirectory(this.root) ? this.root : this.root.slice(0, -1),
      // Perf: we explicitly tell the compiler to optimize for String arrays
      paths: [""].slice(0, 0),
      groups: [],
      counts: new Counter(),
      options,
      queue: new Queue((error, state) =>
        this.callbackInvoker(state, error, callback)
      ),
      symlinks: new Map(),
      visited: [""].slice(0, 0),
      controller: new Aborter(),
      fs: options.fs || nativeFs,
    };

    /*
     * Perf: We conditionally change functions according to options. This gives a slight
     * performance boost. Since these functions are so small, they are automatically inlined
     * by the javascript engine so there's no function call overhead (in most cases).
     */
    this.joinDirectoryPath = joinDirectoryPath.build(this.root, options);
    this.joinPath = joinPath.build(this.root, options);
    this.pushDirectory = pushDirectory.build(options);
    this.pushFile = pushFile.build(options);
    this.getArray = getArray.build(options);
    this.groupFiles = groupFiles.build(options);
    this.resolveSymlink = resolveSymlink.build(options, this.isSynchronous);
    this.walkDirectory = walkDirectory.build(this.isSynchronous);
  }

  start(): TOutput | null {
    const relativePath = this.joinDirectoryPath(
      "",
      this.root,
      this.state.options.pathSeparator
    );
    this.pushDirectory(
      relativePath,
      this.state.paths,
      this.state.options.filters
    );
    this.walkDirectory(
      this.state,
      convertSlashes(this.root, sep),
      relativePath,
      this.state.options.maxDepth,
      this.walk
    );
    return this.isSynchronous ? this.callbackInvoker(this.state, null) : null;
  }

  private walk = (
    entries: Dirent[],
    fullPath: string,
    relativePath: string,
    depth: number
  ) => {
    const {
      paths,
      options: {
        filters,
        resolveSymlinks,
        excludeSymlinks,
        exclude,
        maxFiles,
        signal,
        useRealPaths,
        pathSeparator,
      },
      controller,
    } = this.state;

    if (
      controller.aborted ||
      (signal && signal.aborted) ||
      (maxFiles && paths.length > maxFiles)
    )
      return;

    const files = this.getArray(this.state.paths);
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];

      if (
        entry.isFile() ||
        (entry.isSymbolicLink() && !resolveSymlinks && !excludeSymlinks)
      ) {
        const filename = this.joinPath(entry.name, fullPath);
        this.pushFile(filename, files, this.state.counts, filters);
      } else if (entry.isDirectory()) {
        const relativePath = this.joinDirectoryPath(
          entry.name,
          fullPath,
          this.state.options.pathSeparator
        );
        if (exclude && exclude(entry.name, relativePath)) continue;
        this.pushDirectory(relativePath, paths, filters);
        this.walkDirectory(
          this.state,
          joinDirectoryPath.joinDirectoryPath(entry.name, fullPath, sep),
          relativePath,
          depth - 1,
          this.walk
        );
      } else if (this.resolveSymlink && entry.isSymbolicLink()) {
        const symlinkPath = joinPath.joinPathWithBasePath(entry.name, fullPath);
        this.resolveSymlink(symlinkPath, this.state, (stat, resolvedPath) => {
          if (stat.isDirectory()) {
            resolvedPath = normalizePath(resolvedPath, this.state.options);
            const directoryPath = useRealPaths
              ? resolvedPath
              : symlinkPath + pathSeparator;
            if (exclude && exclude(entry.name, directoryPath)) return;

            this.walkDirectory(
              this.state,
              directoryPath,
              directoryPath,
              depth - 1,
              this.walk
            );
          } else if (useRealPaths) {
            const directoryPath = normalizePath(
              dirname(resolvedPath),
              this.state.options
            );
            const filename = this.joinPath(
              basename(resolvedPath),
              directoryPath
            );
            this.pushFile(filename, files, this.state.counts, filters);
          } else {
            const filename = this.joinPath(entry.name, fullPath);
            this.pushFile(filename, files, this.state.counts, filters);
          }
        });
      }
    }

    this.groupFiles(this.state.groups, relativePath, files);
  };
}
