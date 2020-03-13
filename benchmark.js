const fdir = require("./index")();
const readdir = require("@folder/readdir");
const allFilesInTree = require("all-files-in-tree");
const fsReadDirRecursive = require("fs-readdir-recursive");
const getAllFiles = require("get-all-files");
const klawSync = require("klaw-sync");
const recurReadDir = require("recur-readdir");
const recursiveFiles = require("recursive-files");
const recursiveReadDir = require("recursive-readdir");
const rrdir = require("rrdir");
const walkSync = require("walk-sync");
const b = require("benny");

b.suite(
  "The Fastest Directory Crawler",
  b.add("fdir async", async () => {
    await fdir.async("node_modules");
  }),
  b.add("fdir sync", () => {
    fdir.sync("node_modules");
  }),
  b.add("@folder/readdir async", async () => {
    await readdir("node_modules", { dot: true, recursive: true });
  }),
  b.add("@folder/readdir sync", () => {
    readdir.sync("node_modules", { dot: true, recursive: true });
  }),
  b.add("all-files-in-tree async", async () => {
    await allFilesInTree.async("node_modules");
  }),
  b.add("all-files-in-tree sync", () => {
    allFilesInTree.sync("node_modules");
  }),
  b.add("fs-readdir-recursive sync", () => {
    fsReadDirRecursive("node_modules");
  }),
  b.add("get-all-files async", async () => {
    await getAllFiles("node_modules");
  }),
  b.add("klaw-sync", () => {
    klawSync("node_modules", {});
  }),
  b.add("recur-readdir async", async () => {
    await recurReadDir.crawl("node_modules");
  }),
  b.add("recur-readdir sync", () => {
    recurReadDir.crawlSync("node_modules");
  }),
  b.add("recursive-files async", async () => {
    let timeout;
    await new Promise(resolve => {
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
  b.add("rrdir sync", () => {
    rrdir.sync("node_modules");
  }),
  b.add("walk-sync", () => {
    walkSync("node_modules");
  }),
  b.cycle(),
  b.complete(),
  b.save({ file: "fdir-benchmark-battery", format: "chart.html" })
);
