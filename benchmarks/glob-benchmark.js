const { fdir } = require("fdir4");
const glob = require("glob");
const fg = require("fast-glob");
const b = require("benny");
const packageJson = require("../package.json");
const exportToHTML = require("./export");

async function benchmark() {
  const summaries = [];
  const counts = new fdir()
    .glob("**.js")
    .onlyCounts()
    .crawl(".")
    .sync();

  const asyncSummary = await b.suite(
    `Asynchronous (${counts.files} files, ${counts.dirs} folders)`,
    b.add(`fdir ${packageJson.version} async`, async () => {
      await new fdir()
        .glob("**.js")
        .crawl(".")
        .withPromise();
    }),
    b.add("glob async", async () => {
      await new Promise((resolve) => {
        glob("**/**.js", { dot: true }, () => resolve());
      });
    }),
    b.add("fast-glob async", async () => {
      await fg("**.js", { dot: true });
    }),
    b.cycle(),
    b.complete()
  );

  const syncSummary = await b.suite(
    `Synchronous (${counts.files} files, ${counts.dirs} folders)`,
    b.add(`fdir ${packageJson.version} sync`, () => {
      new fdir()
        .glob("**.js")
        .crawl(".")
        .sync();
    }),
    b.add("glob sync", () => {
      glob.sync("**/**.js", { dot: true });
    }),
    b.add("fast-glob sync", () => {
      fg.sync("**.js", { dot: true });
    }),
    b.cycle(),
    b.complete()
  );

  summaries.push(asyncSummary, syncSummary);
  await exportToHTML(
    `fdir vs globbers - (${counts.files} files, ${counts.dirs} folders)`,
    "benchmark/results/globbers.html",
    summaries
  );
}

benchmark();
