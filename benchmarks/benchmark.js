const fdir = require("fdir3");
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
const packageJson = require("../package.json");
const exportToHTML = require("./export");

async function benchmark() {
  const summaries = [];
  const counts = new fdir()
    .onlyCounts()
    .crawl("node_modules")
    .sync();

  const syncSummary = await b.suite(
    `Synchronous (${counts.files} files, ${counts.dirs} folders)`,
    b.add(`fdir ${packageJson.version} sync`, () => {
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
    b.complete()
  );

  const asyncSummary = await b.suite(
    `Asynchronous (${counts.files} files, ${counts.dirs} folders)`,
    b.add(`fdir ${packageJson.version} async`, async () => {
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
    b.complete()
  );

  summaries.push(asyncSummary, syncSummary);
  await exportToHTML(
    `fdir vs crawlers - (${counts.files} files, ${counts.dirs} folders)`,
    "benchmark/results/crawlers.html",
    summaries
  );
}
benchmark();
