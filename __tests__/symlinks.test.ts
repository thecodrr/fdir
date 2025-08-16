import { afterAll, beforeAll, describe, test } from "vitest";
import { apiTypes, normalize, root } from "./utils";
import mock from "mock-fs";
import { fdir, Options } from "../src";
import path from "path";
import { MockFS } from "./mock-fs";

const fsWithRelativeSymlinks = {
  "sym-relative/linked": {
    "file-1": "file contents",
    "file-excluded-1": "file contents",
  },
  "other-relative/dir": {
    "file-2": "file contents2",
    "file-3": "file contents3",
  },
  "relative/dir": {
    fileSymlink: mock.symlink({
      path: "../../other-relative/dir/file-2",
    }),
    fileSymlink2: mock.symlink({
      path: "../../other-relative/dir/file-3",
    }),
    dirSymlink: mock.symlink({
      path: "../../sym-relative/linked",
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
  "ddouble/recursive": {
    "another-file": "hello",
    "recursive-4": mock.symlink({
      path: "../../drecursive",
    }),
  },
  "djust/some": {
    "another-file": "hello",
    "another-file2": "hello",
    "symlink-to-earth": mock.symlink({
      path: "../../drandom/other",
    }),
  },
  "drandom/other": {
    "another-file": "hello",
    "another-file2": "hello",
  },
  drecursive: {
    "random-file": "somecontent",
  },
  "drecursive/dir": {
    "some-file": "somecontent2",
    "recursive-1": mock.symlink({
      path: "../../drecursive/dir",
    }),
    "recursive-2": mock.symlink({
      path: "./recursive-1",
    }),
    "recursive-3": mock.symlink({
      path: "../../drecursive",
    }),
    "recursive-5": mock.symlink({
      path: "../../ddouble/recursive",
    }),
    "not-recursive": mock.symlink({
      path: "../../djust/some",
    }),
  },
};

const fsWithSymlinkInRootDir = {
  "/usr/lib": {
    "file-1": "file contents",
  },
  "/lib": mock.symlink({
    path: "/usr/lib",
  }),
};

const mockFs = {
  ...fsWithRelativeSymlinks,
  ...fsWithRecursiveSymlinks,
  ...fsWithRecursiveRelativeSymlinks,
  ...fsWithSymlinkInRootDir,

  "/sym/linked": {
    "file-1": "file contents",
    "file-excluded-1": "file contents",
  },
  "/other/dir": {
    "file-2": "file contents2",
    "file-3": "file contents3",
  },
  "/some/dir": {
    fileSymlink: mock.symlink({
      path: resolveSymlinkRoot("/other/dir/file-2"),
    }),
    fileSymlink2: mock.symlink({
      path: resolveSymlinkRoot("/other/dir/file-3"),
    }),
    dirSymlink: mock.symlink({
      path: resolveSymlinkRoot("/sym/linked"),
    }),
  },
};

const mockedFs = new MockFS(mockFs);
for (const type of apiTypes) {
  describe.concurrent(type, () => {
    beforeAll(async () => {
      await mockedFs.init();
    });

    afterAll(async () => {
      await mockedFs.cleanup();
    });

    test(`resolve symlinks`, async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks()
        .crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize([
          "/other/dir/file-2",
          "/other/dir/file-3",
          "/sym/linked/file-1",
          "/sym/linked/file-excluded-1",
        ])
      );
    });

    test(`resolve recursive symlinks`, async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks()
        .crawl(mockedFs.resolve("/recursive"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize([
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
        .withErrors()
        .withSymlinks({ resolvePaths: false })
        .crawl(mockedFs.resolve("/recursive"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize([
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
        .withErrors()
        .withSymlinks({ resolvePaths: false })
        .withRelativePaths()
        .withErrors()
        .crawl(mockedFs.resolve("./recursive"));
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
        .withErrors()
        .withSymlinks()
        .withRelativePaths()
        .withErrors()
        .crawl(mockedFs.resolve("./recursive"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "../double/recursive/another-file",
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
        .withErrors()
        .withSymlinks({ resolvePaths: false })
        .crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize([
          "/some/dir/dirSymlink/file-1",
          "/some/dir/dirSymlink/file-excluded-1",
          "/some/dir/fileSymlink",
          "/some/dir/fileSymlink2",
        ])
      );
    });

    test(`resolve symlinks (real paths: false, relative paths: true)`, async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks({ resolvePaths: false })
        .withRelativePaths()
        .crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "dirSymlink/file-1",
          "dirSymlink/file-excluded-1",
          "fileSymlink",
          "fileSymlink2",
        ])
      );
    });

    test(`resolve symlinks (real paths: true, relative paths: true)`, async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks()
        .withRelativePaths()
        .crawl(mockedFs.resolve("./relative/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize([
          "../../other-relative/dir/file-2",
          "../../other-relative/dir/file-3",
          "../../sym-relative/linked/file-1",
          "../../sym-relative/linked/file-excluded-1",
        ])
      );
    });

    test("resolve symlinks (exclude /sym/linked/)", async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks()
        .exclude((_name, path) => path === mockedFs.resolve("/sym/linked/"))
        .crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize(["/other/dir/file-2", "/other/dir/file-3"])
      );
    });

    test("resolve symlinks (exclude /some/dir/dirSymlink/, real paths: false)", async (t) => {
      const api = new fdir()
        .withErrors()
        .withSymlinks({ resolvePaths: false })
        .exclude((_name, path) => {
          return path === mockedFs.resolve("/some/dir/dirSymlink/");
        })
        .crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        mockedFs.normalize(["/some/dir/fileSymlink", "/some/dir/fileSymlink2"])
      );
    });

    test(`do not resolve symlinks`, async (t) => {
      const api = new fdir().withErrors().crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files.sort()).toStrictEqual(
        normalize(["dirSymlink", "fileSymlink", "fileSymlink2"])
      );
    });

    test(`exclude symlinks`, async (t) => {
      const api = new fdir({
        excludeSymlinks: true,
        suppressErrors: false,
      }).crawl(mockedFs.resolve("/some/dir"));
      const files = await api[type]();
      t.expect(files).toHaveLength(0);
    });

    test(
      "doesn't hang when resolving symlinks in the root directory",
      async (t) => {
        const api = new fdir()
          .withErrors()
          .withSymlinks({ resolvePaths: false })
          .crawl(mockedFs.resolve("/"));
        const files = await api[type]();
        const expectedFiles = mockedFs.normalize([
          "/lib/file-1",
          "/usr/lib/file-1",
        ]);
        for (const expectedFile of expectedFiles) {
          t.expect(files).toContain(expectedFile);
        }
      },
      { timeout: 1000 }
    );
  });
}

function resolveSymlinkRoot(p: string) {
  return process.platform === "win32"
    ? path.join(root(), path.normalize(p))
    : p;
}
