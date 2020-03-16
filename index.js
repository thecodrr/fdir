const fs = require("fs");
const path = require("path");

const readdirOpts = { withFileTypes: true };

function sync(dir, options) {
  const paths = [];
  const dirs = [dir];
  let currentDepth = options.maxDepth;
  var i = 0;
  while (i < dirs.length && !(--currentDepth < 0)) {
    const dir = dirs[i];
    if (options.includeDirs) paths.push(dir);
    const dirents = fs.readdirSync(dir, readdirOpts);
    dirents.forEach(function(dirent) {
      recurse(dirent, dir, paths, options, dirs);
    });
    ++i;
  }
  return paths;
}

function async(dir, options) {
  return new Promise(function(resolve) {
    const paths = [];
    const dirs = [dir];
    let cursor = 0;
    let readCount = 0;
    let currentDepth = options.maxDepth;
    function walk() {
      let total = dirs.length;
      for (; cursor < total; ++cursor) {
        if (--currentDepth < 0) {
          resolve(paths);
          break;
        }
        const dir = dirs[cursor];
        if (options.includeDirs) paths.push(dir);
        fs.readdir(dir, readdirOpts, function(err, dirents) {
          dirents.forEach(function(dirent) {
            recurse(dirent, dir, paths, options, dirs);
          });
          if (++readCount === total) {
            if (dirs.length === cursor) {
              resolve(paths);
            } else {
              walk();
            }
          }
        });
      }
    }
    walk();
  });
}

function recurse(dirent, dir, paths, options, dirs) {
  // In node < 10, Dirent is not present. Instead we get string paths
  const dirName = dirent.name || dirent;
  let fullPath = `${dir}${path.sep}${dirName}`;

  const isDirectory = dirent.isDirectory
    ? dirent.isDirectory()
    : fs.lstatSync(fullPath).isDirectory();
  if (isDirectory) {
    if (options.isExcludedDir && options.isExcludedDir(dirName)) return;
    dirs.push(fullPath);
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
