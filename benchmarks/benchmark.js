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
import walkSync from "walk-sync";
import recursiveFs from "recursive-fs";
import b from "benny";
import { getAllFilesSync, getAllFiles } from "get-all-files";
import packageJson from "../package.json";
import { readFileSync, writeFileSync } from "fs";
import CSV2MD from "csv-to-markdown-table";
import { getSystemInfo } from "./export";

async function benchmark() {
  const counts = new fdir().onlyCounts().crawl("node_modules").sync();

  await b.suite(
    `Synchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir (v${packageJson.version})`, () => {
      new fdir().crawl("node_modules").sync();
    }),
    b.add("fdir (v1.2.0)", () => {
      fdir1.sync("node_modules");
    }),
    b.add("fdir (v2.1.1)", () => {
      fdir2.sync("node_modules");
    }),
    b.add("fdir (v3.4.2)", () => {
      new fdir3().crawl("node_modules").sync("node_modules");
    }),
    b.add(`fdir (v4.1.0)`, () => {
      new fdir4().crawl("node_modules").sync();
    }),
    b.add(`fdir (v5.0.0)`, () => {
      new fdir5().crawl("node_modules").sync();
    }),
    b.add(`get-all-files`, () => {
      getAllFilesSync("node_modules").toArray();
    }),
    b.add("all-files-in-tree", () => {
      allFilesInTree.sync("node_modules");
    }),
    b.add("fs-readdir-recursive", () => {
      fsReadDirRecursive("node_modules");
    }),
    b.add("klaw-sync", () => {
      klawSync("node_modules", {});
    }),
    b.add("recur-readdir", () => {
      recurReadDir.crawlSync("node_modules");
    }),
    b.add("walk-sync", () => {
      walkSync("node_modules");
    }),
    b.cycle(),
    b.complete(),
    b.save({ format: "csv", file: "sync" })
  );

  await b.suite(
    `Asynchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir (v${packageJson.version})`, async () => {
      await new fdir().crawl("node_modules").withPromise();
    }),
    b.add(`fdir (v3.4.2)`, async () => {
      await new fdir3().crawl("node_modules").withPromise();
    }),
    b.add(`fdir (v4.1.0)`, async () => {
      await new fdir4().crawl("node_modules").withPromise();
    }),
    b.add(`fdir (v5.0.0)`, async () => {
      await new fdir5().crawl("node_modules").withPromise();
    }),
    b.add("recursive-fs", async () => {
      await new Promise((resolve) => {
        recursiveFs.readdirr("node_modules", () => {
          resolve(undefined);
        });
      });
    }),
    b.add("recur-readdir", async () => {
      await recurReadDir.crawl("node_modules");
    }),
    b.add("recursive-files", async () => {
      let timeout;
      await new Promise((resolve) => {
        recursiveFiles("node_modules", { hidden: true }, () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            resolve(undefined);
          }, 0);
        });
      });
    }),
    b.add("recursive-readdir", async () => {
      await recursiveReadDir("node_modules");
    }),
    b.add("getAllFiles", async () => {
      await getAllFiles("node_modules").toArray();
    }),
    b.cycle(),
    b.complete(),
    b.save({ format: "csv", file: "./async" })
  );

  const asyncCsv = readFileSync("./benchmark/results/async.csv", "utf-8");
  const syncCsv = readFileSync("./benchmark/results/sync.csv", "utf-8");

  const md = `# Benchmarks

**System information:**
\`\`\`
Package version: ${packageJson.version}
${await getSystemInfo()}
\`\`\`

## Asynchronous

> ${counts.files} files & ${counts.directories} directories

${toMd(asyncCsv, ",", true)}

## Synchronous

> ${counts.files} files & ${counts.directories} directories

${toMd(syncCsv, ",", true)}
`;

  writeFileSync("BENCHMARKS.md", md);
}
benchmark();

function toMd(csv) {
  return CSV2MD(csv, ",", true)
    .replace(`"name"`, "Package")
    .replace(`"ops"`, `ops/s`)
    .replace(`"margin"`, "Error margin")
    .replace(`"percentSlower"`, "% slower")
    .replace(/"(.+?)"/gm, "$1");
}
