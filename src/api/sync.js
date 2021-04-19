const { readdirSync } = require("../compat/fs");
const { Walker, readdirOpts } = require("./walker");

// For sync usage, we can reuse the same walker functions, because
// there will not be concurrent calls overwriting the 'built functions'
// in the middle of everything.
// const { init, walkSingleDir } = makeWalkerFunctions();

function sync(rootDirectory, options) {
  options.isSync = true;

  let walker = new Walker(options);
  walker.registerWalker(walkDirectory);

  const root = walker.normalizePath(rootDirectory);
  walker.walk(walker, root, options.maxDepth);

  return walker.callbackInvoker(walker.state);
}

/**
 *
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
    walker.processDirents(directoryPath, dirents, currentDepth);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
}

module.exports = sync;
