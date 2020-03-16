const fs = require("fs");
const { sep } = require("path");

const readdirOpts = { withFileTypes: true };

function sync(dir, options = {}) {
  const paths = [];
  const dirs = [dir];
  var i = 0;
  var currentDir;
  for (; i < dirs.length; ++i) {
    currentDir = dirs[i];
    if (options.includeDirs) paths[paths.length] = currentDir;
    const dirents = fs.readdirSync(currentDir, readdirOpts);
    dirents.forEach(function(dirent) {
      recurse(dirent, currentDir, paths, options, dirs);
    });
    if (--options.currentDepth < 0) return paths;
  }
  return paths;
}

function async(dir, options = {}) {
  return new Promise(function(resolve, reject) {
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
        fs.readdir(dir, readdirOpts, function(_, dirents) {
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
  let fullPath = `${dir}${sep}${dirName}`;

  const isDirectory = dirent.isDirectory
    ? dirent.isDirectory()
    : fs.lstatSync(fullPath).isDirectory();
  if (isDirectory) {
    if (options.isExcludedDir && options.isExcludedDir(dirName)) return;
    dirs[dirs.length] = fullPath;
    return;
  }
  if (options.excludeBasePath) fullPath = dirName;
  if (!options.searchFn || options.searchFn(fullPath))
    paths[paths.length] = fullPath;
}

module.exports = {
  sync,
  async
};
