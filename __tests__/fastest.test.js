const fdir = require("../index");
const allFilesInTree = require("all-files-in-tree");
const fsReadDirRecursive = require("fs-readdir-recursive");
const getAllFiles = require("get-all-files");
const klawSync = require("klaw-sync");
const recurReadDir = require("recur-readdir");
const recursiveFiles = require("recursive-files");
const recursiveReadDir = require("recursive-readdir");
const rrdir = require("rrdir");
const walkSync = require("walk-sync");
const recursiveFs = require("recursive-fs");
const b = require("benny");
const assert = require("assert");

b.suite(
  "Synchronous",
  b.add("fdir sync", () => {
    fdir.sync("node_modules");
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
  b.complete(results => {
    assert.equal(
      results.fastest.name,
      "fdir sync",
      `fdir.sync is slower by ${
        results.results[0].percentSlower
      }.\nCurrent ops/s: ${results.results[0].ops}.\nFastest: ${
        results.fastest.name
      } with ${results.results[results.fastest.index].ops} ops/s`
    );
  })
);

b.suite(
  "Asynchronous",
  b.add("fdir async", async () => {
    await fdir.async("node_modules");
  }),
  b.add("recursive-fs async", async () => {
    await new Promise(resolve => {
      recursiveFs.readdirr("node_modules", () => {
        resolve();
      });
    });
  }),
  b.add("get-all-files async", async () => {
    await getAllFiles("node_modules");
  }),
  b.add("recur-readdir async", async () => {
    await recurReadDir.crawl("node_modules");
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
  b.cycle(),
  b.complete(results => {
    assert.equal(
      results.fastest.name,
      "fdir async",
      `fdir.async is slower by ${
        results.results[0].percentSlower
      }.\nCurrent ops/s: ${results.results[0].ops}\nFastest: ${
        results.fastest.name
      } with ${results.results[results.fastest.index].ops} ops/s`
    );
  })
);
