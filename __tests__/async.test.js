const fdir = require("../index");

test("reading from a non-existent directory should reject", () => {
  expect(fdir.async("node_modules2")).rejects.toThrow();
});

test("read a directory", async () => {
  const files = await fdir.async("node_modules");
  expect(files.length).toBeGreaterThan(0);
  expect(files[0]).toBeTruthy();
  expect(files.every(t => t)).toBeTruthy();
  expect(files[0].length).toBeGreaterThan(0);
});

test("get all files and directories", async () => {
  const files = await fdir.async("node_modules", { includeDirs: true });
  expect(files[0].endsWith("node_modules")).toBe(true);
});

test("get all files (max depth 1)", async () => {
  const files = await fdir.async("node_modules", { maxDepth: 1 });
  expect(files.every(file => file.split("/").length <= 2)).toBe(true);
});

test("exclude a directory", async () => {
  const files = await fdir.async("node_modules", {
    excludedDirs: { ".bin": true }
  });
  expect(files.every(file => !file.includes(".bin"))).toBe(true);
});

test("filter files in a directory", async () => {
  const files = await fdir.async("node_modules", {
    searchFn: file => file.startsWith(".git")
  });
  expect(files.every(file => file.includes(".git"))).toBe(true);
});

test("get all files in a directory (without base path)", async () => {
  const files = await fdir.async("node_modules", {
    includeBasePath: false
  });
  expect(files.every(file => !file.includes("/"))).toBe(true);
});

test("get all files in a directory (resolve paths)", async () => {
  const files = await fdir.async("node_modules", {
    resolvePaths: true
  });
  expect(files.every(file => file.startsWith("/"))).toBe(true);
});
