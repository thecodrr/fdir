# Architecture

This document describes the high-level architecture of `fdir`. If you want to familiarize yourself with the code base, you are in the right place!

---

On the highest level, `fdir` is a library that accepts a path to a directory as input and outputs all the file paths in that directory recrusively.

More specifically, input data consists of a path to a directory (`rootDirectory`) and different flags and filters to control the walking process. To increase performance, `fdir` builds internal functions conditionally based on the passed flags. Since these "conditional" functions are tiny, they are inlined by the Javascript Engine reducing branching & allocations.

## Entry Points

`index.js` exports the main `fdir` class and it is the main entry point. However, there is nothing of importance in this file aside from the export.

`src/builder/index.js` contains the main API of `fdir` exposed via a `Builder` class. This is where all the flags & filters are built and passed (as an `options` Object) onto the core of `fdir`.

## Code Map

This section talks briefly about all the directories and what each file in each directory does.

### `src/api`

This is the core of `fdir`.

**`walker.js`:** This contains the `Walker` class which is responsible for controlling and maintaining the state of the directory walker. It builds the conditional functions, processes the `Dirents` and delegates the actual filesystem directory reading to sync/async APIs.

**`async.js`** This contains the asynchronous (`fs.readdir`) logic. This is the starting point of the async crawling process.

**`queue.js`** This contains a tiny `Queue` class to make sure `fdir` doesn't early exit during walking. It increments a counter for each "walk" queued and decrements it when it finishes. Once the counter hits 0, it calls the callback which returns the output to the user.

**`sync.js`** This contains the synchronous (`fs.readdirSync`) logic. This is the starting point of the sync crawling process.

**`fns.js`** This contains the implementations of all the conditional functions.

### `src/builder`

This is what gets exposed to the developer and contains 2 builders that aid in building an `options` object to control various aspects of the walker.

### `src/compat`

Since `fdir` supports Node <= 10.0, this directory contains the compatibility code to bridge the newer (v10.0) filesystem API with the older (v8.0) filesystem API.
