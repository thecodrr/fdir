const util = require("util");
const fs = require("fs");
const path = require("path");
const readdir = util.promisify(fs.readdir);

function sync(dir, options) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const paths = [];

  if (options.includeDirs) paths.push(dir);
  if (--options.maxDepth < 0) return paths;

  dirents.forEach(function(dirent) {
    const dirPath = recurse(dirent, dir, paths, options);
    if (dirPath) {
      sync(dirPath, options).forEach(function(item) {
        paths.push(item);
      });
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
    dirents.map(async function(dirent) {
      const dirPath = recurse(dirent, dir, paths, options);
      if (dirPath) {
        (await async(dirPath, options)).forEach(function(item) {
          paths.push(item);
        });
      }
    })
  );
  return paths;
}

function recurse(dirent, dir, paths, options) {
  // In node < 10, Dirent is not present. Instead we get string paths
  const dirName = dirent.name || dirent;
  let fullPath = `${dir}${path.sep}${dirName}`;

  const isDirectory = dirent.isDirectory
    ? dirent.isDirectory()
    : fs.lstatSync(fullPath).isDirectory();
  if (isDirectory) {
    if (options.isExcludedDir && options.isExcludedDir(dirName)) return;
    return fullPath;
  } else {
    if (!options.includeBasePath) fullPath = dirName;
    if (!options.searchFn || options.searchFn(fullPath)) paths.push(fullPath);
  }
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
  return !options ? defaultOptions : Object.assign(defaultOptions, options);
}

function getFunction(type, dir, options) {
  options = getOptions(options);
  if (options.resolvePaths) dir = path.resolve(dir);
  return type(dir, options);
}

module.exports = {
  sync: getFunction.bind(this, sync),
  async: getFunction.bind(this, async)
};
