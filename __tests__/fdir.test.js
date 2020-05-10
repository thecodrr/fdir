const fdir = require("../index.js");
const mock = require("mock-fs");

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
}

describe.each(["withPromise", "sync"])("fdir %s", (type) => {
  test("crawl single depth directory", async () => {
    await crawl(type, "__tests__");
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
    expect(files[0].endsWith("node_modules")).toBe(true);
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

  test("crawl all files in a directory (without base path)", async () => {
    const api = new fdir().crawl("./");
    const files = await api[type]();
    expect(files.every((file) => !file.includes("/"))).toBe(true);
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

  test("getting files from restricted directory shouldn't throw (supressErrors)", async () => {
    const api = new fdir().crawl("/etc");
    const files = await api[type]();
    expect(files.length).toBeGreaterThan(0);
  });

  test("recurse root (files should not contain multiple /)", async () => {
    mock({
      "/": {
        etc: {
          hosts: "dooone",
        },
      },
    });
    const api = new fdir().normalize().crawl("/");
    const files = await api[type]();
    expect(files.every((file) => !file.includes("/"))).toBe(true);
    mock.restore();
  });

  test("crawl all files with only counts", async () => {
    const api = new fdir().onlyCounts().crawl("node_modules");
    const result = await api[type]();
    expect(result.files).toBeGreaterThan(0);
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

  test("crawl and filter all files and group them by directory", async () => {
    const api = new fdir()
      .withBasePath()
      .group()
      .crawl("node_modules");
    const result = await api[type]();
    expect(result.length).toBeGreaterThan(0);
  });

  test("crawl and give undefined directory path should throw", async () => {
    const api = new fdir().crawl();
    try {
      await api[type]();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
