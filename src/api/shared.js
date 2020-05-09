const { sep, resolve: pathResolve } = require("path");
const { cleanPath } = require("../utils");
const readdirOpts = { withFileTypes: true };

function init(dir, options, isSync) {
  if (options.resolvePaths) dir = pathResolve(dir);
  dir = cleanPath(dir);

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

/* Dummies that will be filled later conditionally based on options */
/* istanbul ignore next */
function pushFile() {}
/* istanbul ignore next */
function pushDir() {}
/* istanbul ignore next */
function walkDir() {}
/* istanbul ignore next */
function joinPath() {}
/* istanbul ignore next */
function groupFiles() {}
/* istanbul ignore next */
function callbackInvoker() {}

function buildFunctions(options, isSync) {
  const {
    filter,
    onlyCounts,
    includeBasePath,
    includeDirs,
    group,
    exclude,
    supressErrors,
  } = options;

  // build function for adding paths to array
  if (filter && onlyCounts) {
    pushFile = function(filename, files, dir, state) {
      if (filter(dir, filename)) state.counts.files++;
    };
  } else if (filter) {
    pushFile = function(filename, files, dir) {
      if (filter(dir, filename)) files.push(filename);
    };
  } else if (onlyCounts) {
    pushFile = function(filename, files, dir, state) {
      state.counts.files++;
    };
  } else {
    pushFile = function(filename, files) {
      files.push(filename);
    };
  }

  if (includeDirs) {
    pushDir = function(dirPath, paths) {
      paths.push(dirPath);
    };
  } else {
    pushDir = function() {};
  }

  // build function for joining paths
  if (includeBasePath) {
    joinPath = function(filename, dir) {
      return `${dir}${sep}${filename}`;
    };
  } else {
    joinPath = function(filename) {
      return filename;
    };
  }

  // build recursive walk directory function

  if (exclude) {
    walkDir = function(walk, state, path, currentDepth, callback, ...args) {
      if (!exclude(path)) {
        state.queue++;
        state.counts.dirs++;
        walk(state, path, currentDepth, callback, ...args);
      }
    };
  } else {
    walkDir = function(walk, state, path, currentDepth, callback, ...args) {
      state.queue++;
      state.counts.dirs++;
      walk(state, path, currentDepth, callback, ...args);
    };
  }

  // build groupFiles function for grouping files
  if (group) {
    groupFiles = function(dir, files, state) {
      state.counts.files += files.length;
      state.paths.push({ dir, files });
    };
  } else {
    groupFiles = function() {};
  }

  // build callback invoker

  if (isSync) {
    if (group) {
      callbackInvoker = function(state) {
        return { paths: state.paths, ...state.counts };
      };
    } else if (onlyCounts) {
      callbackInvoker = function(state) {
        return state.counts;
      };
    } else {
      callbackInvoker = function(state) {
        return state.paths;
      };
    }
  } else {
    if (group) {
      callbackInvoker = function(err, state, callback) {
        report(err, callback, state.paths, supressErrors);
      };
    } else if (onlyCounts) {
      callbackInvoker = function(err, state, callback) {
        report(err, callback, state.counts, supressErrors);
      };
    } else {
      callbackInvoker = function(err, state, callback) {
        report(err, callback, state.paths, supressErrors);
      };
    }
  }
}

function report(err, callback, output, supressErrors) {
  if (err) {
    if (!supressErrors) callback(err, null);
    return;
  }
  callback(null, output);
}

module.exports = { buildFunctions, init, walkSingleDir, readdirOpts };
