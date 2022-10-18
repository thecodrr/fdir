const { Dirent } = require("fs");
const { sep } = require("../compat/fs");
const { resolve: pathResolve } = require("path");
const { cleanPath } = require("../utils");
const fns = require("./fns");
const readdirOpts = { withFileTypes: true };

function Walker(options, walkerFunction, callback) {
  /* Dummy functions that will be filled later conditionally based on options */
  this.pushFile = fns.empty;
  this.pushDir = fns.empty;
  this.walkDir = walkerFunction;
  this.joinPath = fns.empty;
  this.groupFiles = fns.empty;
  this.callbackInvoker = fns.empty;
  this.getArray = fns.empty;
  this.symlinkResolver = fns.empty;

  this.options = options;

  /* We use a local state per walker instead of direct global variables
   * so that each walker execution is independent.
   */
  this.state = {
    // Perf: we explicitly tell the compiler to optimize for String arrays
    paths: [""].slice(0, 0),
    counts: { files: 0, dirs: 0 },
    options,
    callback,
  };

  /*
   * Perf: We conditionally change functions according to options. This gives a slight
   * performance boost. Since these functions are so small, they are automatically inlined
   * by the javascript engine so there's no function call overhead (in most cases).
   */
  this.buildFunctions();
}

/**
 * Process the given path using `path.resolve` & `path.normalize`
 * @param {string} path Path to normalize
 * @returns {string} Normalized path
 */
Walker.prototype.normalizePath = function normalizePath(path) {
  if (this.options.resolvePaths) path = pathResolve(path);
  if (this.options.normalizePath) path = cleanPath(path);
  const needsSeperator = path[path.length - 1] !== sep;
  return needsSeperator ? path + sep : path;
};

/**
 * Process dirents recursively (and also resolve symlinks if needed)
 * @param {Dirent[]} dirents
 * @param {string} directoryPath
 * @param {number} currentDepth
 */
Walker.prototype.processDirents = function processDirents(
  dirents,
  directoryPath,
  currentDepth
) {
  this.pushDir(directoryPath, this.state.paths, this.options.filters);

  const files = this.getArray(this.state.paths);
  for (var i = 0; i < dirents.length; ++i) {
    const dirent = dirents[i];

    if (dirent.isFile()) {
      const filename = this.joinPath(dirent.name, directoryPath);
      this.pushFile(filename, files, this.options.filters, this.state.counts);
    } else if (dirent.isDirectory()) {
      let path = fns.joinDirPath(dirent.name, directoryPath);

      if (this.options.excludeFn && this.options.excludeFn(dirent.name, path))
        continue;

      this.walkDir(this, path, currentDepth - 1, dirent.name);
    }
    // perf: we can avoid entering the condition block if .withSymlinks is not set
    // by using symlinkResolver !== fns.empty; this helps us avoid wasted allocations -
    // which are probably very minor but still.
    else if (dirent.isSymbolicLink() && this.symlinkResolver !== fns.empty) {
      let path = fns.joinDirPath(dirent.name, directoryPath);
      this.symlinkResolver(path, this.state, (stat, resolvedPath) => {
        if (stat.isFile()) {
          this.pushFile(
            resolvedPath,
            files,
            this.options.filters,
            this.state.counts
          );
        } else if (stat.isDirectory()) {
          resolvedPath = this.normalizePath(resolvedPath);
          if (
            this.options.excludeFn &&
            this.options.excludeFn(dirent.name, resolvedPath)
          )
            return;

          this.walkDir(this, resolvedPath, currentDepth - 1, dirent.name);
        }
      });
    }
  }

  this.groupFiles(this.state, directoryPath, files);
};

/**
 * Build all the different walker functions based on options
 */
Walker.prototype.buildFunctions = function buildFunctions() {
  const {
    filters,
    onlyCountsVar,
    includeBasePath,
    relativePath,
    includeDirs,
    groupVar,
    excludeFiles,
    resolveSymlinks,
    isSync,
    useRealPaths,
  } = this.options;

  // build function for joining paths
  this.joinPath = relativePath
    ? fns.joinPathWithRelativePath(relativePath)
    : includeBasePath
    ? fns.joinPathWithBasePath
    : fns.joinPath;

  // build groupFiles function for grouping files
  this.groupFiles = groupVar ? fns.groupFiles : fns.empty;
  this.getArray = groupVar ? fns.getArrayGroup : fns.getArray;

  this.buildPushFile(filters, onlyCountsVar, excludeFiles);

  this.buildPushDir(includeDirs, filters);

  this.buildSymlinkResolver(resolveSymlinks, useRealPaths, isSync);

  this.buildCallbackInvoker(onlyCountsVar, isSync);
};

Walker.prototype.buildPushDir = function buildPushDir(includeDirs, filters) {
  if (!includeDirs) return;

  if (filters.length) this.pushDir = fns.pushDirFilter;
  else this.pushDir = fns.pushDir;
};

Walker.prototype.buildPushFile = function buildPushFile(
  filters,
  onlyCountsVar,
  excludeFiles
) {
  if (excludeFiles) return;

  if (filters.length) {
    this.pushFile = onlyCountsVar
      ? fns.pushFileFilterAndCount
      : fns.pushFileFilter;
  } else if (onlyCountsVar) {
    this.pushFile = fns.pushFileCount;
  } else {
    this.pushFile = fns.pushFile;
  }
};

Walker.prototype.buildCallbackInvoker = function buildCallbackInvoker(
  onlyCountsVar,
  isSync
) {
  if (onlyCountsVar) {
    this.callbackInvoker = isSync
      ? fns.callbackInvokerOnlyCountsSync
      : fns.callbackInvokerOnlyCountsAsync;
  } else {
    this.callbackInvoker = isSync
      ? fns.callbackInvokerDefaultSync
      : fns.callbackInvokerDefaultAsync;
  }
};

/**
 *
 */
Walker.prototype.buildSymlinkResolver = function buildSymlinkResolver(
  resolveSymlinks,
  useRealPaths,
  isSync
) {
  if (!resolveSymlinks) return;

  this.symlinkResolver = isSync
    ? useRealPaths
      ? fns.resolveSymlinksWithRealPathsSync
      : fns.resolveSymlinksSync
    : useRealPaths
    ? fns.resolveSymlinksWithRealPathsAsync
    : fns.resolveSymlinksAsync;
};

module.exports = { Walker, readdirOpts };
