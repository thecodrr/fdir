<p align="center">
<img src="https://github.com/thecodrr/fdir/raw/master/assets/logo.png" width="350"/>

<h1 align="center">The Fastest Directory Crawler for NodeJS</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/fdir"><img src="https://img.shields.io/npm/v/fdir?style=for-the-badge"/></a>
  <a href="https://www.npmjs.com/package/fdir"><img src="https://img.shields.io/npm/dt/fdir?style=for-the-badge"/></a>
  <a href="https://codeclimate.com/github/thecodrr/fdir/maintainability"><img src="https://img.shields.io/codeclimate/maintainability-percentage/thecodrr/fdir?style=for-the-badge"/></a>
  <a href="https://coveralls.io/github/thecodrr/fdir?branch=master"><img src="https://img.shields.io/coveralls/github/thecodrr/fdir?style=for-the-badge"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/thecodrr/fdir?style=for-the-badge"/></a>
</p>
</p>

⚡ **Extremely Fast:** Nothing beats `fdir` in speed. It can easily crawl a directory containing **10k files in about 13ms.**

💡 **Stupidly Easy:** `fdir` only has 2 functions; `sync` and `async` for crawling the file system synchronously or asynchronously.

🤖 **Zero Dependencies:** `fdir` uses pure NodeJS `fs` & `path` namespaces. Nothing else is ever touched.

🕺 **Astonishingly Small:** Only 2KB in size. Can be used virtually anywhere.

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
- Directory Size: 7386 files

**Notes:**

- Some people asked that I benchmark `no-op` (without options) version of `fdir`. I did and found no performance difference. The results were identical. (I didn't include it here as it wasn't anything special.)

### Node v13.11.0:

|                        Synchronous (7386 files)                         |                        Asynchronous (7386 files)                         |
| :---------------------------------------------------------------------: | :----------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node13-async.png) |

### Node v8.3.0:

**Note: As latest version of `rrdir` doesn't support Node < 8, I had to use version 2.0.0. Everything else is fully updated.**

|                        Synchronous (7386 files)                        |                        Asynchronous (7386 files)                        |
| :--------------------------------------------------------------------: | :---------------------------------------------------------------------: |
| ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-sync.png) | ![](https://github.com/thecodrr/fdir/raw/master/assets/node8-async.png) |

## 🚒 API:

`fdir` is very small so there's not much to the API.

### `fdir.sync(string, Options): String[]`

This is often the fastest way to get files. However, it will block the main "thread" so use it with caution with large directories.

### `fdir.async(string, Options): Promise<String[]>`

Not always the fastest but works without blocking the street, so that's a plus.

### `Options`

Ah, the options. Not many of them. At least not as many as I'd hoped for.

#### `includeDirs: boolean`

Whether to include directories in the array returned.

`default: false`

#### `includeBasePath: boolean`

Whether to include the base path for each file.

`default: true`

#### `searchFn: Function`

Use this to filter out files.

**Example:**

```js
fdir.sync("node_modules", {
  searchFn: path => path.includes(".git")
});
```

`default: undefined`

#### `maxDepth: number`

The max number of levels `fdir` should crawl before stopping. **The lower the faster.**

`default: undefined (i.e. infinity)`

#### `isExcludedDir: Function`

A list of directories to exclude.

> **Note: `fdir` expects an **Object** not an array.**

**Example:**

```js
const isExcludedDir = path => path.includes(".bin");
fdir.sync("node_modules", { isExcludedDir });
```

`default: undefined`

And that's it.

## ⁉️ FAQs:

**1. I looked at the code and there's nothing special. How is it so damn fast then?**

Well, that's the whole point. `fdir` exists to prove to the "young" generation that you don't need to use special constructs or special methods to gain speed. Just a bit of patience and brains.

**2. Why create this? What's the point?**

I know you don't give a shit. Fine. There's no point behind this. It's "just for fun". No, wait. Actually, I created this, first of all, for me. I needed fast directory access in another app of mine, so `fdir` came into being.

**3. Why are all the other libraries so slow?**

Because they did not spend enough time optimizing it. Most developers give readability and cool code more importance than actual performance and usability. I have seen a library claiming to be the fastest by inverting the benchmarks. Literally. Gave me quite the scare until I went and fixed the benchmark. It was actually one of the slowest. :O

**4. How long did it take you to create this?**

Ummm. Maybe 18 hours? Make it a day.

**5. Are you looking for a job?**

Am I? Well, are you offering a job? If yes, I am interested. :D

**6. Why should I give a shit?**

You shouldn't. But here's my email in case you do: **thecodrr[at]protonmail.com**. Don't worry, I don't bite.

## ℹ️ Support

Would love if you throw a coffee [over here](https://paypal.me/cupertino). Or just be, you know, polite and give me a star? Maybe even follow me?

## 🦮 LICENSE

Copyright (c) 2020 Abdullah Atta under MIT. [Read full text here.](https://github.com/thecodrr/fdir/raw/master/LICENSE)
