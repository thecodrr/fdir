import { fdir } from "../src/index";
import fs from "fs";
import mock from "mock-fs";
import { test, beforeEach, vi } from "vitest";
import path, { sep } from "path";
import { convertSlashes } from "../src/utils";
import picomatch from "picomatch";
import { apiTypes, APITypes, cwd, restricted, root, execute } from "./utils";

// AbortController is not present on Node v14
const hasAbortController = "AbortController" in globalThis;

beforeEach(() => {
  mock.restore();
});

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

async function crawl(type: APITypes, path: string) {
  const api = new fdir().crawl(path);
  return execute(api, type);
}

for (const type of apiTypes) {
  test(`[${type}] crawl directory`, async (t) => {
    const files = await crawl(type, "__tests__");
    t.expect(files[0]).toBeDefined();
    t.expect(files.every((t) => t)).toBeTruthy();
    t.expect(files[0].length).toBeGreaterThan(0);
  });

  test(`[${type}] crawl directory with options`, async (t) => {
    const api = new fdir({ includeBasePath: true }).crawl("__tests__");
    const files = await execute(api, type);
    t.expect(files.every((file) => file.startsWith("__tests__"))).toBeTruthy();
  });

  test("crawl single depth directory with options", async (t) => {
    const api = new fdir({
      maxDepth: 0,
      includeBasePath: true,
    }).crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files).not.toHaveLength(0);
    t.expect(files.every((file) => file.split(path.sep).length === 2)).toBe(
      true
    );
  });

  test(`[${type}] crawl multi depth directory with options`, async (t) => {
    const api = new fdir({
      maxDepth: 1,
      includeBasePath: true,
    }).crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files.some((file) => file.split(path.sep).length === 3)).toBe(
      true
    );
    t.expect(files.every((file) => file.split(path.sep).length <= 3)).toBe(
      true
    );
  });

  test(`[${type}] crawl multi depth directory`, async (t) => {
    const files = await crawl(type, "node_modules");
    t.expect(files[0]).toBeDefined();
    t.expect(files.every((t) => t)).toBeTruthy();
    t.expect(files[0].length).toBeGreaterThan(0);
  });

  test(`[${type}] crawl directory & limit files to 10`, async (t) => {
    const api = new fdir().withMaxFiles(10).crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files).toHaveLength(10);
  });

  test(`[${type}] crawl and get both files and directories (withDirs)`, async (t) => {
    const api = new fdir().withDirs().crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files[0]).toBeDefined();
    t.expect(files.every((t) => t)).toBeTruthy();
    t.expect(files[0].length).toBeGreaterThan(0);
    t.expect(files[0].endsWith(path.normalize("node_modules/"))).toBeTruthy();
  });

  test(`[${type}] crawl and get all files (withMaxDepth = 1)`, async (t) => {
    const api = new fdir().withMaxDepth(1).withBasePath().crawl("node_modules");
    const files = await execute(api, type);
    t.expect(
      files.every((file) => file.split(path.sep).length <= 3)
    ).toBeTruthy();
  });

  test(`[${type}] crawl and get all files (withMaxDepth = -1)`, async (t) => {
    const api = new fdir()
      .withMaxDepth(-1)
      .withBasePath()
      .crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files.length).toBe(0);
  });

  test(`[${type}] crawl and get files that match a glob pattern`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .glob("**/*.js")
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await execute(api, type);
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] crawl but exclude node_modules dir`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .exclude((dir) => dir.includes("node_modules"))
      .crawl(cwd());
    const files = await execute(api, type);
    t.expect(
      files.every((file) => !file.includes("node_modules"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files with filter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .crawl(cwd());
    const files = await execute(api, type);
    t.expect(files.every((file) => file.includes(".git"))).toBeTruthy();
  });

  test(`[${type}] crawl all files with multifilter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .filter((file) => file.includes(".js"))
      .crawl(cwd());
    const files = await execute(api, type);
    t.expect(
      files.every((file) => file.includes(".git") || file.includes(".js"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files in a directory (with base path)`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .crawl(path.join(cwd(), "node_modules"));
    const files = await execute(api, type);
    t.expect(
      files.every((file) => file.startsWith("node_modules"))
    ).toBeTruthy();
  });

  test(`[${type}] get all files in a directory and output full paths (withFullPaths)`, async (t) => {
    const api = new fdir().withFullPaths().crawl(cwd());
    const files = await execute(api, type);
    t.expect(files.every((file) => file.startsWith(root()))).toBeTruthy();
  });

  test(`[${type}] getting files from restricted directory should throw`, async (t) => {
    const api = new fdir().withErrors().crawl(restricted());
    t.expect(async () => await execute(api, type)).rejects.toThrowError();
  });

  test(`[${type}] getting files from restricted directory shouldn't throw (suppressErrors)`, async (t) => {
    const api = new fdir().crawl(restricted());
    const files = await execute(api, type);
    t.expect(files.length).toBeGreaterThanOrEqual(0);
  });

  test(`[${type}] recurse root (files should not contain multiple /)`, async (t) => {
    mock({
      "/etc": {
        hosts: "dooone",
      },
    });
    const api = new fdir().withBasePath().normalize().crawl("/");
    const files = await execute(api, type);
    t.expect(files.every((file) => !file.includes("//"))).toBeTruthy();
    mock.restore();
  });

  if (type !== "withIterator") {
    test(`[${type}] crawl all files with only counts`, async (t) => {
      const api = new fdir().onlyCounts().crawl("node_modules");
      const result = await api[type]();
      t.expect(result.files).toBeGreaterThan(0);
    });
  }

  test(`[${type}] crawl and return only directories`, async (t) => {
    const api = new fdir().onlyDirs().crawl("node_modules");
    const result = await execute(api, type);
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
    const result = await execute(api, type);
    t.expect(result.length).toBeGreaterThan(0);
    t.expect(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    ).toBeTruthy();
  });

  if (type !== "withIterator") {
    test(`[${type}] crawl and filter all files and get only counts`, async (t) => {
      const api = new fdir()
        .withBasePath()
        .filter((file) => file.includes("node_modules"))
        .onlyCounts()
        .crawl(cwd());
      const result = await api[type]();
      t.expect(result.files).toBeGreaterThan(0);
    });
  }

  test("crawl all files in a directory (path with trailing slash)", async (t) => {
    const api = new fdir().normalize().crawl("node_modules/");
    const files = await execute(api, type);
    const res = files.every((file) => !file.includes("/"));
    t.expect(res).toBeDefined();
  });

  test(`[${type}] crawl all files and group them by directory`, async (t) => {
    const api = new fdir().withBasePath().group().crawl("node_modules");
    const result = await execute(api, type);
    t.expect(result.length).toBeGreaterThan(0);
  });

  test(`[${type}] crawl and filter only directories`, async (t) => {
    const api = new fdir()
      .onlyDirs()
      .filter((path) => path.includes("api"))
      .crawl("./src");
    const result = await execute(api, type);
    t.expect(result).toHaveLength(2);
  });

  test(`[${type}] crawl and return relative paths`, async (t) => {
    const api = new fdir()
      .withRelativePaths()
      .crawl(path.normalize(`node_modules/`));
    const paths = await execute(api, type);
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
    const paths = await execute(api, type);

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
    const paths = await execute(api, type);

    t.expect(paths.length).toBe(4);
    t.expect(paths.includes(path.join("dir", "dir1/"))).toBe(false);
    t.expect(paths.filter((p) => p === ".").length).toBe(1);
    t.expect(paths.filter((p) => p === "").length).toBe(0);
    mock.restore();
  });

  test(`[${type}] crawl and return relative paths that end with /`, async (t) => {
    const api = new fdir().withRelativePaths().crawl("./node_modules/");
    const paths = await execute(api, type);
    t.expect(
      paths.every((p) => !p.startsWith("node_modules") && !p.includes("//"))
    ).toBeTruthy();
  });

  test(`[${type}] crawl all files and invert path separator`, async (t) => {
    const api = new fdir()
      .withPathSeparator(sep === "/" ? "\\" : "/")
      .crawl("node_modules");
    const files = await execute(api, type);

    t.expect(files.every((f) => !f.includes(sep))).toBeTruthy();
  });

  test(`[${type}] crawl files that match using a custom glob`, async (t) => {
    const globFunction = vi.fn((glob: string | string[]) => {
      return (test: string): boolean => test.endsWith(".js");
    });
    const api = new fdir({ globFunction })
      .withBasePath()
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await execute(api, type);
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
    const files = await execute(api, type);
    t.expect(globFunction).toHaveBeenCalled();
    t.expect(files.every((file) => file.endsWith(".js"))).toBeTruthy();
  });

  test(`[${type}] crawl files that match using a picomatch`, async (t) => {
    const globFunction = picomatch;
    const api = new fdir({ globFunction })
      .withBasePath()
      .glob("**/*.js")
      .crawl("node_modules");
    const files = await execute(api, type);
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

  test(`[${type}] using custom fs implementation`, async (t) => {
    const readdirStub = vi.fn<Parameters<typeof fs.readdir>>(
      (_path, _opts, cb) => {
        cb(null, []);
      }
    );
    const readdirSyncStub = vi.fn();
    readdirSyncStub.mockReturnValue([]);
    const fakeFs = {
      ...fs,
      readdir: readdirStub,
      readdirSync: readdirSyncStub,
    } as unknown as typeof fs;

    const api = new fdir({
      fs: fakeFs,
    }).crawl("node_modules");
    await execute(api, type);
    if (type === "withPromise" || type === "withIterator") {
      t.expect(readdirStub).toHaveBeenCalled();
    } else {
      t.expect(readdirSyncStub).toHaveBeenCalled();
    }
  });
}

test.runIf(hasAbortController)(
  `[async] crawl directory & use abort signal to abort`,
  async (t) => {
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
  }
);

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

test("interrupted iterator should stop yielding results", async (t) => {
  const api = new fdir().crawl("./src");
  const iterator = api.withIterator()[Symbol.asyncIterator]();
  const results: string[] = [];
  let next = await iterator.next();
  do {
    results.push(next.value);
    iterator.return?.();
  } while (next.done !== false);
  t.expect(results.length).toBe(1);
});

test.runIf(hasAbortController)(
  "aborted iterator should stop yielding results",
  async (t) => {
    const aborter = new AbortController();
    const api = new fdir().withAbortSignal(aborter.signal).crawl("./src");
    const iterator = api.withIterator();
    const results: string[] = [];
    for await (const value of iterator) {
      results.push(value);
      aborter.abort();
    }
    t.expect(results.length).toBe(1);
  }
);
