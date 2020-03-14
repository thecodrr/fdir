const fdir = require("../index");

test("reading from a non-existent directory should throw", () => {
  expect(() => fdir.sync("node_modules2")).toThrow();
});

test("read a directory", () => {
  const files = fdir.sync("node_modules");
  expect(files.length).toBeGreaterThan(0);
  expect(files[0]).toBeTruthy();
  expect(files.every(t => t)).toBeTruthy();
  expect(files[0].length).toBeGreaterThan(0);
});

test("get all files and directories", () => {
  const files = fdir.sync("node_modules", { includeDirs: true });
  expect(files[0].endsWith("node_modules")).toBe(true);
});

test("get all files (max depth 2)", () => {
  const files = fdir.sync("node_modules", { maxDepth: 2 });
  expect(files.every(file => file.split("/").length <= 3)).toBe(true);
});

test("exclude a directory", () => {
  const files = fdir.sync("node_modules", { excludedDirs: { ".bin": true } });
  expect(files.every(file => !file.includes(".bin"))).toBe(true);
});

test("filter files in a directory", () => {
  const files = fdir.sync("node_modules", {
    searchFn: file => file.startsWith(".git")
  });
  expect(files.every(file => file.includes(".git"))).toBe(true);
});

test("get all files in a directory (without base path)", () => {
  const files = fdir.sync("node_modules", {
    includeBasePath: false
  });
  expect(files.every(file => !file.includes("/"))).toBe(true);
});

test("get all files in a directory (resolve paths)", () => {
  const files = fdir.sync("node_modules", {
    resolvePaths: true
  });
  expect(files.every(file => file.startsWith("/"))).toBe(true);
});
