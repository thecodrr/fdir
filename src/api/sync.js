const { readdirSync } = require("../compat/fs");
const { makeWalkerFunctions, readdirOpts } = require("./shared");

// For sync usage, we can reuse the same walker functions, because
// there will not be concurrent calls overwriting the 'built functions'
// in the middle of everything.
const { init, walkSingleDir } = makeWalkerFunctions();

function sync(dirPath, options) {
  const { state, callbackInvoker, dir } = init(dirPath, options, null, true);
  walk(state, dir, options.maxDepth);
  return callbackInvoker(state);
}

function walk(state, dir, currentDepth) {
  if (currentDepth < 0) {
    return;
  }
  try {
    const dirents = readdirSync(dir, readdirOpts);
    walkSingleDir(walk, state, dir, dirents, currentDepth);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
}

module.exports = sync;
