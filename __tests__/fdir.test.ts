import { fdir } from "../index";
import fs from "fs";
import mock from "mock-fs";
import tap from "tap";
import { expect } from "expect";

tap.beforeEach(() => {
  mock.restore();
});

tap.test("crawl single depth directory with callback", (t) => {
  const api = new fdir().crawl("__tests__");
  api.withCallback((err, files) => {
    if (err) return t.end();
    expect(files[0]).toBeTruthy();
    expect(files.every((t) => t)).toBeTruthy();
    expect(files[0].length).toBeGreaterThan(0);
    t.end();
  });
});

type APITypes = "withPromise" | "sync";
const apiTypes = ["withPromise", "sync"] as const;

async function crawl(type: APITypes, path: string) {
  const api = new fdir().crawl(path);
  const files = await api[type]();
  if (!files) throw new Error("files cannot be null.");
  expect(files[0]).toBeTruthy();
  expect(files.every((t) => t)).toBeTruthy();
  expect(files[0].length).toBeGreaterThan(0);
  return files;
}

for (const type of apiTypes) {
  tap.test(`fdir ${type}`, async (t) => {
    t.test("crawl single depth directory", async () => {
      await crawl(type, "__tests__");
    });

    t.test("crawl single depth directory with options", async () => {
      const api = new fdir({ includeBasePath: true }).crawl("__tests__");
      const files = await api[type]();
      expect(files.every((file) => file.startsWith("__tests__"))).toBe(true);
    });

    t.test("crawl multi depth directory with options", async () => {
      const api = new fdir({
        maxDepth: 1,
      }).crawl("node_modules");
      const files = await api[type]();
      expect(files.every((file) => file.split("/").length <= 3)).toBe(true);
    });

    t.test("crawl multi depth directory", async () => {
      await crawl(type, "node_modules");
    });

    t.test("crawl and get both files and directories (withDirs)", async () => {
      const api = new fdir().withDirs().crawl("node_modules");
      const files = await api[type]();
      expect(files[0]).toBeTruthy();
      expect(files.every((t) => t)).toBeTruthy();
      expect(files[0].length).toBeGreaterThan(0);
      expect(files[0].endsWith("node_modules/")).toBe(true);
    });

    t.test("crawl and get all files (withMaxDepth = 1)", async () => {
      const api = new fdir()
        .withMaxDepth(1)
        .withBasePath()
        .crawl("node_modules");
      const files = await api[type]();
      expect(files.every((file) => file.split("/").length <= 3)).toBe(true);
    });

    t.test("crawl and get files that match a glob pattern", async () => {
      const api = new fdir()
        .withBasePath()
        .glob("./**/*.js")
        .glob("./**/*.js")
        .crawl("node_modules");
      const files = await api[type]();
      expect(files.every((file) => file.endsWith(".js"))).toBe(true);
    });

    t.test("crawl but exclude node_modules dir", async () => {
      const api = new fdir()
        .withBasePath()
        .exclude((dir) => dir.includes("node_modules"))
        .crawl("./");
      const files = await api[type]();
      expect(files.every((file) => !file.includes("node_modules"))).toBe(true);
    });

    t.test("crawl all files with filter", async () => {
      const api = new fdir()
        .withBasePath()
        .filter((file) => file.includes(".git"))
        .crawl("./");
      const files = await api[type]();
      expect(files.every((file) => file.includes(".git"))).toBe(true);
    });

    t.test("crawl all files with multifilter", async () => {
      const api = new fdir()
        .withBasePath()
        .filter((file) => file.includes(".git"))
        .filter((file) => file.includes(".js"))
        .crawl("./");
      const files = await api[type]();
      expect(
        files.every((file) => file.includes(".git") || file.includes(".js"))
      ).toBe(true);
    });

    t.test("crawl all files in a directory (with base path)", async () => {
      const api = new fdir().withBasePath().crawl("./");
      const files = await api[type]();
      expect(files.every((file) => file.includes("./"))).toBe(true);
    });

    t.test(
      "get all files in a directory and output full paths (withFullPaths)",
      async () => {
        const api = new fdir().withFullPaths().crawl("./");
        const files = await api[type]();
        expect(files.every((file) => file.startsWith("/"))).toBe(true);
      }
    );

    t.test("getting files from restricted directory should throw", async () => {
      try {
        const api = new fdir().withErrors().crawl("/etc");
        await api[type]();
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });

    t.test(
      "getting files from restricted directory shouldn't throw (suppressErrors)",
      async () => {
        const api = new fdir().crawl("/etc");
        const files = await api[type]();
        expect(files.length).toBeGreaterThan(0);
      }
    );

    t.test("recurse root (files should not contain multiple /)", async () => {
      mock({
        "/etc": {
          hosts: "dooone",
        },
      });
      const api = new fdir()
        .withBasePath()
        .normalize()
        .crawl("/");
      const files = await api[type]();
      expect(files.every((file) => !file.includes("//"))).toBe(true);
      mock.restore();
    });

    t.test("crawl all files and include resolved symlinks", async () => {
      mock({
        "/sym/linked": {
          "file-1": "file contents",
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
      });
      const api = new fdir().withSymlinks().crawl("/some/dir");
      const files = await api[type]();
      expect(files.length).toBe(2);
      expect(files.indexOf("/sym/linked/file-1")).toBeGreaterThan(-1);
      expect(files.indexOf("/other/dir/file-2")).toBeGreaterThan(-1);
      mock.restore();
    });

    t.test(
      "crawl all files and include resolved symlinks with exclusions",
      async () => {
        mock({
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
            dirSymlink: mock.symlink({
              path: "/sym/linked",
            }),
          },
        });
        const api = new fdir()
          .withSymlinks()
          .exclude((_name, path) => path === "/sym/linked/")
          .crawl("/some/dir");
        const files = await api[type]();
        expect(files.length).toBe(1);
        expect(files.indexOf("/other/dir/file-2")).toBeGreaterThan(-1);
        mock.restore();
      }
    );

    t.test("crawl all files and include unresolved symlinks", async () => {
      mock({
        "/sym/linked": {
          "file-1": "file contents",
        },
        "/other/dir": {
          "file-2": "file contents2",
        },
        "/some/dir": {
          fileSymlink: mock.symlink({
            path: "/other/dir/file-2",
          }),
          dirSymlink: mock.symlink({
            path: "/sym/linked",
          }),
        },
      });
      const api = new fdir().withDirs().crawl("/some/dir");
      const files = await api[type]();
      expect(files.length).toBe(3);
      expect(files.indexOf("/some/dir/")).toBeGreaterThan(-1);
      expect(files.indexOf("fileSymlink")).toBeGreaterThan(-1);
      expect(files.indexOf("dirSymlink")).toBeGreaterThan(-1);
      mock.restore();
    });

    t.test(
      "crawl all files (including symlinks) and throw errors",
      async () => {
        mock({
          "/sym/linked": {
            "file-1": "file contents",
          },
          "/other/dir": {},
          "/some/dir": {
            fileSymlink: mock.symlink({
              path: "/other/dir/file-3",
            }),
            dirSymlink: mock.symlink({
              path: "/sym/linked",
            }),
          },
        });
        try {
          const api = new fdir()
            .withErrors()
            .withSymlinks()
            .crawl("/some/dir");

          await api[type]();
        } catch (e) {
          if (e instanceof Error)
            expect(
              e.message.includes("no such file or directory")
            ).toBeTruthy();
        }
        mock.restore();
      }
    );

    t.test("crawl all files with only counts", async () => {
      const api = new fdir().onlyCounts().crawl("node_modules");
      const result = await api[type]();
      expect(result.files).toBeGreaterThan(0);
    });

    t.test("crawl and return only directories", async () => {
      const api = new fdir().onlyDirs().crawl("node_modules");
      const result = await api[type]();
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.every((dir) => {
          return fs.statSync(dir).isDirectory;
        })
      ).toBe(true);
    });

    t.test("crawl with options and return only directories", async () => {
      const api = new fdir({
        excludeFiles: true,
        includeDirs: true,
      }).crawl("node_modules");
      const result = await api[type]();
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.every((dir) => {
          return fs.statSync(dir).isDirectory;
        })
      ).toBe(true);
    });

    t.test("crawl and filter all files and get only counts", async () => {
      const api = new fdir()
        .withBasePath()
        .filter((file) => file.includes("node_modules"))
        .onlyCounts()
        .crawl("./");
      const result = await api[type]();
      expect(result.files).toBeGreaterThan(0);
    });

    t.test(
      "crawl all files in a directory (path with trailing slash)",
      async () => {
        const api = new fdir().normalize().crawl("node_modules/");
        const files = await api[type]();
        const res = files.every((file) => !file.includes("/"));
        expect(res).toBe(true);
      }
    );

    t.test("crawl all files and group them by directory", async () => {
      const api = new fdir()
        .withBasePath()
        .group()
        .crawl("node_modules");
      const result = await api[type]();
      expect(result.length).toBeGreaterThan(0);
    });

    t.test("crawl and filter only directories", async () => {
      const api = new fdir()
        .onlyDirs()
        .filter((path) => path.includes("api"))
        .crawl("./src");
      const result = await api[type]();
      expect(result.length).toBe(2);
    });

    t.test("giving undefined directory path should throw", async () => {
      // @ts-ignore
      const api = new fdir().crawl();
      try {
        await api[type]();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    t.test("crawl and return relative paths", async () => {
      const api = new fdir().withRelativePaths().crawl("node_modules");
      const paths = await api[type]();
      expect(paths.every((p) => !p.startsWith("node_modules"))).toBe(true);
    });

    t.test("crawl and return relative paths that end with /", async () => {
      const api = new fdir().withRelativePaths().crawl("./node_modules/");
      const paths = await api[type]();
      expect(
        paths.every((p) => !p.startsWith("node_modules") && !p.includes("//"))
      ).toBe(true);
    });
  });
}
