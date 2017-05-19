IDB File Storage
================

[![Build Status](https://travis-ci.org/rpl/atom-webextensions.svg?branch=master)](https://travis-ci.org/rpl/atom-webextensions)
[![esdoc Coverage](https://doc.esdoc.org/github.com/rpl/idb-file-storage/badge.svg)](https://doc.esdoc.org/github.com/rpl/idb-file-storage)

**Status: Prototype/Proposal.**

This library wraps some of the IndexedDB features related to store files into a Promised API.

While on Chrome this library only provides a basic API to store File and Blob instances,
on Firefox it also provides a Promise based API wrapper for the non-standard [IDBMutableFile][IDBMutableFile] API.

The non-standard [IDBMutableFile][IDBMutableFile] API allows to create and optionally persist into the an IndexedDB database a file object which provides an API to be able to read and change the file content without loading all its content in the memory.

This library should allow WebExtensions add-ons to be able to store and manipulate files more efficiently, without providing direct access to arbitrary files on the user filesystem.

The Promise based [IDBMutableFile][IDBMutableFile] API is currently not available when this library runs on Chrome (e.g. as a Chrome extension), but it still works for storing and retrieving Blob and File instances.
Even if not yet implemented, providing a polyfill for the [IDBMutableFile][IDBMutableFile] API on Chrome based on Blob instances is technically possible.

A more detailed **API reference** (generated using esdoc from the inline comments),
and a collection of small examples are available at the following urls:

* API Reference: https://doc.esdoc.org/github.com/rpl/idb-file-storage/
* Examples:
  - Live Demo: https://rpl.github.io/idb-file-storage/examples/
  - Source: https://github.com/rpl/idb-file-storage/tree/master/examples/

How to use it
-------------

The library is wrapped as an UMD module, and so it can be included as a CommonJS
module using a CommonJS module loader (e.g. webpack, browserify, rollup, ...) or
as an AMD module from a AMD module loader (e.g. RequireJS), as well as just included
as a tag script into an HTML page.

```js
async function testIDBFiles() {
  const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

  const file = await tmpFiles.createMutableFile("path/filename.txt");
  const fh = file.open("readwrite");

  const metadata = await fh.getMetadata();
  console.log(metadata.size); // -> 0

  await fh.append("new file content");

  const metadata = await fh.getMetadata();
  console.log(metadata.size); // -> updated size

  await fh.close();

  await file.persist();

  const fileNames = await tmpFiles.list();
  console.log(fileNames); // -> ["path/filename.txt"]

  const file = await tmpFiles.get("path/filename.txt");
  // Only open if its a mutable file.
  if (file.open) {
    const fh = file.open("readonly");
    const metadata = await fh.getMetadata();
    console.log(metadata.size); // -> updated size
  }

  await tmpFiles.clear(); // or tmpFiles.remove("path/filename.txt")
  const fileNames = await tmpFiles.list();
  console.log(fileNames); // -> []
}
```

Building, Testing and Hacking
-----------------------------

Building the source file into a UMD module (and lint the javascript sources in the process):

```
$ npm run build
...
```

Running the karma tests (which also builds the library and open a Chrome and a Firefox instance and run the test on both):

```
$ npm run test
```

While working on the library or test sources, you may want to watch the sources for changes and lint, rebuild and re-run the tests accordingly:

```
$ npm run test:watch
````

[IDBMutableFile]: https://developer.mozilla.org/en-US/docs/Web/API/IDBMutableFile
