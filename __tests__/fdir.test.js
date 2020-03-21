const fdir = require("../index");

describe.each(["sync", "async"])("fdir.%s", type => {
  test("read a directory", async () => {
    const files = await fdir[type]("__tests__");
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toBeTruthy();
    expect(files.every(t => t)).toBeTruthy();
    expect(files[0].length).toBeGreaterThan(0);
  });

  test("get all files and directories", async () => {
    const files = await fdir[type]("node_modules", { includeDirs: true });
    expect(files[0].endsWith("node_modules")).toBe(true);
  });

  test("get all files (max depth 1)", async () => {
    const files = await fdir[type]("node_modules", { maxDepth: 1 });
    expect(files.every(file => file.split("/").length <= 2)).toBe(true);
  });

  test("exclude a directory", async () => {
    const files = await fdir[type]("node_modules", {
      isExcludedDir: path => path.includes(".bin")
    });
    expect(files.every(file => !file.includes(".bin"))).toBe(true);
  });

  test("filter files in a directory", async () => {
    const files = await fdir[type]("node_modules", {
      searchFn: file => file.startsWith(".git")
    });
    expect(files.every(file => file.includes(".git"))).toBe(true);
  });

  test("get all files in a directory (without base path)", async () => {
    const files = await fdir[type]("node_modules", {
      excludeBasePath: true
    });
    expect(files.every(file => !file.includes("/"))).toBe(true);
  });

  test("get all files in a directory (resolve paths)", async () => {
    const files = await fdir[type]("node_modules", {
      resolvePaths: true
    });
    expect(files.every(file => file.startsWith("/"))).toBe(true);
  });
});

test("get all files in a directory (path with trailing slash)", async () => {
  const files = await fdir.async("node_modules/");
  expect(files.every(file => !file.includes("//"))).toBe(true);
});

test("getting files from non-existent directory should return empty array", async () => {
  expect((await fdir.async("node_/")).length).toBe(0);
});

test("recurse root (files should not contain multiple /)", async () => {
  const files = await fdir.async("/");
  expect(files.every(file => !file.includes("//"))).toBe(true);
});
