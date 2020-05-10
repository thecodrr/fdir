const fdir = require("./index");

new fdir()
  .withBasePath()
  .glob("./**/*.js")
  .crawl("node_modules")
  .withPromise()
  .then(console.log);
