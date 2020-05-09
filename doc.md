# Documentation

## Introduction

fdir v3.0 closely follows builder pattern to make an instance of the crawler fluently. So instead of doing:

```js
fdir.sync("path/to/dir", {
  includeBasePath: true,
});
```

You will simply do:

```js
new fdir()
  .withBasePath()
  .crawl("path/to/dir")
  .sync();
```

How cool is that?

## Installation

Make sure you have Node (any version) installed with npm/yarn.

Using `yarn`:

```sh
$ yarn add fdir
```

Using `npm`:

```sh
$ npm install fdir
```

You will also need to import fdir at the top of your file, like this:

**ES5 Require**

```js
const fdir = require("fdir").default;
```

**ES6 Import**

```js
import fdir from "fdir";
```

## Getting Started

### Creating a new Crawler

```js
const crawler = new fdir();
```

### Crawling a Directory

```js
const files = crawler.crawl("/path/to/dir").sync();
```

Easy, peasy!

## Crawler Options

The crawler options are in the form of methods. Each method returns the current instance of the crawler to enable fluency.

**Example:**

```js
const crawler = new fdir()
  .withBasePath()
  .withDirs()
  .withMaxDepth(5);
```

### `withBasePath`

Use this to add the base path to each output path.

> _By default, fdir does not add the base path to the output. For example, if you crawl `node_modules`, the output will contain only the filenames._

**Usage**

```js
const crawler = new fdir().withBasePath();
```

### `withDirs`

Use this to also add the directories to the output.

> _For example, if you are crawling `node_modules`, the output will only contain the files ignoring the directories including `node_modules` itself._

**Usage**

```js
const crawler = new fdir().withDirs();
```

### `withMaxDepth(number)`

Use this to limit the maximum depth fdir will crawl to before stopping.

> _By default, fdir crawls recursively until the last directory._

**Usage**

```js
const crawler = new fdir().withMaxDepth(5);
```

### `withFullPaths`

Use this to get full absolute paths in the output.

> _By default, fdir returns filenames._

**Usage**

```js
const crawler = new fdir().withFullPaths();
```

### `withErrors`

Use this if you want to handle all errors manually.

> _By default, fdir handles and supresses all errors including permission, non-existent directory ones._

**Usage**

```js
const crawler = new fdir().withErrors();
```

### `onlyCounts`

Return only the number of files and directories. Might be a little faster.

**Usage**

```js
const crawler = new fdir().onlyCounts();
```

**Output**

Using this will affect the output structure. In place of a simple array of file paths you will get an object containing the counts of files and directories. For example:

```js
const { files, dirs } = new fdir().onlyCounts().sync();
```

### `group`

Group all files by directory.

> _This does not give a tree-like output._

**Usage**

```js
const crawler = new fdir().group();
```

**Output**

Using this will affect the output structure. In place of a simple array of `string` file paths you will get an array of `Group`:

```ts
type Group = { dir: string; files: string[] };
```

### `filter(Function)`

Applies a filter to all files and only adds those that satisfy it.

> _Currently, you can apply only one filter per crawler. This might change._

**Usage**

```js
// only get hidden files
const crawler = new fdir().filter((path) => path.startsWith("."));
```

### `exclude(Function)`

Applies an exclusion filter to all directories and only crawls those that do not satisfy the condition.

> _Currently, you can apply only one exclusion filter per crawler. This might change._

**Usage**

```js
// do not crawl into hidden directories
const crawler = new fdir().exclude((dir) => dir.startsWith("."));
```

### `crawl(string)`

Prepare the crawler. This should be called at then end after all the configuration has been done.

**Parameters**

- `dirPath: string` - The path of the directory to start crawling from

**Returns**

`APIBuilder`

**Usage**

```js
const crawler = new fdir().withBasePath().crawl("path/to/dir");
```

## `APIBuilder`

fdir currently includes 3 APIs (i.e. 3 ways of crawling a directory).

1. Asynchronous with `Promise`
2. Asynchronous with callback
3. Synchronous

> Stream API will be added soon.

### 1. `withPromise()`

Crawl the directory asynchronously using `Promise`.

**Usage**

```js
const files = await new fdir()
  .withBasePath()
  .withDirs()
  .crawl("/path/to/dir")
  .withPromise();
```

### 2. `withCallback(Function)`

Crawl the directory asynchronously using callback.

**Usage**

```js
new fdir()
  .withBasePath()
  .withDirs()
  .crawl("/path/to/dir")
  .withCallback((files) => {
    // do something with files here
  });
```

### 3. `sync()`

Crawl the directory synchronously.

**Usage**

```js
const files = new fdir()
  .withBasePath()
  .withDirs()
  .crawl("/path/to/dir")
  .sync();
```
