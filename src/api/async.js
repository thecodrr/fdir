const { readdir } = require("../compat/fs");
const { init, walkSingleDir, readdirOpts } = require("./shared");

function promise(dir, options) {
  return new Promise((resolve, reject) => {
    callback(dir, options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
}

function callback(dirPath, options, callback) {
  const { state, callbackInvoker, dir } = init(dirPath, options, false);
  walk(state, dir, options.maxDepth, callbackInvoker, state, callback);
}

function walk(state, dir, currentDepth, callback, ...args) {
  if (currentDepth < 0) {
    --state.queue;
    return;
  }
  readdir(dir, readdirOpts, function(error, dirents) {
    if (error) {
      --state.queue;
      callback(error, ...args);
      return;
    }

    walkSingleDir(walk, state, dir, dirents, currentDepth, callback, ...args);
    if (--state.queue < 0) callback(null, ...args);
  });
}

module.exports = { promise, callback };
