import { fdir } from "../index";
import { fdir as fdir5 } from "fdir5";
import { fdir as fdir4 } from "fdir4";
import fdir3 from "fdir3";
import fdir1 from "fdir1";
import fdir2 from "fdir2";
import allFilesInTree from "all-files-in-tree";
import fsReadDirRecursive from "fs-readdir-recursive";
import klawSync from "klaw-sync";
import * as recurReadDir from "recur-readdir";
import recursiveFiles from "recursive-files";
import recursiveReadDir from "recursive-readdir";
import rrdir from "rrdir";
import walkSync from "walk-sync";
import recursiveFs from "recursive-fs";
import b from "benny";
import getAllFiles from "get-all-files";
import packageJson from "../package.json";
// import exportToHTML from "./export";

async function benchmark() {
  const counts = new fdir()
    .onlyCounts()
    .crawl("node_modules")
    .sync();

  await b.suite(
    `Synchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir ${packageJson.version} sync`, () => {
      new fdir().crawl("node_modules").sync();
    }),
    b.add("fdir 1.2.0 sync", () => {
      fdir1.sync("node_modules");
    }),
    b.add("fdir 2.1.1 sync", () => {
      fdir2.sync("node_modules");
    }),
    b.add("fdir 3.4.2 sync", () => {
      new fdir3().crawl("node_modules").sync("node_modules");
    }),
    b.add(`fdir 4.1.0 sync`, () => {
      new fdir4().crawl("node_modules").sync();
    }),
    b.add(`fdir 5.0.0 sync`, () => {
      new fdir5().crawl("node_modules").sync();
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

  await b.suite(
    `Asynchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir ${packageJson.version} async`, async () => {
      await new fdir().crawl("node_modules").withPromise();
    }),
    b.add(`fdir 3.4.2 async`, async () => {
      await new fdir3().crawl("node_modules").withPromise();
    }),
    b.add(`fdir 4.1.0 async`, async () => {
      await new fdir4().crawl("node_modules").withPromise();
    }),
    b.add(`fdir 5.0.0 async`, async () => {
      await new fdir5().crawl("node_modules").withPromise();
    }),
    b.add("recursive-fs async", async () => {
      await new Promise((resolve) => {
        recursiveFs.readdirr("node_modules", () => {
          resolve(undefined);
        });
      });
    }),
    b.add("recur-readdir async", async () => {
      await recurReadDir.crawl("node_modules");
    }),
    b.add("recursive-files async", async () => {
      let timeout: NodeJS.Timeout;
      await new Promise((resolve) => {
        recursiveFiles("node_modules", { hidden: true }, () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            resolve(undefined);
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
}
benchmark();
