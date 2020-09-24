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

🔥 **All Node Versions Supported:** Unlike other similar libraries that have dropped support for Node versions < 10, `fdir` supports all versions >= 6.

🖮 **Hackable:** Extending `fdir` is extremely simple now that the new Builder API is here. Feel free to experiment around.

_\* `picomatch` must be installed manually by the user to support globbing._

## Support

> Do you like this project? **[Support me by donating](https://ko-fi.com/thecodrr)**, creating an issue, becoming a stargazer, or opening a pull request. Thanks.

## Status

This project is **not dead**. In terms of performance, I don't think there is anything more to be done. This is as fast a NodeJS Directory Crawler as you can get. I could be wrong though.

**What's next:**
1. There is still no Async Iterator API (contributions welcome).
2. We need to discuss whether its feasible (or even sensible) to have event emitters in different parts of the crawling process.
3. Make globbing pluggable
4. Finalize and freeze the API
5. Improve documentation (maybe we can make a proper documentation website?)

Contributions are welcome in all these.

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

```js
const { fdir } = require("fdir");

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

I have written [in-depth documentation here](https://github.com/thecodrr/fdir/blob/master/documentation.md).

## 📊 Benchmarks:

**Specs:**

- CPU: Intel i7 7th Generation (7700HQ)
- RAM: 16 GB
- Storage: 256 GB SSD
- OS: Manjaro Linux
- Directory Size: < 2k files

**Notes:**

- Some people asked that I benchmark `no-op` (without options) version of `fdir`. 
    - I did and found no performance difference. The results were identical. (I didn't include it here as it wasn't anything special.)
- Some other people were doubtful about the authenticity of these results due to _frequency scaling_, _process overload_, _disk warmup_, etc. 
    - So I have updated the benchmark with new results that should resolve all those doubts. Here's the process I followed:
    - Hard shutdown the laptop (a couple of times just to be sure) to clear disk, ram cache etc.
    - Login directly to a TTY (avoiding any unnecessary process from starting).
    - Disable CPU Scaling using
      ```sh
      $ sudo cpupower frequency-set --governor performance
      ```
    - Run the benchmark

### The Fastest Globber

_Last updated: May 13, 2020 (fdir v3.3.0)_

```sh
$ yarn bench:glob
```

> glob pattern used: `**.js` & `**/**.js`

#### Node v13.13.0

|                              Synchronous                              |                              Asynchronous                              |
| :-------------------------------------------------------------------: | :--------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/glob-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/glob-async.png) |

### The Fastest Directory Crawler

_Last updated: May 10, 2020 (fdir v3.0.0)_

```sh
$ yarn bench
```

#### Node v14.2.0:

|                               Synchronous                               |                               Asynchronous                               |
| :---------------------------------------------------------------------: | :----------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-async.png) |

#### Node v8.7.0:

_Older versions of fdir (1.x & 2.x) used synchronous `lstat` call (`lstatSync`) in the asynchronous API to acheive speed on Node < 10. This has been fixed in fdir 3.0.0._

|                              Synchronous                               |                                                                         |
| :--------------------------------------------------------------------: | :---------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-async.png) |

## 🦮 LICENSE

Copyright &copy; 2020 Abdullah Atta under MIT. [Read full text here.](https://github.com/thecodrr/fdir/raw/master/LICENSE)
