<p align="center">
<img src="https://github.com/thecodrr/fdir/raw/master/assets/fdir.gif" width="75%"/>

<h1 align="center">The Fastest Directory Crawler & Globber for NodeJS</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/fdir"><img src="https://img.shields.io/npm/v/fdir?style=for-the-badge"/></a>
  <a href="https://www.npmjs.com/package/fdir"><img src="https://img.shields.io/npm/dt/fdir?style=for-the-badge"/></a>
  <a href="https://codeclimate.com/github/thecodrr/fdir/maintainability"><img src="https://img.shields.io/codeclimate/maintainability-percentage/thecodrr/fdir?style=for-the-badge"/></a>
  <a href="https://coveralls.io/github/thecodrr/fdir?branch=master"><img src="https://img.shields.io/coveralls/github/thecodrr/fdir?style=for-the-badge"/></a>
  <a href="https://www.npmjs.com/package/fdir"><img src="https://img.shields.io/bundlephobia/minzip/fdir?style=for-the-badge"/></a>
  <a href="https://www.producthunt.com/posts/fdir-every-millisecond-matters"><img src="https://img.shields.io/badge/ProductHunt-Upvote-red?style=for-the-badge&logo=product-hunt"/></a>
  <a href="https://dev.to/thecodrr/how-i-wrote-the-fastest-directory-crawler-ever-3p9c"><img src="https://img.shields.io/badge/dev.to-Read%20Blog-black?style=for-the-badge&logo=dev.to"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/thecodrr/fdir?style=for-the-badge"/></a>
</p>
</p>

⚡ **The Fastest:** Nothing similar (in the NodeJS world) beats `fdir` in speed. It can easily crawl a directory containing **1 million files in < 1 second.**

💡 **Stupidly Easy:** `fdir` uses expressive Builder pattern to build the crawler increasing code readability.

🤖 **Zero Dependencies\*:** `fdir` only uses NodeJS `fs` & `path` modules.

🕺 **Astonishingly Small:** < 2KB in size gzipped & minified.

🖮 **Hackable:** Extending `fdir` is extremely simple now that the new Builder API is here. Feel free to experiment around.

_\* `picomatch` must be installed manually by the user to support globbing._

## Support

> Do you like this project? **[Support me by donating](https://ko-fi.com/thecodrr)**, creating an issue, becoming a stargazer, or opening a pull request. Thanks.

## 🚄 Quickstart

### Installation

You can install using `npm`:

```sh
$ npm i fdir
```

or Yarn:

```sh
$ yarn add fdir
```

### Usage

```ts
import { fdir } from "fdir";

// create the builder
const api = new fdir().withFullPaths().crawl("path/to/dir");

// get all files in a directory synchronously
const files = api.sync();

// or asynchronously
api.withPromise().then((files) => {
  // do something with the result here.
});
```

## Documentation:

_New docs will be added soon._

## 📊 Benchmarks:

_New benchmarks will be added soon._

## 🦮 LICENSE

Copyright &copy; 2022 Abdullah Atta under MIT. [Read full text here.](https://github.com/thecodrr/fdir/raw/master/LICENSE)
