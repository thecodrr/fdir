const { readdirSync } = require("../compat/fs");
const { Walker, readdirOpts } = require("./walker");

/**
 * Register a Walker and start walking synchronously and return the result
 * when we reach the end (or maxDepth).
 * @param {string} directoryPath Directory path to start walking from
 * @param {Object} options The options to configure the Walker
 * @param {(error: Object, output: Object) => void} callback
 */
function sync(directoryPath, options) {
  options.isSync = true;

  let walker = new Walker(options);
  walker.registerWalker(walkDirectory);

  const root = walker.normalizePath(directoryPath);
  walker.walk(walker, root, options.maxDepth);

  return walker.callbackInvoker(walker.state);
}

/**
 * Walk a directory synchronously. This function is called internally
 * by the Walker whenever it encounters a sub directory.
 * @param {Walker} walker
 * @param {string} directoryPath
 * @param {number} currentDepth
 * @returns
 */
function walkDirectory(walker, directoryPath, currentDepth) {
  if (currentDepth < 0) {
    return;
  }
  const { state } = walker;
  try {
    const dirents = readdirSync(directoryPath, readdirOpts);
    walker.processDirents(dirents, directoryPath, currentDepth);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
}

module.exports = sync;
