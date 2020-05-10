const { sep, resolve: pathResolve } = require("path");
const { cleanPath } = require("../utils");
const fns = require("./fns");
const readdirOpts = { withFileTypes: true };

function init(dir, options, isSync) {
  if (options.resolvePaths) dir = pathResolve(dir);
  if (options.normalizePath) dir = cleanPath(dir);

  /* We use a local state object instead of direct global variables so that each function
   * execution is independent of each other.
   */
  const state = {
    paths: [],
    queue: 0,
    counts: { files: 0, dirs: 0 },
    options,
  };

  /*
   * Perf: We conditionally change functions according to options. This gives a slight
   * performance boost. Since these functions are so small, they are automatically inlined
   * by the engine so there's no function call overhead (in most cases).
   */
  buildFunctions(options, isSync);

  return { state, callbackInvoker, dir };
}

function walkSingleDir(
  walk,
  state,
  dir,
  dirents,
  currentDepth,
  callback,
  ...args
) {
  pushDir(dir, state.paths);
  // in cases where we have / as path
  if (dir === sep) dir = "";

  const files = state.options.group ? [] : state.paths;

  for (var i = 0; i < dirents.length; ++i) {
    const dirent = dirents[i];

    if (dirent.isFile()) {
      const filename = joinPath(dirent.name, dir);
      pushFile(filename, files, dir, state);
    } else if (dirent.isDirectory()) {
      let dirPath = `${dir}${sep}${dirent.name}`;
      walkDir(walk, state, dirPath, currentDepth - 1, callback, ...args);
    }
  }

  groupFiles(dir, files, state);
}

function buildFunctions(options, isSync) {
  const {
    filter,
    onlyCounts,
    includeBasePath,
    includeDirs,
    group,
    exclude,
  } = options;

  // build function for adding paths to array
  if (filter && onlyCounts) {
    pushFile = fns.pushFileFilterAndCount(filter);
  } else if (filter) {
    pushFile = fns.pushFileFilter(filter);
  } else if (onlyCounts) {
    pushFile = fns.pushFileCount;
  } else {
    pushFile = fns.pushFile;
  }

  if (includeDirs) {
    pushDir = fns.pushDir;
  } else {
    pushDir = fns.empty;
  }

  // build function for joining paths
  if (includeBasePath) {
    joinPath = fns.joinPathWithBasePath;
  } else {
    joinPath = fns.joinPath;
  }

  // build recursive walk directory function

  if (exclude) {
    walkDir = fns.walkDirExclude(exclude);
  } else {
    walkDir = fns.walkDir;
  }

  // build groupFiles function for grouping files
  if (group) {
    groupFiles = fns.groupFiles;
  } else {
    groupFiles = fns.empty;
  }

  // build callback invoker

  if (isSync) {
    if (onlyCounts) {
      callbackInvoker = fns.callbackInvokerOnlyCountsSync;
    } else {
      callbackInvoker = fns.callbackInvokerDefaultSync;
    }
  } else {
    if (onlyCounts) {
      callbackInvoker = fns.callbackInvokerOnlyCountsAsync;
    } else {
      callbackInvoker = fns.callbackInvokerDefaultAsync;
    }
  }
}

module.exports = { buildFunctions, init, walkSingleDir, readdirOpts };

/* Dummies that will be filled later conditionally based on options */
var pushFile = fns.empty;
var pushDir = fns.empty;
var walkDir = fns.empty;
var joinPath = fns.empty;
var groupFiles = fns.empty;
var callbackInvoker = fns.empty;
