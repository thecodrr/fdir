const { readdir } = require("../compat/fs");
const { makeWalkerFunctions, readdirOpts } = require("./shared");

function promise(dir, options) {
  return new Promise((resolve, reject) => {
    callback(dir, options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
}

function callback(dirPath, options, callback) {
  const { init, walkSingleDir } = makeWalkerFunctions();

  const { state, callbackInvoker, dir } = init(dirPath, options, callback);

  function walk(state, dir, currentDepth, callback) {
    if (currentDepth < 0) {
      --state.queue;
      return;
    }
    readdir(dir, readdirOpts, function(error, dirents) {
      if (error) {
        --state.queue;
        callback(error, state);
        return;
      }
  
      walkSingleDir(walk, state, dir, dirents, currentDepth, callback);
      if (--state.queue < 0) callback(null, state);
    });
  }

  walk(state, dir, options.maxDepth, callbackInvoker);
}

module.exports = { promise, callback };
