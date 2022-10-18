const APIBuilder = require("./apiBuilder");
var pm = null;
var globCache = null;
/* istanbul ignore next */
try {
  require.resolve("picomatch");
  pm = require("picomatch");
  globCache = {};
} catch (_e) {
  // do nothing
}

function Builder() {
  this.maxDepth = Infinity;
  this.suppressErrors = true;
  this.filters = [];
}

Builder.prototype.crawl = function(path) {
  this.relativePath = this.relativePath === true ? path : undefined;
  return new APIBuilder(path, this);
};

Builder.prototype.crawlWithOptions = function(path, options) {
  if (!options.maxDepth) options.maxDepth = Infinity;
  options.groupVar = options.group;
  options.onlyCountsVar = options.onlyCounts;
  options.excludeFn = options.exclude;
  options.filters = options.filters || [];
  options.relativePath = options.relativePaths ? path : undefined;
  options.useRealPaths = options.useRealPaths || true;

  if (options.excludeFiles) {
    options.includeDirs = true;
  }

  return new APIBuilder(path, options);
};

Builder.prototype.withBasePath = function() {
  this.includeBasePath = true;
  return this;
};

Builder.prototype.withRelativePaths = function() {
  this.relativePath = true;
  return this;
};

Builder.prototype.withDirs = function() {
  this.includeDirs = true;
  return this;
};

Builder.prototype.withMaxDepth = function(depth) {
  this.maxDepth = depth;
  return this;
};

Builder.prototype.withFullPaths = function() {
  this.resolvePaths = true;
  this.includeBasePath = true;
  return this;
};

Builder.prototype.withErrors = function() {
  this.suppressErrors = false;
  return this;
};

Builder.prototype.withSymlinks = function(resolvePaths = true) {
  this.resolveSymlinks = true;
  this.useRealPaths = resolvePaths;
  this.withFullPaths();
  return this;
};

Builder.prototype.group = function() {
  this.groupVar = true;
  return this;
};

Builder.prototype.normalize = function() {
  this.normalizePath = true;
  return this;
};

Builder.prototype.filter = function(filterFn) {
  this.filters.push(filterFn);
  return this;
};

Builder.prototype.onlyDirs = function() {
  this.excludeFiles = true;
  this.includeDirs = true;
  return this;
};

Builder.prototype.glob = function(...patterns) {
  /* istanbul ignore next */
  if (!pm) {
    throw new Error(
      `Please install picomatch: "npm i picomatch" to use glob matching.`
    );
  }
  var isMatch = globCache[patterns.join("\0")];
  if (!isMatch) {
    isMatch = pm(patterns, { dot: true });
    globCache[patterns.join("\0")] = isMatch;
  }
  this.filters.push((path) => isMatch(path));
  return this;
};

Builder.prototype.exclude = function(excludeFn) {
  this.excludeFn = excludeFn;
  return this;
};

Builder.prototype.onlyCounts = function() {
  this.onlyCountsVar = true;
  return this;
};

module.exports = Builder;
