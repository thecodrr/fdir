const APIBuilder = require("./apiBuilder");

function Builder() {
  this.options = {
    includeBasePath: false,
    includeDirs: false,
    normalizePath: false,
    maxDepth: Infinity,
    resolvePaths: false,
    supressErrors: true,
    group: false,
    onlyCounts: false,
    filter: undefined,
    exclude: undefined,
  };
}

Builder.prototype.crawl = function(path) {
  return new APIBuilder(path, this.options);
};

Builder.prototype.withBasePath = function() {
  this.options.includeBasePath = true;
  return this;
};

Builder.prototype.withDirs = function() {
  this.options.includeDirs = true;
  return this;
};

Builder.prototype.withMaxDepth = function(depth) {
  this.options.maxDepth = depth;
  return this;
};

Builder.prototype.withFullPaths = function() {
  this.options.resolvePaths = true;
  this.options.includeBasePath = true;
  return this;
};

Builder.prototype.withErrors = function() {
  this.options.supressErrors = false;
  return this;
};

Builder.prototype.group = function() {
  this.options.group = true;
  return this;
};

Builder.prototype.normalize = function() {
  this.options.normalizePath = true;
  return this;
};

Builder.prototype.filter = function(filterFn) {
  this.options.filter = filterFn;
  return this;
};

Builder.prototype.exclude = function(excludeFn) {
  this.options.exclude = excludeFn;
  return this;
};

Builder.prototype.onlyCounts = function() {
  this.options.onlyCounts = true;
  return this;
};

module.exports = Builder;
