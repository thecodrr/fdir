import { fdir } from "../src/index";
import fs from "fs";
import mock from "mock-fs";
import { test, beforeEach, TestContext, vi } from "vitest";
import path, { sep } from "path";
import { convertSlashes } from "../src/utils";
import picomatch from "picomatch";

beforeEach(() => {
  mock.restore();
});

const mockFsWithSymlinks = {
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

function root() {
  return process.platform === "win32" ? process.cwd().split(path.sep)[0] : "/";
}

function cwd() {
  return `.${path.sep}`;
}

function restricted() {
  return process.platform === "win32"
    ? path.join(root(), "Windows", "System32")
    : "/etc";
}

function resolveSymlinkRoot(p: string) {
  return process.platform === "win32"
    ? path.join(root(), path.normalize(p))
    : p;
}

test(`crawl single depth directory with callback`, (t) => {
  const api = new fdir().crawl("__tests__");

  return new Promise<void>((resolve, reject) => {
    api.withCallback((err, files) => {
      if (err) return reject(err);
      t.expect(files[0]).toBeDefined();
      t.expect(files.every((t) => t)).toBeTruthy();
      t.expect(files[0].length).toBeGreaterThan(0);
      resolve();
    });
  });
});

type APITypes = "withPromise" | "sync";
const apiTypes = ["withPromise", "sync"] as const;

async function crawl(type: APITypes, path: string, t: TestContext) {
  const api = new fdir().crawl(path);
  const files = await api[type]();
  if (!files) throw new Error("files cannot be null.");
  t.expect(files[0]).toBeDefined();
  t.expect(files.every((t) => t)).toBeTruthy();
  t.expect(files[0].length).toBeGreaterThan(0);
  return files;
}

for (const type of apiTypes) {
  test(`[${type}] crawl directory`, async (t) => {
    await crawl(type, "__tests__", t);
  });

  test(`[${type}] crawl directory with options`, async (t) => {
    const api = new fdir({ includeBasePath: true }).crawl("__tests__");
    const files = await api[type]();
    t.expect(files.every((file) => file.startsWith("__tests__"))).toBeTruthy();
  });

  test("crawl single depth directory with options", async (t) => {
    const api = new fdir({
      maxDepth: 0,
      includeBasePath: true,
    }).crawl("node_modules");
    const files = await api[type]();
    t.expect(files.every((file) => file.split("/").length <= 2)).toBe(true);
  });
  -test(`[${type}] crawl multi depth directory with options`, async (t) => {
    const api = new fdir({
      maxDepth: 1,
    }).crawl("node_modules");
    const files = await api[type]();
    t.expect(
      files.every((file) => file.split(path.sep).length <= 3)
    ).toBeTruthy();
  });

  test(`[${type}] crawl multi depth directory`, async (t) => {
    await crawl(type, "node_modules", t);
  });

  test(`[${type}] crawl directory & limit files to 10`, async (t) => {
    const api = new fdir().withMaxFiles(10).crawl("node_modules");
    const files = await api[type]();
    t.expect(files).toHaveLength(10);
  });

  test(`[${type}] crawl and get both files and directories (withDirs)`, async (t) => {
    const api = new fdir().withDirs().crawl("node_modules");
    const files = await api[type]();
    t.expect(files[0]).toBeDefined();
    t.expect(files.every((t) => t)).toBeTruthy();
    t.expect(files[0].length).toBeGreaterThan(0);
    t.expect(files[0].endsWith(path.normalize("node_modules/"))).toBeTruthy();
  });

  test(`[${type}] crawl and get all files (withMaxDepth = 1)`, async (t) => {
    const api = new fdir().withMaxDepth(1).withBasePath().crawl("node_modules");
    const files = await api[type]();
    t.expect(
      files.every((file) => file.split(path.sep).length <= 3)
    ).toBeTruthy();
  });

  test(`[${type}] crawl and get files that match a glob pattern`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .glob("**/*.js")
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await api[type]();
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] crawl but exclude node_modules dir`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .exclude((dir) => dir.includes("node_modules"))
      .crawl(cwd());
    const files = await api[type]();
    t.expect(
      files.every((file) => !file.includes("node_modules"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files with filter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .crawl(cwd());
    const files = await api[type]();
    t.expect(files.every((file) => file.includes(".git"))).toBeTruthy();
  });

  test(`[${type}] crawl all files with multifilter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .filter((file) => file.includes(".js"))
      .crawl(cwd());
    const files = await api[type]();
    t.expect(
      files.every((file) => file.includes(".git") || file.includes(".js"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files in a directory (with base path)`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .crawl(path.join(cwd(), "node_modules"));
    const files = await api[type]();
    t.expect(
      files.every((file) => file.startsWith("node_modules"))
    ).toBeTruthy();
  });

  test(`[${type}] get all files in a directory and output full paths (withFullPaths)`, async (t) => {
    const api = new fdir().withFullPaths().crawl(cwd());
    const files = await api[type]();
    t.expect(files.every((file) => file.startsWith(root()))).toBeTruthy();
  });

  test(`[${type}] getting files from restricted directory should throw`, async (t) => {
    const api = new fdir().withErrors().crawl(restricted());
    t.expect(async () => await api[type]()).rejects.toThrowError();
  });

  test(`[${type}] getting files from restricted directory shouldn't throw (suppressErrors)`, async (t) => {
    const api = new fdir().crawl(restricted());
    const files = await api[type]();
    t.expect(files.length).toBeGreaterThanOrEqual(0);
  });

  test(`[${type}] recurse root (files should not contain multiple /)`, async (t) => {
    mock({
      "/etc": {
        hosts: "dooone",
      },
    });
    const api = new fdir().withBasePath().normalize().crawl("/");
    const files = await api[type]();
    t.expect(files.every((file) => !file.includes("//"))).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files with only counts`, async (t) => {
    const api = new fdir().onlyCounts().crawl("node_modules");
    const result = await api[type]();
    t.expect(result.files).toBeGreaterThan(0);
  });

  test(`[${type}] crawl and return only directories`, async (t) => {
    const api = new fdir().onlyDirs().crawl("node_modules");
    const result = await api[type]();
    t.expect(result.length).toBeGreaterThan(0);
    t.expect(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    ).toBeTruthy();
  });

  test(`[${type}] crawl with options and return only directories`, async (t) => {
    const api = new fdir({
      excludeFiles: true,
      includeDirs: true,
    }).crawl("node_modules");
    const result = await api[type]();
    t.expect(result.length).toBeGreaterThan(0);
    t.expect(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    ).toBeTruthy();
  });

  test(`[${type}] crawl and filter all files and get only counts`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes("node_modules"))
      .onlyCounts()
      .crawl(cwd());
    const result = await api[type]();
    t.expect(result.files).toBeGreaterThan(0);
  });

  test("crawl all files in a directory (path with trailing slash)", async (t) => {
    const api = new fdir().normalize().crawl("node_modules/");
    const files = await api[type]();
    const res = files.every((file) => !file.includes("/"));
    t.expect(res).toBeDefined();
  });

  test(`[${type}] crawl all files and group them by directory`, async (t) => {
    const api = new fdir().withBasePath().group().crawl("node_modules");
    const result = await api[type]();
    t.expect(result.length).toBeGreaterThan(0);
  });

  test(`[${type}] crawl and filter only directories`, async (t) => {
    const api = new fdir()
      .onlyDirs()
      .filter((path) => path.includes("api"))
      .crawl("./src");
    const result = await api[type]();
    t.expect(result).toHaveLength(2);
  });

  test(`[${type}] crawl and return relative paths`, async (t) => {
    const api = new fdir()
      .withRelativePaths()
      .crawl(path.normalize(`node_modules/`));
    const paths = await api[type]();
    t.expect(paths.every((p) => !p.startsWith("node_modules"))).toBeTruthy();
  });

  test(`[${type}] crawl and return relative paths with only dirs`, async (t) => {
    mock({
      "/some/dir/dir1": {
        file: "some file",
      },
      "/some/dir/dir2": {
        file: "some file",
      },
      "/some/dir/dir2/dir3": {
        file: "some file",
      },
    });

    const api = new fdir({ excludeFiles: true, excludeSymlinks: true })
      .withDirs()
      .withRelativePaths()
      .crawl("/some");
    const paths = await api[type]();

    t.expect(paths.length).toBe(5);
    t.expect(paths.filter((p) => p === ".").length).toBe(1);
    t.expect(paths.filter((p) => p === "").length).toBe(0);
    mock.restore();
  });

  test(`[${type}] crawl and return relative paths with filters and only dirs`, async (t) => {
    mock({
      "/some/dir/dir1": {
        file: "some file",
      },
      "/some/dir/dir2": {
        file: "some file",
      },
      "/some/dir/dir2/dir3": {
        file: "some file",
      },
    });

    const api = new fdir({ excludeFiles: true, excludeSymlinks: true })
      .withDirs()
      .withRelativePaths()
      .filter((p) => p !== path.join("dir", "dir1/"))
      .crawl("/some");
    const paths = await api[type]();

    t.expect(paths.length).toBe(4);
    t.expect(paths.includes(path.join("dir", "dir1/"))).toBe(false);
    t.expect(paths.filter((p) => p === ".").length).toBe(1);
    t.expect(paths.filter((p) => p === "").length).toBe(0);
    mock.restore();
  });

  test(`[${type}] crawl and return relative paths that end with /`, async (t) => {
    const api = new fdir().withRelativePaths().crawl("./node_modules/");
    const paths = await api[type]();
    t.expect(
      paths.every((p) => !p.startsWith("node_modules") && !p.includes("//"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files and include resolved symlinks`, async (t) => {
    mock(mockFsWithSymlinks);

    const api = new fdir().withSymlinks().crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(3);
    t.expect(
      files.indexOf(resolveSymlinkRoot("/sym/linked/file-1")) > -1
    ).toBeTruthy();
    t.expect(
      files.indexOf(resolveSymlinkRoot("/other/dir/file-2")) > -1
    ).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files and include resolved symlinks without real paths`, async (t) => {
    mock(mockFsWithSymlinks);

    const api = new fdir()
      .withSymlinks({ resolvePaths: false })
      .crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(3);
    t.expect(
      files.indexOf(resolveSymlinkRoot("/some/dir/dirSymlink/file-1")) > -1
    ).toBeTruthy();
    t.expect(
      files.indexOf(
        resolveSymlinkRoot("/some/dir/dirSymlink/file-excluded-1")
      ) > -1
    ).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files and include resolved symlinks without real paths with relative paths on`, async (t) => {
    mock(mockFsWithSymlinks);

    const api = new fdir()
      .withSymlinks({ resolvePaths: false })
      .withRelativePaths()
      .crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(3);
    t.expect(
      files.indexOf(path.join("dirSymlink", "file-1")) > -1
    ).toBeTruthy();
    t.expect(
      files.indexOf(path.join("dirSymlink", "file-excluded-1")) > -1
    ).toBeTruthy();
    t.expect(files.indexOf("fileSymlink") > -1).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files and include resolved symlinks with real paths with relative paths on`, async (t) => {
    mock({
      "../../sym/linked": {
        "file-1": "file contents",
        "file-excluded-1": "file contents",
      },
      "../../other/dir": {
        "file-2": "file contents2",
      },
      "some/dir": {
        fileSymlink: mock.symlink({
          path: "../../../../other/dir/file-2",
        }),
        fileSymlink2: mock.symlink({
          path: "../../../../other/dir/file-3",
        }),
        dirSymlink: mock.symlink({
          path: "../../../../sym/linked",
        }),
      },
    });
    const api = new fdir()
      .withSymlinks()
      .withRelativePaths()
      .crawl("./some/dir");
    const files = await api[type]();
    t.expect(files.sort()).toStrictEqual([
      path.join("..", "..", "..", "..", "other", "dir", "file-2"),
      path.join("..", "..", "..", "..", "sym", "linked", "file-1"),
      path.join("..", "..", "..", "..", "sym", "linked", "file-excluded-1"),
    ]);
    mock.restore();
  });

  test("crawl all files and include resolved symlinks with exclusions", async (t) => {
    mock(mockFsWithSymlinks);
    const api = new fdir()
      .withSymlinks()
      .exclude((_name, path) => path === resolveSymlinkRoot("/sym/linked/"))
      .crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(1);
    t.expect(
      files.indexOf(resolveSymlinkRoot("/other/dir/file-2")) > -1
    ).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files and include unresolved symlinks`, async (t) => {
    mock(mockFsWithSymlinks);

    const api = new fdir().withDirs().crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(4);

    t.expect(files.indexOf(path.normalize("/some/dir/")) > -1).toBeTruthy();
    t.expect(files.indexOf("fileSymlink") > -1).toBeTruthy();
    t.expect(files.indexOf("fileSymlink2") > -1).toBeTruthy();
    t.expect(files.indexOf("dirSymlink") > -1).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files and exclude symlinks`, async (t) => {
    mock(mockFsWithSymlinks);

    const api = new fdir({ excludeSymlinks: true }).crawl("/some/dir");
    const files = await api[type]();
    t.expect(files).toHaveLength(0);
    mock.restore();
  });

  test(`[${type}] crawl all files and invert path separator`, async (t) => {
    const api = new fdir()
      .withPathSeparator(sep === "/" ? "\\" : "/")
      .crawl("node_modules");
    const files = await api[type]();

    t.expect(files.every((f) => !f.includes(sep))).toBeTruthy();
  });

  test(`[${type}] crawl all files (including symlinks)`, async (t) => {
    mock({
      "/other/dir": {
        "file-3": "somefile",
      },
      "/some/dir": {
        fileSymlink: mock.symlink({
          path: "/other/dir/file-3",
        }),
      },
    });

    const api = new fdir().withErrors().withSymlinks().crawl("/some/dir");
    const files = await api[type]();
    t.expect(
      files.indexOf(resolveSymlinkRoot("/other/dir/file-3")) > -1
    ).toBeTruthy();
    mock.restore();
  });

  test(`[${type}] crawl all files (including symlinks without real paths)`, async (t) => {
    mock({
      "/other/dir": {
        "file-3": "somefile",
      },
      "/some/dir": {
        fileSymlink: mock.symlink({
          path: "/other/dir/file-3",
        }),
      },
    });

    const api = new fdir()
      .withErrors()
      .withSymlinks({ resolvePaths: false })
      .crawl("/some/dir");

    await api[type]();

    const files = await api[type]();
    t.expect(
      files.indexOf(resolveSymlinkRoot("/some/dir/fileSymlink")) > -1
    ).toBeTruthy();

    mock.restore();
  });

  test(`[${type}] crawl files that match using a custom glob`, async (t) => {
    const globFunction = vi.fn((glob: string | string[]) => {
      return (test: string): boolean => test.endsWith(".js");
    });
    const api = new fdir({ globFunction })
      .withBasePath()
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await api[type]();
    t.expect(globFunction).toHaveBeenCalled();
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] crawl files that match using a custom glob with options`, async (t) => {
    const globFunction = vi.fn(
      (glob: string | string[], options?: { foo: number }) => {
        return (test: string): boolean => test.endsWith(".js");
      }
    );
    const api = new fdir({ globFunction })
      .withBasePath()
      .globWithOptions(["**/*.js"], { foo: 5 })
      .crawl("node_modules");
    const files = await api[type]();
    t.expect(globFunction).toHaveBeenCalled();
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] crawl files that match using a picomatch`, async (t) => {
    const globFunction = picomatch;
    const api = new fdir({ globFunction })
      .withBasePath()
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await api[type]();
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] using withGlobFunction to set glob`, async (t) => {
    const globFunction = vi.fn((glob: string | string[], input: string) => {
      return (test: string): boolean => test === input;
    });
    new fdir()
      .withBasePath()
      .withGlobFunction(globFunction)
      .globWithOptions(["**/*.js"], "bleep")
      .crawl("node_modules");
    t.expect(globFunction).toHaveBeenCalledWith(["**/*.js"], "bleep");
  });
}

test(`[async] crawl directory & use abort signal to abort`, async (t) => {
  // AbortController is not present on Node v14
  if (!("AbortController" in globalThis)) return;

  const totalFiles = new fdir().onlyCounts().crawl("node_modules").sync();
  const abortController = new AbortController();
  const api = new fdir()
    .withAbortSignal(abortController.signal)
    .filter((p) => {
      if (p.endsWith(".js")) abortController.abort();
      return true;
    })
    .crawl("node_modules");
  const files = await api.withPromise();
  t.expect(files.length).toBeLessThan(totalFiles.files);
});

test(`paths should never start with ./`, async (t) => {
  const apis = [
    new fdir().withBasePath().crawl("./node_modules"),
    new fdir().withBasePath().crawl("./"),
    new fdir().withRelativePaths().crawl("./"),
    new fdir().withRelativePaths().crawl("."),
    new fdir().withDirs().crawl("."),
    new fdir().onlyDirs().crawl("."),
  ];
  for (const api of apis) {
    const files = await api.withPromise();
    t.expect(
      files.every((file) => !file.startsWith("./") && !file.startsWith(".\\"))
    ).toBe(true);
  }
});

test(`default to . if root is not provided`, async (t) => {
  const files = await new fdir().crawl().withPromise();

  const files2 = await new fdir()
    .crawl(".")
    .withPromise()
    .then((f) => f.sort());

  t.expect(files.sort().every((r, i) => r === files2[i])).toBe(true);
});

test(`ignore withRelativePath if root === ./`, async (t) => {
  const relativeFiles = await new fdir()
    .withRelativePaths()
    .crawl("./")
    .withPromise();
  const files = await new fdir().crawl("./").withPromise();
  t.expect(relativeFiles.every((r) => files.includes(r))).toBe(true);
});

test(`add path separator if root path does not end with one`, async (t) => {
  const relativeFiles = await new fdir()
    .withRelativePaths()
    .crawl("node_modules")
    .withPromise();
  t.expect(relativeFiles.every((r) => !r.startsWith(sep))).toBe(true);
});

test(`there should be no empty directory when using withDirs`, async (t) => {
  const files = await new fdir().withDirs().crawl("./").withPromise();
  t.expect(files.every((r) => r.length > 0)).toBe(true);
});

test(`there should be no empty directory when using withDirs and filters`, async (t) => {
  const files = await new fdir()
    .withDirs()
    .filter((p) => p !== "node_modules")
    .crawl("./")
    .withPromise();
  t.expect(files.every((r) => r.length > 0)).toBe(true);
});

test(`do not convert \\\\ to \\`, async (t) => {
  t.expect(convertSlashes("\\\\wsl.localhost\\Ubuntu\\home\\", "\\")).toBe(
    "\\\\wsl.localhost\\Ubuntu\\home\\"
  );
});
