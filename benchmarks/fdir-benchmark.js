const b = require("benny");
const child_process = require("child_process");

const versions = ["4.0.0"];

function versionNormalizer(version) {
  return version.replace(/\./g, "");
}

const syncSuites = [];
const asyncSuites = [];

function makeSuite(version) {
  const normalized = versionNormalizer(version);
  const { fdir } = require(`fdir${normalized}`);
  addSuite(fdir, version);
}

function addSuite(fdir, version) {
  syncSuites[syncSuites.length] = b.add(`fdir ${version} sync`, function() {
    new fdir().crawl("node_modules").sync();
  });

  asyncSuites[asyncSuites.length] = b.add(
    `fdir ${version} async`,
    async function() {
      await new fdir().crawl("node_modules").withPromise();
    }
  );
}

function fillSuites() {
  versions.forEach((version) => {
    makeSuite(version);
  });
  const { fdir } = require("../index");
  addSuite(fdir, "current");
}

async function runBenchmark() {
  fillSuites();

  const counts = getCounts();

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

function getPackageAlias(version) {
  const normalized = versionNormalizer(version);
  return `fdir${normalized}@npm:fdir@${version}`;
}

function getCounts() {
  const normalized = versionNormalizer(versions.pop());
  const { fdir } = require(`fdir${normalized}`);
  return new fdir()
    .onlyCounts()
    .crawl("node_modules")
    .sync();
}

function appendVersionsToCommand(command) {
  let cmd = command;
  versions.forEach((v) => {
    cmd += getPackageAlias(v) + " ";
  });
  return cmd.trim();
}

function removePackages() {
  const v = versions.map((v) => versionNormalizer(v)).join(" fdir");
  let cmd = `yarn remove fdir${v}`;
  child_process.execSync(cmd.trim(), (err) => {
    if (err) {
      console.error(err);
      process.exit(err.code);
    }
    console.log("Done removing all versions...");
  });
}

function addPackages() {
  let cmd = appendVersionsToCommand(`yarn add --dev `);
  child_process.exec(cmd.trim(), async (err) => {
    if (err) process.exit(err.code);
    console.log(`Done installing all versions...`);
    console.log("Starting benchmarks...");
    await setCPUScaling(false);
    await runBenchmark();
    await setCPUScaling(true);
    removePackages();
  });
}

function setCPUScaling(isEnabled) {
  return new Promise((resolve, reject) => {
    console.log((isEnabled ? "Enabling" : "Disabling") + " cpu scaling...");
    const profile = isEnabled ? "powersave" : "performance";
    child_process.exec(
      `sudo cpupower frequency-set --governor ${profile}`,
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

addPackages();
