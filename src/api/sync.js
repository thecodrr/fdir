const { readdirSync } = require("../compat/fs");
const { init, walkSingleDir, readdirOpts } = require("./shared");

function sync(dirPath, options) {
  if (!dirPath) throw new Error("No path provided.");

  const { state, callbackInvoker, dir } = init(dirPath, options, true);
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
    if (!state.options.supressErrors) throw e;
    return;
  }
  return;
}

module.exports = sync;
