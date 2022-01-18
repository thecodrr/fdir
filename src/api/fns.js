const { sep } = require("../compat/fs");
const fs = require("fs");

module.exports.getArray = function(paths) {
  return paths;
};

module.exports.getArrayGroup = function() {
  return [""].slice(0, 0);
};

module.exports.pushFileFilterAndCount = function(
  filename,
  _paths,
  filters,
  counts
) {
  if (filters.every((filter) => filter(filename, false))) counts.files++;
};

module.exports.pushFileFilter = function(filename, paths, filters) {
  if (filters.every((filter) => filter(filename, false))) paths.push(filename);
};

module.exports.pushFileCount = function(_filename, _paths, _filters, counts) {
  counts.files++;
};

module.exports.pushFile = function(filename, paths) {
  paths.push(filename);
};

module.exports.pushDir = function(dirPath, paths) {
  paths.push(dirPath);
};

module.exports.pushDirFilter = function(dirPath, paths, filters) {
  if (filters.every((filter) => filter(dirPath, true))) {
    paths.push(dirPath);
  }
};

module.exports.joinPathWithBasePath = function(filename, dir) {
  return dir + filename;
};

module.exports.joinPathWithRelativePath = function(relativePath) {
  relativePath += relativePath[relativePath.length - 1] === sep ? "" : sep;
  return function(filename, dir) {
    return dir.substring(relativePath.length) + filename;
  };
};

module.exports.joinPath = function(filename) {
  return filename;
};

module.exports.joinDirPath = function(filename, dir) {
  return dir + filename + sep;
};

module.exports.groupFiles = function(state, dir, files) {
  state.paths[dir] = files;
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
      state.queue.dequeue(state.options.suppressErrors ? null : error, state);
      return;
    }

    fs.lstat(resolvedPath, (error, stat) => {
      if (error) {
        state.queue.dequeue(state.options.suppressErrors ? null : error, state);
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
