const fs = require("fs");
const path = require("path");

function push(item) {
  this.push(item);
}

function sync(dir, options) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const paths = [];

  if (options.includeDirs) paths.push(dir);
  if (--options.maxDepth < 0) return paths;

  dirents.forEach(async dirent => {
    const res = `${dir}${path.sep}${dirent.name}`;
    if (dirent.isDirectory()) {
      if (options.excludedDirs && options.excludedDirs[dirent.name]) return;
      sync(res, options).forEach(push.bind(paths));
    } else {
      if (!options.includeBasePath) res = dirent.name;
      if (!options.searchFn || options.searchFn(res)) paths.push(res);
    }
  });
  return paths;
}

function async(dir, options) {
  return new Promise(resolve => {
    fs.readdir(dir, { withFileTypes: true }, (err, dirents) => {
      if (err) return resolve([]);
      const paths = [];
      var i = 0;
      var n = dirents.length;

      if (options.includeDirs) paths.push(dir);
      if (--options.maxDepth < 0) resolve(paths);

      dirents.forEach(async dirent => {
        const res = `${dir}${path.sep}${dirent.name}`;
        if (dirent.isDirectory()) {
          if (options.excludedDirs && options.excludedDirs[dirent.name]) return;
          (await async(res, options)).forEach(push.bind(paths));
        } else {
          if (!options.includeBasePath) res = dirent.name;
          if (!options.searchFn || options.searchFn(res)) paths.push(res);
        }
        if (++i >= n) resolve(paths);
      });
    });
  });
}

function fdir(options) {
  const defaultOptions = {
    includeDirs: false,
    includeBasePath: true,
    maxDepth: undefined,
    searchFn: undefined,
    resolvePaths: false,
    excludedDirs: undefined
  };
  options = !options ? defaultOptions : { ...defaultOptions, ...options };
  return {
    sync: dir => {
      if (options.resolvePaths) dir = path.resolve(dir);
      return sync(dir, options);
    },
    async: dir => {
      if (options.resolvePaths) dir = path.resolve(dir);
      return async(dir, options);
    }
  };
}

module.exports = fdir;
