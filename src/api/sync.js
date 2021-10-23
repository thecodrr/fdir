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

  let walker = new Walker(options, walkDirectory);

  const root = walker.normalizePath(directoryPath);
  walker.walkDir(walker, root, options.maxDepth);

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
  state.counts.dirs++;

  let dirents = [];
  try {
    dirents = readdirSync(directoryPath, readdirOpts);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
  walker.processDirents(dirents, directoryPath, currentDepth);
}

module.exports = sync;
