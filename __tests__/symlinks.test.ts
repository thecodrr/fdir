import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import { apiTypes, normalize, root } from "./utils";
import mock from "mock-fs";
import { fdir, Options } from "../src";
import path from "path";

const fsWithRelativeSymlinks = {
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
};

const fsWithRecursiveSymlinks = {
  "/double/recursive": {
    "another-file": "hello",
    "recursive-4": mock.symlink({
      path: resolveSymlinkRoot("/recursive"),
    }),
  },
  "/just/some": {
    "another-file": "hello",
    "another-file2": "hello",
    "symlink-to-earth": mock.symlink({
      path: resolveSymlinkRoot("/random/other"),
    }),
  },
  "/random/other": {
    "another-file": "hello",
    "another-file2": "hello",
  },
  "/recursive": {
    "random-file": "somecontent",
  },
  "/recursive/dir": {
    "some-file": "somecontent2",
    "recursive-1": mock.symlink({
      path: resolveSymlinkRoot("/recursive/dir"),
    }),
    "recursive-2": mock.symlink({
      path: resolveSymlinkRoot("/recursive/dir/recursive-1"),
    }),
    "recursive-3": mock.symlink({
      path: resolveSymlinkRoot("/recursive"),
    }),
    "recursive-5": mock.symlink({
      path: resolveSymlinkRoot("/double/recursive"),
    }),
    "not-recursive": mock.symlink({
      path: resolveSymlinkRoot("/just/some"),
    }),
  },
};

const fsWithRecursiveRelativeSymlinks = {
  "double/recursive": {
    "another-file": "hello",
    "recursive-4": mock.symlink({
      path: "../../recursive",
    }),
  },
  "just/some": {
    "another-file": "hello",
    "another-file2": "hello",
    "symlink-to-earth": mock.symlink({
      path: "../../random/other",
    }),
  },
  "random/other": {
    "another-file": "hello",
    "another-file2": "hello",
  },
  recursive: {
    "random-file": "somecontent",
  },
  "recursive/dir": {
    "some-file": "somecontent2",
    "recursive-1": mock.symlink({
      path: "../../recursive/dir",
    }),
    "recursive-2": mock.symlink({
      path: "./recursive-1",
    }),
    "recursive-3": mock.symlink({
      path: "../../recursive",
    }),
    "recursive-5": mock.symlink({
      path: "../../double/recursive",
    }),
    "not-recursive": mock.symlink({
      path: "../../just/some",
    }),
  },
};

