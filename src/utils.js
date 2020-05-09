const { sep, normalize } = require("path");

function cleanPath(dirPath) {
  let normalized = normalize(dirPath);

  // to account for / path
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep)
    normalized = normalized.substring(0, normalized.length - 1);
  return normalized;
}

function promisify(fn) {
  return function(dir, options) {
    return new Promise((resolve, reject) => {
      fn(dir, options, (err, files) => {
        if (err) return reject(err);
        resolve(files);
      });
    });
  };
}

module.exports = { cleanPath, promisify };
