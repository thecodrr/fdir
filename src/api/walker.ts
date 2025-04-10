import { basename, dirname } from "path";
import { isRootDirectory, normalizePath } from "../utils";
import { ResultCallback, WalkerState, Options } from "../types";
import * as joinPath from "./functions/join-path";
import * as pushDirectory from "./functions/push-directory";
import * as pushFile from "./functions/push-file";
import * as getArray from "./functions/get-array";
import * as groupFiles from "./functions/group-files";
import * as resolveSymlink from "./functions/resolve-symlink";
import * as invokeCallback from "./functions/invoke-callback";
import * as walkDirectory from "./functions/walk-directory";
import { Queue } from "./queue";
import { Dirent } from "fs";
import { Output } from "../types";
import { Counter } from "./counter";

export class Walker<TOutput extends Output> {
  private readonly root: string;
  private readonly isSynchronous: boolean;
  private readonly state: WalkerState;
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
    };

    /*
     * Perf: We conditionally change functions according to options. This gives a slight
     * performance boost. Since these functions are so small, they are automatically inlined
     * by the javascript engine so there's no function call overhead (in most cases).
     */
    this.joinPath = joinPath.build(this.root, options);
    this.pushDirectory = pushDirectory.build(this.root, options);
    this.pushFile = pushFile.build(options);
    this.getArray = getArray.build(options);
    this.groupFiles = groupFiles.build(options);
    this.resolveSymlink = resolveSymlink.build(options, this.isSynchronous);
    this.walkDirectory = walkDirectory.build(this.isSynchronous);
  }

  start(): TOutput | null {
    this.walkDirectory(
      this.state,
      this.root,
      this.root,
      this.state.options.maxDepth,
      this.walk
    );
    return this.isSynchronous ? this.callbackInvoker(this.state, null) : null;
  }

  private walk = (entries: Dirent[], directoryPath: string, depth: number) => {
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
    } = this.state;

    if ((signal && signal.aborted) || (maxFiles && paths.length > maxFiles))
      return;

    this.pushDirectory(directoryPath, paths, filters);

    const files = this.getArray(this.state.paths);
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];

      if (
        entry.isFile() ||
        (entry.isSymbolicLink() && !resolveSymlinks && !excludeSymlinks)
      ) {
        const filename = this.joinPath(entry.name, directoryPath);
        this.pushFile(filename, files, this.state.counts, filters);
      } else if (entry.isDirectory()) {
        let path = joinPath.joinDirectoryPath(
          entry.name,
          directoryPath,
          this.state.options.pathSeparator
        );
        if (exclude && exclude(entry.name, path)) continue;
        this.walkDirectory(this.state, path, path, depth - 1, this.walk);
      } else if (entry.isSymbolicLink() && this.resolveSymlink) {
        let path = joinPath.joinPathWithBasePath(entry.name, directoryPath);
        this.resolveSymlink(path, this.state, (stat, resolvedPath) => {
          if (stat.isDirectory()) {
            resolvedPath = normalizePath(resolvedPath, this.state.options);
            if (
              exclude &&
              exclude(
                entry.name,
                useRealPaths ? resolvedPath : path + pathSeparator
              )
            )
              return;

            this.walkDirectory(
              this.state,
              resolvedPath,
              useRealPaths ? resolvedPath : path + pathSeparator,
              depth - 1,
              this.walk
            );
          } else {
            resolvedPath = useRealPaths ? resolvedPath : path;
            const filename = basename(resolvedPath);
            const directoryPath = normalizePath(
              dirname(resolvedPath),
              this.state.options
            );
            resolvedPath = this.joinPath(filename, directoryPath);
            this.pushFile(resolvedPath, files, this.state.counts, filters);
          }
        });
      }
    }

    this.groupFiles(this.state.groups, directoryPath, files);
  };
}
