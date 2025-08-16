import Directory from "mock-fs/lib/directory";
import FileSystem from "mock-fs/lib/filesystem";
import SymbolicLink from "mock-fs/lib/symlink";
import File from "mock-fs/lib/file";
import { resolve, sep } from "path";
import { root } from "./utils";
import { mkdir, mkdtemp, rm, stat, symlink, writeFile } from "fs/promises";

export class MockFS {
  root: string;
  constructor(private readonly filesystem: FileSystem.DirectoryItems) {}

  async cleanup() {
    await rm(this.root, { recursive: true, force: true });
  }

  normalize(paths: string[]) {
    return paths.map((p) => resolvePath(this.root, this.root, p));
  }

  resolve(path: string) {
    return resolvePath(this.root, this.root, path);
  }

  async init() {
    this.root = await mkdtemp("fdir");
    const { symlinks } = await this.createFilesystem(
      this.root,
      this.filesystem
    );
    for (const { path, targetPath } of symlinks) {
      if (!targetPath.includes(this.root))
        throw new Error(
          "Cannot recurse above the temp directory: " + targetPath
        );

      const isDirectory = await (async () => {
        try {
          return (await stat(targetPath)).isDirectory();
        } catch {
          return false;
        }
      })();
      await symlink(targetPath, path, isDirectory ? "dir" : "file");
    }
  }

  private async createFilesystem(
    root: string,
    filesystem: FileSystem.DirectoryItems
  ) {
    await mkdir(root, { recursive: true });
    let symlinks: { path: string; targetPath: string }[] = [];
    for (const name in filesystem) {
      const item = filesystem[name];
      const parentPath = resolvePath(this.root, root, name);
      if (!parentPath.includes(this.root))
        throw new Error(
          "Cannot recurse above the temp directory: " + parentPath
        );
      if (typeof item === "function") {
        const unknownItem = item();
        if (unknownItem instanceof File) {
          await writeFile(parentPath, unknownItem.getContent());
        } else if (unknownItem instanceof SymbolicLink) {
          const targetPath = resolvePath(
            this.root,
            root,
            unknownItem.getPath()
          );
          symlinks.push({
            path: parentPath,
            targetPath,
          });
        } else if (unknownItem instanceof Directory) {
          throw new Error("Not implemented.");
        }
      } else if (typeof item === "string" || Buffer.isBuffer(item)) {
        await writeFile(parentPath, item);
      } else {
        symlinks = [
          ...symlinks,
          ...(await this.createFilesystem(parentPath, item)).symlinks,
        ];
      }
    }
    return { symlinks };
  }
}

function resolvePath(rootPath: string, relativeRoot: string, path: string) {
  const startsWithRoot = path.startsWith(root());
  const endsWithPathSeparator = path.endsWith(sep);
  if (startsWithRoot)
    return (
      resolve(rootPath, path.replace(root(), "")) +
      (endsWithPathSeparator ? sep : "")
    );
  return resolve(relativeRoot, path) + (endsWithPathSeparator ? sep : "");
}
