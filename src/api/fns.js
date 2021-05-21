const { sep } = require("path");
const fs = require("fs");

module.exports.getArray = function(state) {
  return state.paths;
};

module.exports.getArrayGroup = function() {
  return [""].slice(0, 0);
};

module.exports.pushFileFilterAndCount = function(walker, filename) {
  if (walker.options.filters.every((filter) => filter(filename, false)))
    module.exports.pushFileCount(walker);
};

module.exports.pushFileFilter = function(walker, filename, files) {
  if (walker.options.filters.every((filter) => filter(filename, false)))
    files.push(filename);
};

module.exports.pushFileCount = function(walker) {
  walker.state.counts.files++;
};
module.exports.pushFile = function(_walker, filename, files) {
  files.push(filename);
};

module.exports.pushDir = function(_walker, dirPath, paths) {
  paths.push(dirPath);
};

module.exports.pushDirFilter = function(walker, dirPath, paths) {
  if (walker.options.filters.every((filter) => filter(dirPath, true))) {
    paths.push(dirPath);
  }
};

module.exports.joinPathWithBasePath = function(filename, dir) {
  return `${dir}${dir.endsWith(sep) ? "" : sep}${filename}`;
};
module.exports.joinPath = function(filename) {
  return filename;
};

module.exports.walkDirExclude = function(
  walker,
  path,
  directoryName,
  currentDepth
) {
  if (!walker.options.excludeFn(directoryName, path)) {
    module.exports.walkDir(walker, path, directoryName, currentDepth);
  }
};

module.exports.walkDir = function(walker, path, _directoryName, currentDepth) {
  walker.state.counts.dirs++;
  walker.walk(walker, path, currentDepth);
};

module.exports.groupFiles = function(dir, files, state) {
  state.counts.files += files.length;
  state.paths.push({ dir, files });
};
module.exports.empty = function() {};

module.exports.callbackInvokerOnlyCountsSync = function(state) {
  return state.counts;
};
module.exports.callbackInvokerDefaultSync = function(state) {
  return state.paths;
};

module.exports.callbackInvokerOnlyCountsAsync = callbackInvokerBuilder(
  "counts"
);
module.exports.callbackInvokerDefaultAsync = callbackInvokerBuilder("paths");

function report(err, callback, output, suppressErrors) {
  if (err && !suppressErrors) callback(err, null);
  else callback(null, output);
}

function callbackInvokerBuilder(output) {
  return function(err, state) {
    report(err, state.callback, state[output], state.options.suppressErrors);
  };
}

module.exports.resolveSymlinksAsync = function(path, state, callback) {
  state.queue.queue();

  fs.realpath(path, (error, resolvedPath) => {
    if (error) {
      state.queue.dequeue(error, state);
      return;
    }

    fs.lstat(resolvedPath, (error, stat) => {
      if (error) {
        state.queue.dequeue(error, state);
        return;
      }

      callback(stat, resolvedPath);

      state.queue.dequeue(null, state);
    });
  });
};

module.exports.resolveSymlinksSync = function(path, _state, callback) {
  const resolvedPath = fs.realpathSync(path);
  const stat = fs.lstatSync(resolvedPath);
  callback(stat, resolvedPath);
};
