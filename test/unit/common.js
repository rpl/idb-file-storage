/* eslint-disable no-unused-vars */

"use strict";

function skipOnSupportedIDBMutableFile() {
  if (window.IDBMutableFile) {
    this.skip("Firefox supports IDBMutableFile");
  }
}

function skipOnUnsupportedIDBMutableFile() {
  if (!window.IDBMutableFile) {
    this.skip("This browser do not support IDBMutableFile");
  }
}
