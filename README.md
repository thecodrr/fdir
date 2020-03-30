<p align="center">
<img src="https://github.com/thecodrr/fdir/raw/master/assets/logo.png" width="350"/>

<h1 align="center">The Fastest Directory Crawler for NodeJS</h1>
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

⚡ **Extremely Fast:** Nothing similar (in the NodeJS world) beats `fdir` in speed. It can easily crawl a directory containing **1 million files in < 1 second.**

💡 **Stupidly Easy:** `fdir` only has 2 functions; `sync` and `async` for crawling the file system synchronously or asynchronously.

🤖 **Zero Dependencies:** `fdir` uses pure NodeJS `fs` & `path` namespaces. Nothing else is ever touched.

🕺 **Astonishingly Small:** < 1KB in size

🔥 **All Node Versions Supported:** `fdir` runs everywhere on all Node versions (within reason). And it is unsurprisingly fastest there too.

## Support

> Do you like this project? **[Support me by donating](https://ko-fi.com/thecodrr)**, creating an issue, becoming a stargazer or opening a pull request. Thanks.

## 🚄 Quickstart

You can install using `npm`:

```sh
$ npm i --save fdir
```

or Yarn:

```sh
$ yarn add fdir
```

It makes no difference to me.

```js
const fdir = require("fdir");

// get all files in a directory synchronously
const files = fdir.sync("path/to/dir");

// or asynchronously
fdir.async("path/to/dir").then(/*blah blah blah*/);
```

And that's it.

## 📊 Benchmarks:

```sh
$ yarn benchmark
```

**Specs:**

- Intel i7 7th Generation (7700HQ)
- 16 GB of RAM
- 256 GB SSD
- OS: Manjaro Linux
- Directory Size: 9847 files, 1620 folders

**Notes:**

- Some people asked that I benchmark `no-op` (without options) version of `fdir`. I did and found no performance difference. The results were identical. (I didn't include it here as it wasn't anything special.)
- Some other people were doubtful about the authenticity of these results due to _frequency scaling_, _process overload_, _disk warmup_ etc. So I have updated the benchmark with new results that should resolve all those doubts. Here's the process I followed:
  - Hard shutdown the laptop (a couple of times just to be sure) to clear disk, ram cache etc.
  - Login directly to a TTY (avoiding any unnecessary process from starting).
  - Run the benchmark
- Alright, I will say it as it is. I am not an expert at benchmarking so feel free to advise me as to the correct way of doing this.

### Node v13.11.0:

_Last updated: March 30, 2020 (fdir v2.1.0)_

|                               Synchronous                               |                               Asynchronous                               |
| :---------------------------------------------------------------------: | :----------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-async.png) |

### Node v8.3.0:

**Note: As latest version of `rrdir` doesn't support Node < 8, I had to use version 2.0.0. Everything else is fully updated.**

|                        Synchronous (7386 files)                        |                        Asynchronous (7386 files)                        |
| :--------------------------------------------------------------------: | :---------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-async.png) |

## 🚒 API:

### Asynchronous

```ts
fdir.async(directoryPath: string, options?: Options): Promise<String[]>
```

- **Returns:** A `Promise` containing an array of file paths

```js
const fdir = require("fdir");

const files = await fdir.async("node_modules", { ignoreErrors: true });

// ["file1", "file2" ,...., "fileN"]
```

### Synchronous

```ts
fdir.sync(directoryPath: string, options?: Options): String[]
```

- **Returns:** An array of all the files in `directoryPath`.

```js
const fdir = require("fdir");

const files = fdir.sync("node_modules", { ignoreErrors: true });

// ["file1", "file2" ,...., "fileN"]
```

#### `directoryPath`:

- **Required:** `true`
- **Type:** `string`

The path of the directory from where fdir should start.

#### `options`:

- **Required:** `false`
- **Type:** [`Options`](#options-1)

See [Options](#options-1) section.

### Options

#### `includeDirs`

- **Type:** `boolean`
- **Default:** `false`

Whether to include directories in the array returned.

#### `excludeBasePath`

- **Type:** `boolean`
- **Default:** `false`

Whether to exclude the base path for each file.

#### `searchFn`

- **Type:** `Function`
- **Default:** `undefined`

Use this to filter out specific files, apply a glob pattern etc.

**Example:**

```js
fdir.sync("node_modules", {
  searchFn: path => path.includes(".git")
});

// [".git/.config"]
```

#### `maxDepth`

- **Type:** `number`
- **Default:** `Infinity`

The max number of levels `fdir` should crawl before stopping. **The lower the faster.**

#### `isExcludedDir`

- **Type:** `boolean`
- **Default:** `Function`

Use this to exclude particular directories from being crawled.

**Example:**

```js
const isExcludedDir = path => path.includes(".bin");
fdir.sync("node_modules", { isExcludedDir });
```

#### `ignoreErrors`

- **Type:** `boolean`
- **Default:** `false`

Ignore/suppress all errors while traversing the file system. This will ignore every single error without exception, skipping the errored directories.

## ⁉️ FAQs:

**1. I looked at the code and there's nothing special. How is it so damn fast then?**

Well, that's the whole point. `fdir` exists to prove to the "young" generation that you don't need to use special constructs or special methods to gain speed. Just a bit of patience and brains.

**2. I found X library. I ran its benchmarks. It is faster than `fdir`!**

Um. Well thank you for embarassing me (just joking). Do tell me the name of this library though. I will try to optimize `fdir` and reclaim the first spot :smile:

**3. You are doing X and Y wrong! Do Z and it will improve performance!**

Yes. And I should probably do A, B & C too. The point is, did you run benchmarks with these suggestions? If you did and saw significant improvements, thank you. Now go open a PR :laugh:

**4. Why create this? What's the point?**

I know you don't care. Fine. There's no point behind this. It's "just for fun". No, wait. Actually, I created this, first of all, for me. I needed fast directory access in another app of mine, so `fdir` came into being.

**5. Why are all the other libraries so slow?**

Because they did not spend enough time optimizing it. Most developers give readability and cool code more importance than actual performance and usability. I have seen a library claiming to be the fastest by inverting the benchmarks. Literally. Gave me quite the scare until I went and fixed the benchmark. It was actually one of the slowest. :O

**6. How long did it take you to create this?**

Ummm. Maybe 18 hours? Make it a day.

## 🦮 LICENSE

Copyright (c) 2020 Abdullah Atta under MIT. [Read full text here.](https://github.com/thecodrr/fdir/raw/master/LICENSE)
