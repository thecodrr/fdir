import { fdir } from "../src/index.ts";
import { glob, globSync } from "glob";
import fg from "fast-glob";
import tg from "tiny-glob";
import tgSync from "tiny-glob/sync";
import b from "benny";
import packageJson from "../package.json";

async function benchmark() {
  const counts = new fdir().glob("**/*.js").onlyCounts().crawl(".").sync();

  await b.suite(
    `Asynchronous (${counts.files} files, ${counts.directories} folders)`,
    b.add(`fdir ${packageJson.version} async`, async () => {
      await new fdir().glob("**/*.js").crawl(".").withPromise();
    }),
    b.add("glob async", async () => {
      await glob("**/*.js", { dot: true, withFileTypes: true });
    }),
    b.add("fast-glob async", async () => {
      await fg("**/*.js", { dot: true, onlyFiles: true });
    }),
    b.add("tiny-glob async", async () => {
      await tg("**/*.js", { dot: true, filesOnly: true });
    }),
    b.cycle(),
    b.complete()
  );

  await b.suite(
    `Synchronous (${counts.files} files, ${counts.dirs} folders)`,
    b.add(`fdir ${packageJson.version} sync`, () => {
      new fdir().glob("**.js").crawl(".").sync();
    }),
    b.add("glob sync", () => {
      globSync("**/**.js", { dot: true, withFileTypes: true });
    }),
    b.add("fast-glob sync", () => {
      fg.sync("**.js", { dot: true });
    }),
    b.add("tiny-glob sync", () => {
      tgSync("**/**.js", { dot: true });
    }),
    b.cycle(),
    b.complete()
  );
}

benchmark();
