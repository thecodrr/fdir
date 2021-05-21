const { readdir } = require("../compat/fs");
const Queue = require("./queue");
const { Walker, readdirOpts } = require("./walker");

/**
 * This is basically a `promisify` around the callback function.
 * @param {string} directoryPath Directory path to start walking from
 * @param {Object} options The options to configure the Walker
 * @returns {Promise} Promise that resolves to Output
 */
function promise(directoryPath, options) {
  return new Promise((resolve, reject) => {
    callback(directoryPath, options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
}

/**
 * Register a Walker and start walking asynchronously until we reach
 * the end (or maxDepth); then call the callback function and exit.
 * @param {string} directoryPath Directory path to start walking from
 * @param {Object} options The options to configure the Walker
 * @param {(error: Object, output: Object) => void} callback
 */
function callback(directoryPath, options, callback) {
  let walker = new Walker(options, callback);
  walker.registerWalker(walkDirectory);
  walker.state.queue = new Queue(walker.callbackInvoker);

  const root = walker.normalizePath(directoryPath);
  walker.walk(walker, root, options.maxDepth);
}

/**
 * Walk a directory asynchronously. This function is called internally
 * by the Walker whenever it encounters a sub directory.
 *
 * Since this is async, we use a custom queue system to track all concurrent
 * fs.readdir calls. Once the queue counter hits 0, we call the callback and exit.
 * @param {Walker} walker The core Walker that controls the whole walking process (we don't use `this` to keep things explicit)
 * @param {string} directoryPath Path to the directory
 * @param {number} currentDepth The depth walker is at currently (value starts from options.maxDepth and decreases every time a sub directory is encountered)
 * @returns
 */
function walkDirectory(walker, directoryPath, currentDepth) {
  const { state } = walker;

  state.queue.queue();

  if (currentDepth < 0) {
    state.queue.dequeue(null, state);
    return;
  }

  // Perf: Node >= 10 introduced withFileTypes that helps us
  // skip an extra fs.stat call.
  // Howver, since this API is not availble in Node < 10, I had to create
  // a compatibility layer to support both variants.
  readdir(directoryPath, readdirOpts, function(error, dirents) {
    if (error) {
      state.queue.dequeue(error, state);
      return;
    }

    walker.processDirents(dirents, directoryPath, currentDepth);
    state.queue.dequeue(null, state);
  });
}

module.exports = { promise, callback };
