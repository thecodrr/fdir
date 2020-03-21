const fs = require("fs");
const { sep, resolve } = require("path");

const readdirOpts = { withFileTypes: true };

function sync(dir, options = {}) {
  if (options.resolvePaths) dir = resolve(dir);
  const paths = [];
  const dirs = [dir];
  for (var i = 0; i < dirs.length && !(--options.maxDepth < 0); ++i) {
    var currentDir = dirs[i];
    if (options.includeDirs) paths[paths.length] = currentDir;
    const dirents = fs.readdirSync(currentDir, readdirOpts);
    dirents.forEach(function(dirent) {
      recurse(dirent, currentDir, paths, options, dirs);
    });
  }
  return paths;
}

function async(dir, options = {}) {
  return new Promise(function(pResolve, pReject) {
    const paths = [];
    if (options.resolvePaths) dir = resolve(dir);
    const dirs = [dir];
    let cursor = 0;
    let readCount = 0;
    let currentDepth = options.maxDepth;
    function walk() {
      let total = dirs.length;
      for (; cursor < total; ++cursor) {
        if (--currentDepth < 0) {
          pResolve(paths);
          break;
        }
        const dir = dirs[cursor];
        if (options.includeDirs) paths[paths.length] = dir;
        fs.readdir(dir, readdirOpts, function(err, dirents) {
          if (err) return pReject(getError(err, dir));
          for (var j = 0; j < dirents.length; ++j) {
            recurse(dirents[j], dir, paths, options, dirs);
          }
          if (++readCount === total) {
            if (dirs.length === cursor) {
              pResolve(paths);
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

  /* istanbul ignore next */
  const dirName = dirent.name || dirent;
  let fullPath = `${dir}${sep}${dirName}`;

  /* istanbul ignore next */
  const isDirectory = dirent.isDirectory
    ? dirent.isDirectory()
    : fs.lstatSync(fullPath).isDirectory();

  if (isDirectory) {
    if (options.isExcludedDir && options.isExcludedDir(fullPath)) return;
    dirs[dirs.length] = fullPath;
    return;
  }
  if (options.excludeBasePath) fullPath = dirName;
  if (!options.searchFn || options.searchFn(fullPath))
    paths[paths.length] = fullPath;
}

function getError(error, path) {
  let message = "";
  switch (error.code) {
    case "EACCES":
      message = `You do not have permission to access "${path}".`;
      break;
    case "ENOENT":
      message = `"${path}" does not exist or an invalid path was provided. Are you sure this is a valid directory?`;
      break;
    case "ENOTDIR":
      message = `"${path}" is not a directory as expected. fdir only works with directories.`;
      break;
  }
  return {
    ...error,
    message: `${message}\nIf you think this is a bug, please open an issue at: https://github.com/thecodrr/fdir`
  };
}

module.exports = {
  sync,
  async
};
