import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import { apiTypes, normalize, root } from "./utils";
import mock from "mock-fs";
import { fdir, Options } from "../src";
import path from "path";

const mockFsWithSymlinks = {
  "../../sym-relative/linked": {
    "file-1": "file contents",
    "file-excluded-1": "file contents",
  },
  "../../other-relative/dir": {
    "file-2": "file contents2",
  },
  "relative/dir": {
    fileSymlink: mock.symlink({
      path: "../../../../other-relative/dir/file-2",
    }),
    fileSymlink2: mock.symlink({
      path: "../../../../other-relative/dir/file-3",
    }),
    dirSymlink: mock.symlink({
      path: "../../../../sym-relative/linked",
    }),
  },

  "/sym/linked": {
    "file-1": "file contents",
    "file-excluded-1": "file contents",
  },
  "/other/dir": {
    "file-2": "file contents2",
  },
  "/some/dir": {
    fileSymlink: mock.symlink({
      path: "/other/dir/file-2",
    }),
    fileSymlink2: mock.symlink({
      path: "/other/dir/file-3",
    }),
    dirSymlink: mock.symlink({
      path: "/sym/linked",
    }),
  },
};

for (const type of apiTypes) {
  describe.concurrent(type, () => {
    beforeAll(() => {
      mock(mockFsWithSymlinks);
    });

    afterAll(() => {
      mock.restore();
    });

    test(`resolve symlinks`, async (t) => {
      const api = new fdir().withSymlinks().crawl("/some/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "/other/dir/file-2",
          "/sym/linked/file-1",
          "/sym/linked/file-excluded-1",
        ])
      );
    });

    test(`resolve symlinks (real paths: false)`, async (t) => {
      const api = new fdir()
        .withSymlinks({ resolvePaths: false })
        .crawl("/some/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "/some/dir/dirSymlink/file-1",
          "/some/dir/dirSymlink/file-excluded-1",
          "/some/dir/fileSymlink",
        ])
      );
    });

    test(`resolve symlinks (real paths: false, relative paths: true)`, async (t) => {
      const api = new fdir()
        .withSymlinks({ resolvePaths: false })
        .withRelativePaths()
        .crawl("/some/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "dirSymlink/file-1",
          "dirSymlink/file-excluded-1",
          "fileSymlink",
        ])
      );
    });

    test(`crawl all files and include resolved symlinks with real paths with relative paths on`, async (t) => {
      const api = new fdir()
        .withSymlinks()
        .withRelativePaths()
        .crawl("./relative/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "../../../../other-relative/dir/file-2",
          "../../../../sym-relative/linked/file-1",
          "../../../../sym-relative/linked/file-excluded-1",
        ])
      );
    });

    test("resolve symlinks (exclude /sym/linked/)", async (t) => {
      const api = new fdir()
        .withSymlinks()
        .exclude((_name, path) => path === resolveSymlinkRoot("/sym/linked/"))
        .crawl("/some/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(normalize(["/other/dir/file-2"]));
    });

    test(`do not resolve symlinks`, async (t) => {
      const api = new fdir().crawl("/some/dir");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize(["dirSymlink", "fileSymlink", "fileSymlink2"])
      );
    });

    test(`exclude symlinks`, async (t) => {
      const api = new fdir({ excludeSymlinks: true }).crawl("/some/dir");
      const files = await api[type]();
      t.expect(files).toHaveLength(0);
    });
  });
}

function resolveSymlinkRoot(p: string) {
  return process.platform === "win32"
    ? path.join(root(), path.normalize(p))
    : p;
}
