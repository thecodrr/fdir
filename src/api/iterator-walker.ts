import { basename, dirname } from "path";
import { isRootDirectory, normalizePath } from "../utils";
import { WalkerState, Options, OutputIterator, IterableOutput } from "../types";
import * as joinPath from "./functions/join-path";
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
  private readonly resolveSymlink: resolveSymlink.ResolveSymlinkFunction | null;

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
    this.resolveSymlink = resolveSymlink.build(options, false);
  }

  get aborted(): boolean {
    const {
      controller,
      options: { signal },
    } = this.state;
    return controller.aborted || (signal !== undefined && signal.aborted);
  }

  #shouldPushDirectory(directoryPath: string): boolean {
    const { options } = this.state;
    const { includeDirs, filters } = options;

    if (!includeDirs) {
      return false;
    }

    if (filters && filters.length) {
      return filters.every((filter) => filter(directoryPath, true));
    }

    return true;
  }

  #normalizeDirectoryPath(path: string): string {
    const { options } = this.state;
    const { relativePaths } = options;

    if (relativePaths) {
      return path.substring(this.root.length) || ".";
    }
    return path || ".";
  }

  #shouldPushFile(filePath: string): boolean {
    const { options } = this.state;
    const { excludeFiles, filters } = options;

    if (excludeFiles) {
      return false;
    }

    if (filters && filters.length) {
      return filters.every((filter) => filter(filePath, false));
    }

    return true;
  }

  async #resolveSymlink(
    symlinkPath: string
  ): Promise<{ stat: nativeFs.Stats; resolvedPath: string } | null> {
    const { fs, options } = this.state;

    if (!options.resolveSymlinks || options.excludeSymlinks) {
      return null;
    }

    try {
      // TODO (43081j): probably just enforce the FSLike interface has a
      // `promises` property, and use the normal async methods instead of
      // promisifying
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

    const normalizedRoot = this.#normalizeDirectoryPath(this.root);

    if (this.#shouldPushDirectory(normalizedRoot)) {
      counts.directories++;
      yield normalizedRoot;
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
      if (this.aborted) {
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
          if (this.#shouldPushFile(filename)) {
            counts.files++;
            yield filename;
          }
        } else if (entry.isDirectory()) {
          let path = joinPath.joinDirectoryPath(
            entry.name,
            currentWalk.directoryPath,
            this.state.options.pathSeparator
          );
          if (exclude && exclude(entry.name, path)) continue;
          const normalizedPath = this.#normalizeDirectoryPath(path);
          if (this.#shouldPushDirectory(normalizedPath)) {
            counts.directories++;
            yield normalizedPath;
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
            const fullPath = this.joinPath(filename, directoryPath);
            if (this.#shouldPushFile(fullPath)) {
              counts.files++;
              yield fullPath;
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
