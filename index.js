const fs = require("fs");
const { sep, resolve, normalize } = require("path");

const readdirOpts = { withFileTypes: true };

function sync(dir, options = {}) {
  if (options.resolvePaths) dir = resolve(dir);
  dir = cleanPath(dir);
  const paths = [],
    dirs = [dir];
  for (var i = 0; i < dirs.length && !(--options.maxDepth < 0); ++i) {
    let currentDir = dirs[i];
    if (options.includeDirs) paths[paths.length] = currentDir;
    try {
      const dirents = fs.readdirSync(currentDir, readdirOpts);
      // in cases where we have / as path
      if (currentDir === sep) currentDir = "";

      const params = { currentDir, paths, options, dirs };
      dirents.forEach(function(dirent) {
        params.dirent = dirent;
        recurse(params);
      });
    } catch (error) {
      if (!options.ignoreErrors) throw error;
      continue;
    }
  }
  return paths;
}

function async(dir, options = {}) {
  return new Promise(function(pResolve, pReject) {
    if (options.resolvePaths) dir = resolve(dir);
    dir = cleanPath(dir);
    const dirs = [dir],
      paths = [];
    let cursor = 0,
      readCount = 0,
      currentDepth = options.maxDepth;
    function walk() {
      let total = dirs.length;
      if (total === cursor) return pResolve(paths);
      for (; cursor < total; ++cursor) {
        if (--currentDepth < 0) return pResolve(paths);

        let currentDir = dirs[cursor];
        if (options.includeDirs) paths[paths.length] = currentDir;

        fs.readdir(currentDir, readdirOpts, function(error, dirents) {
          ++readCount;
          if (error) {
            if (!options.ignoreErrors) return pReject(error);
            /* istanbul ignore next */
            if (readCount === total) walk();
            return;
          }
          // in cases where we have / as path
          if (currentDir === sep) currentDir = "";

          const params = { currentDir, paths, options, dirs };
          for (var j = 0; j < dirents.length; ++j) {
            params.dirent = dirents[j];
            recurse(params);
          }

          if (readCount === total) walk();
        });
      }
    }
    walk();
  });
}

function recurse(params) {
  const { dirent, currentDir, paths, options, dirs } = params;
  // In node < 10, Dirent is not present. Instead we get string paths

  /* istanbul ignore next */
  const dirName = dirent.name || dirent;
  let fullPath = `${currentDir}${sep}${dirName}`;

  /* istanbul ignore next */
  const isDirectory = dirent.isDirectory
    ? dirent.isDirectory()
    : fs.lstatSync(fullPath).isDirectory();

  if (isDirectory) {
    if (!options.isExcludedDir || !options.isExcludedDir(fullPath))
      dirs[dirs.length] = fullPath;
    return;
  }

  if (options.excludeBasePath) fullPath = dirName;
  if (!options.searchFn || options.searchFn(fullPath))
    paths[paths.length] = fullPath;
}

function cleanPath(dirPath) {
  let normalized = normalize(dirPath);

  // to account for / path
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep)
    normalized = normalized.substring(0, normalized.length - 1);
  return normalized;
}

module.exports = {
  sync,
  async
};
