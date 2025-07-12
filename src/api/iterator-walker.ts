import { basename, dirname } from "path";
import { isRootDirectory, normalizePath } from "../utils";
import { WalkerState, Options, OutputIterator, IterableOutput } from "../types";
import * as joinPath from "./functions/join-path";
import * as pushDirectory from "./functions/push-directory";
import * as pushFile from "./functions/push-file";
import * as resolveSymlink from "./functions/resolve-symlink";
import * as walkDirectory from "./functions/walk-directory";
import { Queue } from "./queue";
import type { Dirent } from "fs";
import * as nativeFs from "fs";
import { Counter } from "./counter";
import { Aborter } from "./aborter";

export class IteratorWalker<TOutput extends IterableOutput> {
  private readonly root: string;
  private readonly state: WalkerState;
  private readonly joinPath: joinPath.JoinPathFunction;
  private readonly pushDirectory: pushDirectory.PushDirectoryFunction;
  private readonly pushFile: pushFile.PushFileFunction;
  private readonly resolveSymlink: resolveSymlink.ResolveSymlinkFunction | null;
  private readonly walkDirectory: walkDirectory.WalkDirectoryFunction;
  #complete = false;

  constructor(
    root: string,
    options: Options,
  ) {
    this.root = normalizePath(root, options);
    this.state = {
      root: isRootDirectory(this.root) ? this.root : this.root.slice(0, -1),
      // Perf: we explicitly tell the compiler to optimize for String arrays
      paths: [""].slice(0, 0),
      groups: [],
      counts: new Counter(),
      options,
      queue: new Queue((error, state) => {
        this.#complete = true;
      }),
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
    this.joinPath = joinPath.build(this.root, options);
    this.pushDirectory = pushDirectory.build(this.root, options);
    this.pushFile = pushFile.build(options);
    this.resolveSymlink = resolveSymlink.build(options, false);
    this.walkDirectory = walkDirectory.build(false);
  }

  get aborted(): boolean {
    const {
      controller,
      options: { signal },
    } = this.state;
    return controller.aborted || (signal !== undefined && signal.aborted);
  }

  #pushDirectory(
    directoryPath: string,
  ): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      let pushed: string | null = null;
      // this is synchronous. if we ever make pushDirectory async,
      // rework everything!
      this.pushDirectory(
        directoryPath,
        this.state.paths,
        (pushedPath) => {
          pushed = pushedPath;
        },
        this.state.counts,
        this.state.options.filters
      );
      resolve(pushed);
    });
  }

  #pushFile(
    filePath: string,
  ): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      let pushed: string | null = null;
      // this is synchronous. if we ever make pushFile async,
      // rework everything!
      this.pushFile(
        filePath,
        this.state.paths,
        (pushedPath) => {
          pushed = pushedPath;
        },
        this.state.counts,
        this.state.options.filters
      );
      resolve(pushed);
    });
  }

  #resolveSymlink(
    symlinkPath: string
  ): Promise<{stat: nativeFs.Stats; resolvedPath: string;} | null> {
    return new Promise((resolve) => {
      if (!this.resolveSymlink) {
        resolve(null);
        return;
      }

      // WONT ACTUALLY RESOLVE! terrible promise
      this.resolveSymlink(symlinkPath, this.state, (stat, resolvedPath) => {
        resolve({stat, resolvedPath});
      });
    });
  }

  #walkDirectory(
    crawlPath: string,
    directoryPath: string,
    depth: number,
  ): Promise<{
    entries: Dirent[];
    directoryPath: string;
    depth: number;
  }> {
    return new Promise<{
      entries: Dirent[];
      directoryPath: string;
      depth: number;
    }>((resolve) => {
        this.walkDirectory(
          this.state,
          crawlPath,
          directoryPath,
          depth,
          (entries, resultDirectoryPath, resultDepth) =>
            resolve({entries, directoryPath: resultDirectoryPath, depth: resultDepth})
        );
      });
  }

  async *start(): OutputIterator<TOutput> {
    let pushedPath = await this.#pushDirectory(this.root);

    if (pushedPath !== null) {
      yield pushedPath;
    }

    const toWalk: Array<{
      crawlPath: string; 
      directoryPath: string;
      depth: number;
    }> = [];
    let currentWalk: {
      crawlPath: string; 
      directoryPath: string;
      depth: number;
    } | undefined = {
      crawlPath: this.root,
      directoryPath: this.root,
      depth: this.state.options.maxDepth,
    };
    const {
      counts,
      options: {
        resolveSymlinks,
        excludeSymlinks,
        exclude,
        maxFiles,
        useRealPaths,
        pathSeparator,
      },
    } = this.state;

    while (currentWalk) {
      if (this.aborted || this.#complete) {
        break;
      }
      if (maxFiles && counts.directories + counts.files > maxFiles) {
        break;
      }

      const results = await this.#walkDirectory(
        currentWalk.crawlPath,
        currentWalk.directoryPath,
        currentWalk.depth
      );

      for (const entry of results.entries) {
        if (maxFiles && counts.directories + counts.files >= maxFiles) {
          break;
        }

        if (this.aborted) {
          break;
        }

        if (
          entry.isFile() ||
          (entry.isSymbolicLink() && !resolveSymlinks && !excludeSymlinks)
        ) {
          const filename = this.joinPath(entry.name, results.directoryPath);
          pushedPath = await this.#pushFile(filename);
          if (pushedPath !== null) {
            yield pushedPath;
          }
        } else if (entry.isDirectory()) {
          let path = joinPath.joinDirectoryPath(
            entry.name,
            results.directoryPath,
            this.state.options.pathSeparator
          );
          if (exclude && exclude(entry.name, path)) continue;
          pushedPath = await this.#pushDirectory(path);
          if (pushedPath !== null) {
            yield pushedPath;
          }
          toWalk.push({
            directoryPath: path,
            crawlPath: path,
            depth: results.depth - 1
          });
        } else if (this.resolveSymlink && entry.isSymbolicLink()) {
          let path = joinPath.joinPathWithBasePath(entry.name, results.directoryPath);
          const resolvedSymlink = await this.#resolveSymlink(
            path
          );

          if (resolvedSymlink === null) {
            continue;
          }

          if (resolvedSymlink.stat.isDirectory()) {
            const normalized = normalizePath(resolvedSymlink.resolvedPath, this.state.options);

            if (
              exclude &&
              exclude(
                entry.name,
                useRealPaths ? normalized : path + pathSeparator
              )
            ) {
              continue;
            }

            toWalk.push({
              crawlPath: normalized,
              directoryPath: useRealPaths ? normalized : path + pathSeparator,
              depth: results.depth - 1
            });
          } else {
            const normalized = useRealPaths ? resolvedSymlink.resolvedPath : path;
            const filename = basename(normalized);
            const directoryPath = normalizePath(
              dirname(normalized),
              this.state.options
            );
            pushedPath = await this.#pushFile(
              this.joinPath(filename, directoryPath)
            );
            if (pushedPath !== null) {
              yield pushedPath;
            }
          }
        }
      }

      currentWalk = toWalk.pop();
    }
  }

  stop(): void {
    this.state.controller.abort();
  }
}