const mockFs = {
  ...fsWithRelativeSymlinks,
  ...fsWithRecursiveSymlinks,
  ...fsWithRecursiveRelativeSymlinks,

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
      mock(mockFs);
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

    test(`resolve recursive symlinks`, async (t) => {
      const api = new fdir().withSymlinks().crawl("/recursive");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "/double/recursive/another-file",
          "/just/some/another-file",
          "/just/some/another-file2",
          "/random/other/another-file",
          "/random/other/another-file2",
          "/recursive/dir/some-file",
          "/recursive/random-file",
        ])
      );
    });

    test(`resolve recursive symlinks (real paths: false)`, async (t) => {
      const api = new fdir()
        .withSymlinks({ resolvePaths: false })
        .crawl("/recursive");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "/recursive/dir/not-recursive/another-file",
          "/recursive/dir/not-recursive/another-file2",
          "/recursive/dir/not-recursive/symlink-to-earth/another-file",
          "/recursive/dir/not-recursive/symlink-to-earth/another-file2",

          "/recursive/dir/recursive-1/not-recursive/another-file",
          "/recursive/dir/recursive-1/not-recursive/another-file2",
          "/recursive/dir/recursive-1/not-recursive/symlink-to-earth/another-file",
          "/recursive/dir/recursive-1/not-recursive/symlink-to-earth/another-file2",
          "/recursive/dir/recursive-1/recursive-5/another-file",
          "/recursive/dir/recursive-1/some-file",

          "/recursive/dir/recursive-2/not-recursive/another-file",
          "/recursive/dir/recursive-2/not-recursive/another-file2",
          "/recursive/dir/recursive-2/not-recursive/symlink-to-earth/another-file",
          "/recursive/dir/recursive-2/not-recursive/symlink-to-earth/another-file2",
          "/recursive/dir/recursive-2/recursive-5/another-file",
          "/recursive/dir/recursive-2/some-file",

          "/recursive/dir/recursive-3/dir/not-recursive/another-file",
          "/recursive/dir/recursive-3/dir/not-recursive/another-file2",
          "/recursive/dir/recursive-3/dir/not-recursive/symlink-to-earth/another-file",
          "/recursive/dir/recursive-3/dir/not-recursive/symlink-to-earth/another-file2",
          "/recursive/dir/recursive-3/dir/recursive-5/another-file",
          "/recursive/dir/recursive-3/dir/some-file",
          "/recursive/dir/recursive-3/random-file",

          "/recursive/dir/recursive-5/another-file",
          "/recursive/dir/recursive-5/recursive-4/dir/not-recursive/another-file",
          "/recursive/dir/recursive-5/recursive-4/dir/not-recursive/another-file2",
          "/recursive/dir/recursive-5/recursive-4/dir/not-recursive/symlink-to-earth/another-file",
          "/recursive/dir/recursive-5/recursive-4/dir/not-recursive/symlink-to-earth/another-file2",
          "/recursive/dir/recursive-5/recursive-4/dir/some-file",
          "/recursive/dir/recursive-5/recursive-4/random-file",

          "/recursive/dir/some-file",
          "/recursive/random-file",
        ])
      );
    });

    test(`resolve recursive symlinks (real paths: false, relative paths: true)`, async (t) => {
      const api = new fdir()
        .withSymlinks({ resolvePaths: false })
        .withRelativePaths()
        .withErrors()
        .crawl("./recursive");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "dir/not-recursive/another-file",
          "dir/not-recursive/another-file2",
          "dir/not-recursive/symlink-to-earth/another-file",
          "dir/not-recursive/symlink-to-earth/another-file2",

          "dir/recursive-1/not-recursive/another-file",
          "dir/recursive-1/not-recursive/another-file2",
          "dir/recursive-1/not-recursive/symlink-to-earth/another-file",
          "dir/recursive-1/not-recursive/symlink-to-earth/another-file2",
          "dir/recursive-1/recursive-5/another-file",
          "dir/recursive-1/some-file",

          "dir/recursive-2/not-recursive/another-file",
          "dir/recursive-2/not-recursive/another-file2",
          "dir/recursive-2/not-recursive/symlink-to-earth/another-file",
          "dir/recursive-2/not-recursive/symlink-to-earth/another-file2",
          "dir/recursive-2/recursive-5/another-file",
          "dir/recursive-2/some-file",

          "dir/recursive-3/dir/not-recursive/another-file",
          "dir/recursive-3/dir/not-recursive/another-file2",
          "dir/recursive-3/dir/not-recursive/symlink-to-earth/another-file",
          "dir/recursive-3/dir/not-recursive/symlink-to-earth/another-file2",
          "dir/recursive-3/dir/recursive-5/another-file",
          "dir/recursive-3/dir/some-file",
          "dir/recursive-3/random-file",

          "dir/recursive-5/another-file",
          "dir/recursive-5/recursive-4/dir/not-recursive/another-file",
          "dir/recursive-5/recursive-4/dir/not-recursive/another-file2",
          "dir/recursive-5/recursive-4/dir/not-recursive/symlink-to-earth/another-file",
          "dir/recursive-5/recursive-4/dir/not-recursive/symlink-to-earth/another-file2",
          "dir/recursive-5/recursive-4/dir/some-file",
          "dir/recursive-5/recursive-4/random-file",

          "dir/some-file",
          "random-file",
        ])
      );
    });

    test(`resolve recursive symlinks (real paths: true, relative paths: true)`, async (t) => {
      const api = new fdir()
        .withSymlinks()
        .withRelativePaths()
        .withErrors()
        .crawl("./recursive");
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "..//double/recursive/another-file",
          "../just/some/another-file",
          "../just/some/another-file2",
          "../random/other/another-file",
          "../random/other/another-file2",
          "dir/some-file",
          "random-file",
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

    test(`resolve symlinks (real paths: true, relative paths: true)`, async (t) => {
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

    test("resolve symlinks (exclude /some/dir/, real paths: false)", async (t) => {
      const api = new fdir()
        .withSymlinks({ resolvePaths: false })
        .exclude((_name, path) => path === resolveSymlinkRoot("/some/dir/dirSymlink/"))
        .crawl("/some/dir")
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(normalize(["/some/dir/fileSymlink"]));
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
