import { fdir } from "../src/index";
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
import { readFileSync, readdirSync, writeFileSync } from "fs";
import CSV2MD from "csv-to-markdown-table";
import { getSystemInfo } from "./export";
import { readdir } from "fs/promises";

async function benchmark() {
  const DIRECTORY = "node_modules";
  const counts = new fdir().onlyCounts().crawl(DIRECTORY).sync();

  await b.suite(
    `Synchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir (v${packageJson.version})`, () => {
      new fdir().crawl(DIRECTORY).sync();
    }),
    b.add("fdir (v1.2.0)", () => {
      fdir1.sync(DIRECTORY);
    }),
    b.add("fdir (v2.1.1)", () => {
      fdir2.sync(DIRECTORY);
    }),
    b.add("fdir (v3.4.2)", () => {
      new fdir3().crawl(DIRECTORY).sync(DIRECTORY);
    }),
    b.add(`fdir (v4.1.0)`, () => {
      new fdir4().crawl(DIRECTORY).sync();
    }),
    b.add(`fdir (v5.0.0)`, () => {
      new fdir5().crawl(DIRECTORY).sync();
    }),
    b.add(`get-all-files`, () => {
      getAllFilesSync(DIRECTORY).toArray();
    }),
    b.add("all-files-in-tree", () => {
      allFilesInTree.sync(DIRECTORY);
    }),
    b.add("fs-readdir-recursive", () => {
      fsReadDirRecursive(DIRECTORY);
    }),
    b.add("klaw-sync", () => {
      klawSync(DIRECTORY, {});
    }),
    b.add("recur-readdir", () => {
      recurReadDir.crawlSync(DIRECTORY);
    }),
    b.add("walk-sync", () => {
      walkSync(DIRECTORY);
    }),
    b.add("node:fs.readdirSync", () => {
      readdirSync(DIRECTORY, { withFileTypes: true, recursive: true });
    }),
    b.cycle(),
    b.complete(),
    b.save({ format: "csv", file: "sync" })
  );

  await b.suite(
    `Asynchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir (v${packageJson.version})`, async () => {
      await new fdir().crawl(DIRECTORY).withPromise();
    }),
    b.add(`fdir (v3.4.2)`, async () => {
      await new fdir3().crawl(DIRECTORY).withPromise();
    }),
    b.add(`fdir (v4.1.0)`, async () => {
      await new fdir4().crawl(DIRECTORY).withPromise();
    }),
    b.add(`fdir (v5.0.0)`, async () => {
      await new fdir5().crawl(DIRECTORY).withPromise();
    }),
    b.add("recursive-fs", async () => {
      await new Promise((resolve) => {
        recursiveFs.readdirr(DIRECTORY, () => {
          resolve(undefined);
        });
      });
    }),
    b.add("recur-readdir", async () => {
      await recurReadDir.crawl(DIRECTORY);
    }),
    b.add("recursive-files", async () => {
      let timeout;
      await new Promise((resolve) => {
        recursiveFiles(DIRECTORY, { hidden: true }, () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            resolve(undefined);
          }, 0);
        });
      });
    }),
    b.add("recursive-readdir", async () => {
      await recursiveReadDir(DIRECTORY);
    }),
    b.add("getAllFiles", async () => {
      await getAllFiles(DIRECTORY).toArray();
    }),
    b.add("node:fs.readdir", async () => {
      await readdir(DIRECTORY, { withFileTypes: true, recursive: true });
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
