const fs = require("fs");
const { sep, resolve, normalize } = require("path");

const readdirOpts = { withFileTypes: true };

function sync(dir, options = {}) {
  if (options.resolvePaths) dir = resolve(dir);
  dir = cleanPath(dir);
  const paths = [],
    dirs = [dir],
    errors = [];
  for (var i = 0; i < dirs.length && !(--options.maxDepth < 0); ++i) {
    let currentDir = dirs[i];
    if (options.includeDirs) paths[paths.length] = currentDir;
    try {
      const dirents = fs.readdirSync(currentDir, readdirOpts);
      dirents.forEach(function(dirent) {
        recurse(dirent, currentDir, paths, options, dirs);
      });
    } catch (error) {
      if (!options.ignoreErrors) errors.push(error);
      continue;
    }
  }
  if (!options.ignoreErrors && errors.length) return { errors, paths };
  return paths;
}

function async(dir, options = {}) {
  return new Promise(function(pResolve, pReject) {
    if (options.resolvePaths) dir = resolve(dir);
    dir = cleanPath(dir);
    const dirs = [dir],
      errors = [],
      paths = [];
    let cursor = 0,
      readCount = 0,
      currentDepth = options.maxDepth;
    function walk() {
      let total = dirs.length;
      if (total === cursor) return resolveOrReject();
      for (; cursor < total; ++cursor) {
        if (--currentDepth < 0) return resolveOrReject();

        let dir = dirs[cursor];
        if (options.includeDirs) paths[paths.length] = dir;

        fs.readdir(dir, readdirOpts, function(err, dirents) {
          ++readCount;
          if (err) {
            if (!options.ignoreErrors) errors.push({ path: dir, error: err });
            return walk();
          }
          // in cases where we have / as path
          if (dir === sep) dir = "";
          for (var j = 0; j < dirents.length; ++j) {
            recurse(dirents[j], dir, paths, options, dirs);
          }
          if (readCount === total) walk();
        });
      }
    }
    walk();

    function resolveOrReject() {
      if (!options.ignoreErrors && errors.length)
        return pReject({ paths, errors });
      pResolve(paths);
    }
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
