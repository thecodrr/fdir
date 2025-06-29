import child_process from "node:child_process";
import { Fdir } from "../src/index";
import b from "benny";

type Version = (typeof versions)[number] | "current";
const versions = ["4.0.0", "4.1.0", "5.0.0", "5.2.0"] as const;

const syncSuites: ReturnType<(typeof b)["add"]>[] = [];
const asyncSuites: ReturnType<(typeof b)["add"]>[] = [];

function normalizeVersion(version: Version) {
  return version.replaceAll(".", "");
}

function makeSuite(version: Version) {
  const normalized = normalizeVersion(version);
  const { fdir } = require(`fdir${normalized}`);
  addSuite(fdir, version);
}

function addSuite(instance: Fdir, version: Version) {
  syncSuites[syncSuites.length] = b.add(`fdir ${version} sync`, function () {
    new instance().crawl("node_modules").sync();
  });

  asyncSuites[asyncSuites.length] = b.add(
    `fdir ${version} async`,
    async function () {
      await new instance().crawl("node_modules").withPromise();
    }
  );
}

async function fillSuites() {
  const { fdir } = await import("../src/index");
  addSuite(fdir, "current");

  versions.forEach((version) => {
    makeSuite(version);
  });
}

async function runBenchmark() {
  await fillSuites();

  const counts = await getCounts();

  await b.suite(
    `Asynchronous (${counts.files} files, ${counts.dirs} folders)`,
    ...asyncSuites,
    b.cycle(),
    b.complete()
  );

  await b.suite(
    `Synchronous (${counts.files} files, ${counts.dirs} folders)`,
    ...syncSuites,
    b.cycle(),
    b.complete()
  );
}

function getPackageAlias(version: Version) {
  const normalized = normalizeVersion(version);
  return `fdir${normalized}@npm:fdir@${version}`;
}

async function getCounts() {
  const normalized = normalizeVersion(versions[3]);
  const { fdir } = await import(`fdir${normalized}`);
  return new fdir().onlyCounts().crawl("node_modules").sync();
}

function appendVersionsToCommand(command: string) {
  versions.forEach((v) => {
    command += getPackageAlias(v) + " ";
  });
  return command.trim();
}

function removePackages() {
  const v = versions.map((v) => normalizeVersion(v)).join(" fdir");
  let cmd = `npm uninstall fdir${v}`;
  child_process.exec(cmd.trim(), (err) => {
    if (err) {
      console.error(err);
      process.exit(err.code);
    }
    console.log("Done removing all versions...");
  });
}

function addPackages() {
  let cmd = appendVersionsToCommand(`npm i -D `);
  console.log("Running cmd", cmd);
  child_process.exec(cmd.trim(), async (err) => {
    if (err) {
      console.error(err);
      process.exit(err.code);
    }
    console.log(`Done installing all versions...`);
    console.log("Starting benchmarks...");
    await setCPUScaling(false);
    await runBenchmark();
    await setCPUScaling(true);
    removePackages();
  });
}

function setCPUScaling(isEnabled: boolean) {
  if (process.platform !== "linux") return;

  return new Promise((resolve, reject) => {
    console.log((isEnabled ? "Enabling" : "Disabling") + " cpu scaling...");
    const profile = isEnabled ? "powersave" : "performance";
    child_process.exec(
      `sudo cpupower frequency-set --governor ${profile}`,
      (err) => {
        if (err) return reject(err);
        resolve(undefined);
      }
    );
  });
}

addPackages();
