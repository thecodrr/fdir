# Documentation

## Introduction

fdir > v3.0 closely follows builder pattern to make an instance of the crawler fluently. So instead of doing:

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
const { fdir } = require("fdir");
```

**ES6 Import**

```js
import { fdir } from "fdir";
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

The crawler options are in the form of methods. Each method returns the current instance of the crawler to enable fluency/method chaining.

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

### `withSymlinks({ resolvePaths: boolean })`

Use this to follow all symlinks recursively.

**Parameters:**

- `resolvePaths: boolean` — By default, `fdir` returns original paths to files irrespective of whether they are inside a symlinked directory or not. If you want the paths to be relative to the symlink, set this flag to `false`. (Default is `true`).

> NOTE: This will affect crawling performance.

**Usage**

```js
// to resolve all symlinked paths to their original path
const crawler = new fdir().withSymlinks({ resolvePaths: true });

// to disable path resolution
const crawler = new fdir().withSymlinks({ resolvePaths: false });
```

### `withMaxDepth(number)`

Use this to limit the maximum depth fdir will crawl to before stopping.

> _By default, fdir crawls recursively until the last directory._

**Usage**

```js
const crawler = new fdir().withMaxDepth(5);
```

### `withMaxFiles(number)`

Use this to limit the maximum number of files fdir will crawl to before stopping.

**Usage**

```js
const crawler = new fdir().withMaxFiles(100);
```

### `withFullPaths`

Use this to get full absolute paths in the output.

> _By default, fdir returns filenames._

**Usage**

```js
const crawler = new fdir().withFullPaths();
```

### `withRelativePaths`

Use this to get paths relative to the root directory in the output.

**Usage**

```js
const crawler = new fdir().withRelativePaths();
```

### `withPathSeparator`

Use this to set the path separator in the output.

**Usage**

```js
const crawler = new fdir().withPathSeparator("/");
```

### `withAbortSignal(AbortSignal)`

Use this to pass an `AbortSignal` to the crawler.

**Usage**

```js
const controller = new AbortController();

const crawler = new fdir().withAbortSignal(controller.signal);
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

### `onlyDirs`

Ignore all files and return only the directory paths. Might be a little faster.

**Usage**

```js
const crawler = new fdir().onlyDirs();
```

### `normalize`

Normalize the given directory path using `path.normalize`.

> _Since `path.normalize` is not always needed and is quite resource intensive (relatively), fdir includes a flag for it._

**Usage**

```js
const crawler = new fdir().normalize();
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

### `glob(...string[])`

Applies a `glob` filter to all files and only adds those that satisfy it.

> _Uses [picomatch](https://github.com/micromatch/picomatch) underneath. To keep fdir dependency free, it is up to the user to install `picomatch` manually._

**Usage**

```js
// only get js and md files
const crawler = new fdir().glob("./**/*.js", "./**/*.md");
```

### `globWithOptions(string[], Object)`

The same as `glob` but allows you to pass options to the matcher.

**Usage**

```js
// only get js and md files
const crawler = new fdir().globWithOptions(["**/*.js", "**/*.md"], {
  strictSlashes: true
});
```

### `withGlobFunction(Function)`

Uses the specified glob function to match files against the provided glob pattern.

**Usage**

```js
// using picomatch or a similar library
import picomatch from 'picomatch';
const crawler = new fdir().withGlobFunction(picomatch);

// using a custom function
const customGlob = (patterns: string | string[]) => {
  return (test: string): boolean => test.endsWith('.js');
};
const crawler = new fdir().withGlobFunction(customGlob);
```

### `filter(Function)`

Applies a filter to all directories and files and only adds those that satisfy the filter.

> _Multiple filters are joined using AND._

> The function receives two parameters: the first is the path of the item, and the second is a flag that indicates whether the item is a directory or not.

**Usage**

```js
// only get hidden & .js files
const crawler = new fdir()
  .filter((path, isDirectory) => path.startsWith("."))
  .filter((path, isDirectory) => path.endsWith(".js"));
```

### `transform(Function)`

Applies a transformation to the items that satisfy the filter.

> _In case multiple transformers are provided, only the last one is used._

> The function receives two parameters: the first is the path of the item, and the second is a flag that indicates whether the item is a directory or not.

**Usage**

```js
// add a leading '../' to every item
const crawler = new fdir()
  .transform((path) => `../${path}`);
```

### `exclude(Function)`

Applies an exclusion filter to all directories and only crawls those that do not satisfy the condition. Useful for speeding up crawling if you know you can ignore some directories.

> The function receives two parameters: the first is the name of the directory, and the second is the path to it.

> _Currently, you can apply only one exclusion filter per crawler. This might change._

**Usage**

```js
// do not crawl into hidden directories
const crawler = new fdir().exclude((dirName, dirPath) =>
  dirName.startsWith(".")
);
```

### `crawl(string)`

Prepare the crawler. This should be called at the end after all the configuration has been done.

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

> **Note about performance:**
> Sync performance is much, much slower than async performance. Only use this
> if absolutely necessary.

**Usage**

```js
const files = new fdir()
  .withBasePath()
  .withDirs()
  .crawl("/path/to/dir")
  .sync();
```

## Method Chaining Alternative

_Some people have raised issues saying method chaining is not recommended and/or good, so I have added this as an alternative._

It is now possible to pass an `Options` object to `crawlWithOptions`:

```js
new fdir()
  .crawlWithOptions("path/to/dir", {
    includeBasePath: true,
  })
  .sync();
```

List of supported options:

```ts
type Options = {
  includeBasePath?: boolean;
  includeDirs?: boolean;
  normalizePath?: boolean;
  maxDepth?: number;
  maxFiles?: number;
  resolvePaths?: boolean;
  suppressErrors?: boolean;
  group?: boolean;
  onlyCounts?: boolean;
  filters: FilterFn[];
  resolveSymlinks?: boolean;
  useRealPaths?: boolean;
  excludeFiles?: boolean;
  excludeSymlinks?: boolean;
  exclude?: ExcludeFn;
  relativePaths?: boolean;
  pathSeparator: PathSeparator;
  signal?: AbortSignal;
  globFunction?: Function;
};
```
