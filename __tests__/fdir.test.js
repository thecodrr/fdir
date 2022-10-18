const { fdir } = require("../index.js");
const fs = require("fs");
const mock = require("mock-fs");

beforeEach(() => {
  mock.restore();
});

test("crawl single depth directory with callback", (done) => {
  const api = new fdir().crawl("__tests__");
  api.withCallback((err, files) => {
    if (err) done(err);
    expect(files[0]).toBeTruthy();
    expect(files.every((t) => t)).toBeTruthy();
    expect(files[0].length).toBeGreaterThan(0);
    done();
  });
});

async function crawl(type, path) {
  const api = new fdir().crawl(path);
  const files = await api[type]();
  expect(files[0]).toBeTruthy();
  expect(files.every((t) => t)).toBeTruthy();
  expect(files[0].length).toBeGreaterThan(0);
  return files;
}

describe.each(["withPromise", "sync"])("fdir %s", (type) => {
  test("crawl single depth directory", async () => {
    await crawl(type, "__tests__");
  });

  test("crawl single depth directory with options", async () => {
    const api = new fdir().crawlWithOptions("__tests__", {
      includeBasePath: true,
    });
    const files = await api[type]();
    expect(files.every((file) => file.startsWith("__tests__"))).toBe(true);
  });

  test("crawl multi depth directory with options", async () => {
    const api = new fdir().crawlWithOptions("node_modules", {
      maxDepth: 1,
    });
    const files = await api[type]();
    expect(files.every((file) => file.split("/").length <= 3)).toBe(true);
  });

  test("crawl multi depth directory", async () => {
    await crawl(type, "node_modules");
  });

  test("crawl and get both files and directories (withDirs)", async () => {
    const api = new fdir().withDirs().crawl("node_modules");
    const files = await api[type]();
    expect(files[0]).toBeTruthy();
    expect(files.every((t) => t)).toBeTruthy();
    expect(files[0].length).toBeGreaterThan(0);
    expect(files[0].endsWith("node_modules/")).toBe(true);
  });

  test("crawl and get all files (withMaxDepth = 1)", async () => {
    const api = new fdir()
      .withMaxDepth(1)
      .withBasePath()
      .crawl("node_modules");
    const files = await api[type]();
    expect(files.every((file) => file.split("/").length <= 3)).toBe(true);
  });

  test("crawl and get files that match a glob pattern", async () => {
    const api = new fdir()
      .withBasePath()
      .glob("./**/*.js")
      .crawl("node_modules");
    const files = await api[type]();
    expect(files.every((file) => file.endsWith(".js"))).toBe(true);
  });

  test("crawl and get files that match a glob pattern that is a filename", async () => {
    const api = new fdir()
      .withBasePath()
      .glob("a.js")
      .crawl("__tests__/fixtures");
    const files = await api[type]();
    expect(files).toEqual(['__tests__/fixtures/a.js']);
  });

  test("crawl but exclude node_modules dir", async () => {
    const api = new fdir()
      .withBasePath()
      .exclude((dir) => dir.includes("node_modules"))
      .crawl("./");
    const files = await api[type]();
    expect(files.every((file) => !file.includes("node_modules"))).toBe(true);
  });

  test("crawl all files with filter", async () => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .crawl("./");
    const files = await api[type]();
    expect(files.every((file) => file.includes(".git"))).toBe(true);
  });

  test("crawl all files with multifilter", async () => {
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

  test("crawl all files in a directory (with base path)", async () => {
    const api = new fdir().withBasePath().crawl("./");
    const files = await api[type]();
    expect(files.every((file) => file.includes("./"))).toBe(true);
  });

  test("get all files in a directory and output full paths (withFullPaths)", async () => {
    const api = new fdir().withFullPaths().crawl("./");
    const files = await api[type]();
    expect(files.every((file) => file.startsWith("/"))).toBe(true);
  });

  test("getting files from restricted directory should throw", async () => {
    const api = new fdir().withErrors().crawl("/etc");
    try {
      await api[type]();
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });

  test("getting files from restricted directory shouldn't throw (suppressErrors)", async () => {
    const api = new fdir().crawl("/etc");
    const files = await api[type]();
    expect(files.length).toBeGreaterThan(0);
  });

  test("recurse root (files should not contain multiple /)", async () => {
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

  test("crawl all files and include symlinks", async () => {
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
    const api = new fdir().withSymlinks(false).crawl("/some/dir");
    const files = await api[type]();
    expect(files.length).toBe(2);
    expect(files.indexOf("/some/dir/fileSymlink/")).toBeGreaterThan(-1);
    expect(files.indexOf("/some/dir/dirSymlink/file-1")).toBeGreaterThan(-1);
    mock.restore();
  });

  test("crawl all files and include symlinks with real paths", async () => {
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
    const api = new fdir().withSymlinks(true).crawl("/some/dir");
    const files = await api[type]();
    expect(files.length).toBe(2);
    expect(files.indexOf("/sym/linked/file-1")).toBeGreaterThan(-1);
    expect(files.indexOf("/other/dir/file-2")).toBeGreaterThan(-1);
    mock.restore();
  });

  test("crawl all files with only counts", async () => {
    const api = new fdir().onlyCounts().crawl("node_modules");
    const result = await api[type]();
    expect(result.files).toBeGreaterThan(0);
  });

  test("crawl and return only directories", async () => {
    const api = new fdir().onlyDirs().crawl("node_modules");
    const result = await api[type]();
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    ).toBe(true);
  });

  test("crawl with options and return only directories", async () => {
    const api = new fdir().crawlWithOptions("node_modules", {
      excludeFiles: true,
    });
    const result = await api[type]();
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    ).toBe(true);
  });

  test("crawl and filter all files and get only counts", async () => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes("node_modules"))
      .onlyCounts()
      .crawl("./");
    const result = await api[type]();
    expect(result.files).toBeGreaterThan(0);
  });

  test("crawl all files in a directory (path with trailing slash)", () => {
    const api = new fdir().normalize().crawl("node_modules/");
    const files = api[type]();
    if (files instanceof Promise)
      return files.then((files) => {
        const res = files.every((file) => !file.includes("/"));
        expect(res).toBe(true);
      });
  });

  test("crawl all files and group them by directory", async () => {
    const api = new fdir()
      .withBasePath()
      .group()
      .crawl("node_modules");
    const result = await api[type]();
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  test("crawl and filter only directories", async () => {
    const api = new fdir()
      .onlyDirs()
      .filter((path) => path.includes("api"))
      .crawl("./src");
    const result = await api[type]();
    expect(result.length).toBe(1);
  });

  test("giving undefined directory path should throw", async () => {
    const api = new fdir().crawl();
    try {
      await api[type]();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test("crawl and return relative paths", async () => {
    const api = new fdir().withRelativePaths().crawl("node_modules");
    const paths = await api[type]();
    expect(paths.every((p) => !p.startsWith("node_modules"))).toBe(true);
  });
});
