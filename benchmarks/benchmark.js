const fdir = require("../index");
const fdir1 = require("fdir1");
const fdir2 = require("fdir2");
const allFilesInTree = require("all-files-in-tree");
const fsReadDirRecursive = require("fs-readdir-recursive");
const klawSync = require("klaw-sync");
const recurReadDir = require("recur-readdir");
const recursiveFiles = require("recursive-files");
const recursiveReadDir = require("recursive-readdir");
const rrdir = require("rrdir");
const walkSync = require("walk-sync");
const recursiveFs = require("recursive-fs");
const b = require("benny");
const getAllFiles = require("get-all-files").default;

const counts = new fdir()
  .onlyCounts()
  .crawl("node_modules")
  .sync();

b.suite(
  `Synchronous (${counts.files} files, ${counts.dirs} folders)`,
  b.add("fdir 3.2.1 sync", () => {
    new fdir().crawl("node_modules").sync();
  }),
  b.add("fdir 1.2.0 sync", () => {
    fdir1.sync("node_modules");
  }),
  b.add("fdir 2.1.1 sync", () => {
    fdir2.sync("node_modules");
  }),
  b.add(`get-all-files sync`, () => {
    getAllFiles.sync.array("node_modules");
  }),
  b.add("all-files-in-tree sync", () => {
    allFilesInTree.sync("node_modules");
  }),
  b.add("fs-readdir-recursive sync", () => {
    fsReadDirRecursive("node_modules");
  }),
  b.add("klaw-sync", () => {
    klawSync("node_modules", {});
  }),
  b.add("recur-readdir sync", () => {
    recurReadDir.crawlSync("node_modules");
  }),
  b.add("walk-sync", () => {
    walkSync("node_modules");
  }),
  b.add("rrdir sync", () => {
    rrdir.sync("node_modules");
  }),
  b.cycle(),
  b.complete(),
  b.save({ file: "node-8-3-0-sync", format: "chart.html" })
);

b.suite(
  `Asynchronous (${counts.files} files, ${counts.dirs} folders)`,
  b.add("fdir 3.2.1 async", async () => {
    await new fdir().crawl("node_modules").withPromise();
  }),
  b.add("recursive-fs async", async () => {
    await new Promise((resolve) => {
      recursiveFs.readdirr("node_modules", () => {
        resolve();
      });
    });
  }),
  b.add("recur-readdir async", async () => {
    await recurReadDir.crawl("node_modules");
  }),
  b.add("recursive-files async", async () => {
    let timeout;
    await new Promise((resolve) => {
      recursiveFiles("node_modules", { hidden: true }, () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resolve();
        }, 0);
      });
    });
  }),
  b.add("recursive-readdir async", async () => {
    await recursiveReadDir("node_modules");
  }),
  b.add("rrdir async", async () => {
    await rrdir("node_modules");
  }),
  b.cycle(),
  b.complete(),
  b.save({ file: "node-8-3-0-async", format: "chart.html" })
);
