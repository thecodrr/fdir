const { readdir } = require("../compat/fs");
const Queue = require("./queue");
const { Walker, readdirOpts } = require("./walker");

function promise(rootDirectory, options) {
  return new Promise((resolve, reject) => {
    callback(rootDirectory, options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
}

function callback(rootDirectory, options, callback) {
  let walker = new Walker(options, callback);
  walker.registerWalker(walkDirectory);
  walker.state.queue = new Queue(walker.callbackInvoker);

  const root = walker.normalizePath(rootDirectory);
  walker.walk(walker, root, options.maxDepth);
}

/**
 *
 * @param {Walker} walker
 * @param {string} directoryPath
 * @param {number} currentDepth
 * @returns
 */
function walkDirectory(walker, directoryPath, currentDepth) {
  const { state } = walker;

  state.queue.queue();

  if (currentDepth < 0) {
    state.queue.dequeue(null, state);
    return;
  }

  readdir(directoryPath, readdirOpts, function(error, dirents) {
    if (error) {
      state.queue.dequeue(error, state);
      return;
    }

    walker.processDirents(directoryPath, dirents, currentDepth);
    state.queue.dequeue(null, state);
  });
}

module.exports = { promise, callback };
