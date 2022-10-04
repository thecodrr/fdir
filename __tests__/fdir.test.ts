import { fdir } from "../index";
import fs from "fs";
import mock from "mock-fs";
import tap from "tap";

tap.beforeEach(() => {
  mock.restore();
});

tap.test(`crawl single depth directory with callback`, (t) => {
  const api = new fdir().crawl("__tests__");
  api.withCallback((err, files) => {
    if (err) return t.end();
    t.ok(files[0]);
    t.ok(files.every((t) => t));
    t.ok(files[0].length > 0);
    t.end();
  });
});

type APITypes = "withPromise" | "sync";
const apiTypes = ["withPromise", "sync"] as const;

async function crawl(type: APITypes, path: string) {
  const api = new fdir().crawl(path);
  const files = await api[type]();
  if (!files) throw new Error("files cannot be null.");
  tap.ok(files[0]);
  tap.ok(files.every((t) => t));
  tap.ok(files[0].length > 0);
  return files;
}

for (const type of apiTypes) {
  tap.test(`[${type}] crawl single depth directory`, async (t) => {
    await crawl(type, "__tests__");
  });

  tap.test(`[${type}] crawl single depth directory with options`, async (t) => {
    const api = new fdir({ includeBasePath: true }).crawl("__tests__");
    const files = await api[type]();
    t.ok(files.every((file) => file.startsWith("__tests__")));
  });

  tap.test(`[${type}] crawl multi depth directory with options`, async (t) => {
    const api = new fdir({
      maxDepth: 1,
    }).crawl("node_modules");
    const files = await api[type]();
    t.ok(files.every((file) => file.split("/").length <= 3));
  });

  tap.test(`[${type}] crawl multi depth directory`, async (t) => {
    await crawl(type, "node_modules");
  });

  tap.test(
    `[${type}] crawl and get both files and directories (withDirs)`,
    async (t) => {
      const api = new fdir().withDirs().crawl("node_modules");
      const files = await api[type]();
      t.ok(files[0]);
      t.ok(files.every((t) => t));
      t.ok(files[0].length > 0);
      t.ok(files[0].endsWith("node_modules/"));
    }
  );

  tap.test(
    `[${type}] crawl and get all files (withMaxDepth = 1)`,
    async (t) => {
      const api = new fdir()
        .withMaxDepth(1)
        .withBasePath()
        .crawl("node_modules");
      const files = await api[type]();
      t.ok(files.every((file) => file.split("/").length <= 3));
    }
  );

  tap.test(
    `[${type}] crawl and get files that match a glob pattern`,
    async (t) => {
      const api = new fdir()
        .withBasePath()
        .glob("./**/*.js")
        .glob("./**/*.js")
        .crawl("node_modules");
      const files = await api[type]();
      t.ok(files.every((file) => file.endsWith(".js")));
    }
  );

  tap.test(`[${type}] crawl but exclude node_modules dir`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .exclude((dir) => dir.includes("node_modules"))
      .crawl("./");
    const files = await api[type]();
    t.ok(files.every((file) => !file.includes("node_modules")));
  });

  tap.test(`[${type}] crawl all files with filter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .crawl("./");
    const files = await api[type]();
    t.ok(files.every((file) => file.includes(".git")));
  });

  tap.test(`[${type}] crawl all files with multifilter`, async (t) => {
    const api = new fdir()
      .withBasePath()
      .filter((file) => file.includes(".git"))
      .filter((file) => file.includes(".js"))
      .crawl("./");
    const files = await api[type]();
    t.ok(files.every((file) => file.includes(".git") || file.includes(".js")));
  });

  tap.test(
    `[${type}] crawl all files in a directory (with base path)`,
    async (t) => {
      const api = new fdir().withBasePath().crawl("./");
      const files = await api[type]();
      t.ok(files.every((file) => file.includes("./")));
    }
  );

  tap.test(
    "get all files in a directory and output full paths (withFullPaths)",
    async (t) => {
      const api = new fdir().withFullPaths().crawl("./");
      const files = await api[type]();
      t.ok(files.every((file) => file.startsWith("/")));
    }
  );

  tap.test(
    "getting files from restricted directory should throw",
    async (t) => {
      try {
        const api = new fdir().withErrors().crawl("/etc");
        await api[type]();
      } catch (e) {
        t.ok(e);
      }
    }
  );

  tap.test(
    "getting files from restricted directory shouldn't throw (suppressErrors)",
    async (t) => {
      const api = new fdir().crawl("/etc");
      const files = await api[type]();
      t.ok(files.length > 0);
    }
  );

  tap.test(
    `[${type}] recurse root (files should not contain multiple /)`,
    async (t) => {
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
      t.ok(files.every((file) => !file.includes("//")));
      mock.restore();
    }
  );

  tap.test(
    `[${type}] crawl all files and include resolved symlinks`,
    async (t) => {
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
      t.ok(files.length === 2);
      t.ok(files.indexOf("/sym/linked/file-1") > -1);
      t.ok(files.indexOf("/other/dir/file-2") > -1);
      mock.restore();
    }
  );

  tap.test(
    "crawl all files and include resolved symlinks with exclusions",
    async (t) => {
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
      t.ok(files.length === 1);
      t.ok(files.indexOf("/other/dir/file-2") > -1);
      mock.restore();
    }
  );

  tap.test(
    `[${type}] crawl all files and include unresolved symlinks`,
    async (t) => {
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
      t.ok(files.length === 3);
      t.ok(files.indexOf("/some/dir/") > -1);
      t.ok(files.indexOf("fileSymlink") > -1);
      t.ok(files.indexOf("dirSymlink") > -1);
      mock.restore();
    }
  );

  tap.test(
    "crawl all files (including symlinks) and throw errors",
    async (t) => {
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
          t.ok(e.message.includes("no such file or directory"));
      }
      mock.restore();
    }
  );

  tap.test(`[${type}] crawl all files with only counts`, async (t) => {
    const api = new fdir().onlyCounts().crawl("node_modules");
    const result = await api[type]();
    t.ok(result.files > 0);
  });

  tap.test(`[${type}] crawl and return only directories`, async (t) => {
    const api = new fdir().onlyDirs().crawl("node_modules");
    const result = await api[type]();
    t.ok(result.length > 0);
    t.ok(
      result.every((dir) => {
        return fs.statSync(dir).isDirectory;
      })
    );
  });

  tap.test(
    `[${type}] crawl with options and return only directories`,
    async (t) => {
      const api = new fdir({
        excludeFiles: true,
        includeDirs: true,
      }).crawl("node_modules");
      const result = await api[type]();
      t.ok(result.length > 0);
      t.ok(
        result.every((dir) => {
          return fs.statSync(dir).isDirectory;
        })
      );
    }
  );

  tap.test(
    `[${type}] crawl and filter all files and get only counts`,
    async (t) => {
      const api = new fdir()
        .withBasePath()
        .filter((file) => file.includes("node_modules"))
        .onlyCounts()
        .crawl("./");
      const result = await api[type]();
      t.ok(result.files > 0);
    }
  );

  tap.test(
    "crawl all files in a directory (path with trailing slash)",
    async (t) => {
      const api = new fdir().normalize().crawl("node_modules/");
      const files = await api[type]();
      const res = files.every((file) => !file.includes("/"));
      t.ok(res);
    }
  );

  tap.test(
    `[${type}] crawl all files and group them by directory`,
    async (t) => {
      const api = new fdir()
        .withBasePath()
        .group()
        .crawl("node_modules");
      const result = await api[type]();
      t.ok(result.length > 0);
    }
  );

  tap.test(`[${type}] crawl and filter only directories`, async (t) => {
    const api = new fdir()
      .onlyDirs()
      .filter((path) => path.includes("api"))
      .crawl("./src");
    const result = await api[type]();
    t.ok(result.length === 2);
  });

  tap.test(
    `[${type}] giving undefined directory path should throw`,
    async (t) => {
      // @ts-ignore
      const api = new fdir().crawl();
      try {
        await api[type]();
      } catch (e) {
        t.ok(!!e);
      }
    }
  );

  tap.test(`[${type}] crawl and return relative paths`, async (t) => {
    const api = new fdir().withRelativePaths().crawl("node_modules");
    const paths = await api[type]();
    t.ok(paths.every((p) => !p.startsWith("node_modules")));
  });

  tap.test(
    `[${type}] crawl and return relative paths that end with /`,
    async (t) => {
      const api = new fdir().withRelativePaths().crawl("./node_modules/");
      const paths = await api[type]();
      t.ok(
        paths.every((p) => !p.startsWith("node_modules") && !p.includes("//"))
      );
    }
  );
}
