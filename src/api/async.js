const { readdir } = require("../compat/fs");
const Queue = require("./queue");
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
  state.queue = new Queue(callbackInvoker);

  // perf: we pass everything in arguments to avoid creating a closure
  walk(state, dir, options.maxDepth, walkSingleDir);
}

function walk(state, dir, currentDepth, walkSingleDir) {
  state.queue.queue();

  if (currentDepth < 0) {
    state.queue.dequeue(null, state);
    return;
  }

  readdir(dir, readdirOpts, function (error, dirents) {
    if (error) {
      state.queue.dequeue(error, state);
      return;
    }

    walkSingleDir(walk, state, dir, dirents, currentDepth);
    state.queue.dequeue(null, state);
  });
}

module.exports = { promise, callback };
