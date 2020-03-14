const util = require("util");
const fs = require("fs");
const path = require("path");
const readdir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);

function push(item) {
  this.push(item);
}

function sync(dir, options) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const paths = [];

  if (options.includeDirs) paths.push(dir);
  if (--options.maxDepth < 0) return paths;

  dirents.forEach(dirent => {
    let res = `${dir}${path.sep}${dirent.name}`;
    if (
      (dirent.isDirectory && dirent.isDirectory()) ||
      fs.lstatSync(res).isDirectory()
    ) {
      if (options.excludedDirs && options.excludedDirs[dirent.name]) return;
      sync(res, options).forEach(push.bind(paths));
    } else {
      if (!options.includeBasePath) res = dirent.name;
      if (!options.searchFn || options.searchFn(res)) paths.push(res);
    }
  });
  return paths;
}

async function async(dir, options) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const paths = [];

  if (options.includeDirs) paths.push(dir);
  if (--options.maxDepth < 0) return paths;

  await Promise.all(
    dirents.map(async dirent => {
      let res = `${dir}${path.sep}${dirent.name}`;
      if (
        (dirent.isDirectory && dirent.isDirectory()) ||
        (await lstat(res)).isDirectory()
      ) {
        if (options.excludedDirs && options.excludedDirs[dirent.name]) return;
        (await async(res, options)).forEach(push.bind(paths));
      } else {
        if (!options.includeBasePath) res = dirent.name;
        if (!options.searchFn || options.searchFn(res)) paths.push(res);
      }
    })
  );
  return paths;
}

function getOptions(options) {
  const defaultOptions = {
    includeDirs: false,
    includeBasePath: true,
    maxDepth: undefined,
    searchFn: undefined,
    resolvePaths: false,
    excludedDirs: undefined
  };
  return !options ? defaultOptions : { ...defaultOptions, ...options };
}

module.exports = {
  sync: (dir, options) => {
    options = getOptions(options);
    if (options.resolvePaths) dir = path.resolve(dir);
    return sync(dir, options);
  },
  async: (dir, options) => {
    options = getOptions(options);
    if (options.resolvePaths) dir = path.resolve(dir);
    return async(dir, options);
  }
};
