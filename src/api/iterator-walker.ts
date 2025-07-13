import { basename, dirname } from "path";
import { isRootDirectory, normalizePath } from "../utils";
import { WalkerState, Options, OutputIterator, IterableOutput } from "../types";
import * as joinPath from "./functions/join-path";
import * as pushDirectory from "./functions/push-directory";
import * as pushFile from "./functions/push-file";
import * as resolveSymlink from "./functions/resolve-symlink";
import { Queue } from "./queue";
import type { Dirent } from "fs";
import * as nativeFs from "fs";
import { Counter } from "./counter";
import { Aborter } from "./aborter";
import { promisify } from "node:util";

export class IteratorWalker<TOutput extends IterableOutput> {
  private readonly root: string;
  private readonly state: WalkerState;
  private readonly joinPath: joinPath.JoinPathFunction;
  private readonly pushDirectory: pushDirectory.PushDirectoryFunction;
  private readonly pushFile: pushFile.PushFileFunction;
  private readonly resolveSymlink: resolveSymlink.ResolveSymlinkFunction | null;
  #complete = false;

  constructor(root: string, options: Options) {
    this.root = normalizePath(root, options);
    this.state = {
      root: isRootDirectory(this.root) ? this.root : this.root.slice(0, -1),
      paths: [],
      groups: [],
      counts: new Counter(),
      options,
      queue: new Queue(() => {}),
      symlinks: new Map(),
      visited: [""].slice(0, 0),
      controller: new Aborter(),
      fs: options.fs || nativeFs,
    };

    this.joinPath = joinPath.build(this.root, options);
    this.pushDirectory = pushDirectory.build(this.root, options);
    this.pushFile = pushFile.build(options);
    this.resolveSymlink = resolveSymlink.build(options, false);
  }

  get aborted(): boolean {
    const {
      controller,
      options: { signal },
    } = this.state;
    return controller.aborted || (signal !== undefined && signal.aborted);
  }

  #pushDirectory(directoryPath: string): Promise<string | null> {
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

  #pushFile(filePath: string): Promise<string | null> {
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

  async #resolveSymlink(
    symlinkPath: string
  ): Promise<{ stat: nativeFs.Stats; resolvedPath: string } | null> {
    const { fs, options } = this.state;

    if (!options.resolveSymlinks || options.excludeSymlinks) {
      return null;
    }

    try {
      const resolvedPath = await promisify(fs.realpath)(symlinkPath);
      const stat = await promisify(fs.stat)(resolvedPath);

      if (
        !stat.isDirectory() ||
        !resolveSymlink.isRecursive(symlinkPath, resolvedPath, this.state)
      ) {
        return { stat, resolvedPath };
      }
    } catch (err) {
      if (!options.suppressErrors) {
        throw err;
      }
    }

    return null;
  }

  async #walkDirectory(crawlPath: string, depth: number): Promise<Dirent[]> {
    const { state } = this;
    const {
      fs,
      options: { suppressErrors },
    } = state;

    if (depth < 0) {
      return [];
    }

    state.visited.push(crawlPath);

    try {
      const entries = await promisify(fs.readdir)(crawlPath || ".", {
        withFileTypes: true,
      });
      return entries;
    } catch (err) {
      if (suppressErrors) {
        return [];
      }
      throw err;
    }
  }

  async *start(): OutputIterator<TOutput> {
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
    let pushedPath = await this.#pushDirectory(this.root);

    if (pushedPath !== null) {
      yield pushedPath;
    }

    const toWalk: Array<{
      crawlPath: string;
      directoryPath: string;
      depth: number;
    }> = [];
    let currentWalk:
      | {
          crawlPath: string;
          directoryPath: string;
          depth: number;
        }
      | undefined = {
      crawlPath: this.root,
      directoryPath: this.root,
      depth: this.state.options.maxDepth,
    };

    while (currentWalk) {
      if (this.aborted || this.#complete) {
        break;
      }
      if (maxFiles && counts.directories + counts.files > maxFiles) {
        break;
      }

      const results = await this.#walkDirectory(
        currentWalk.crawlPath,
        currentWalk.depth
      );

      for (const entry of results) {
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
          const filename = this.joinPath(entry.name, currentWalk.directoryPath);
          pushedPath = await this.#pushFile(filename);
          if (pushedPath !== null) {
            yield pushedPath;
          }
        } else if (entry.isDirectory()) {
          let path = joinPath.joinDirectoryPath(
            entry.name,
            currentWalk.directoryPath,
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
            depth: currentWalk.depth - 1,
          });
        } else if (this.resolveSymlink && entry.isSymbolicLink()) {
          let path = joinPath.joinPathWithBasePath(
            entry.name,
            currentWalk.directoryPath
          );
          const resolvedSymlink = await this.#resolveSymlink(path);

          if (resolvedSymlink === null) {
            continue;
          }

          if (resolvedSymlink.stat.isDirectory()) {
            const normalized = normalizePath(
              resolvedSymlink.resolvedPath,
              this.state.options
            );

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
              depth: currentWalk.depth - 1,
            });
          } else {
            const normalized = useRealPaths
              ? resolvedSymlink.resolvedPath
              : path;
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
