"use strict";

function waitForDOMRequest(req, onsuccess) {
  return new Promise((resolve, reject) => {
    req.onsuccess = onsuccess ?
      (() => resolve(onsuccess(req.result))) : (() => resolve(req.result));
    req.onerror = () => reject(req.error);
  });
}

class IDBPromisedFileHandle {
  constructor({file, lockedFile}) {
    this.file = file;
    this.lockedFile = lockedFile;
    this.writeQueue = Promise.resolve();
  }

  ensureLocked({invalidMode} = {}) {
    if (this.closed) {
      throw new Error("FileHandle has been closed");
    }

    if (this.aborted) {
      throw new Error("FileHandle has been aborted");
    }

    if (!this.lockedFile) {
      throw new Error("Invalid FileHandled");
    }

    if (invalidMode && this.lockedFile.mode === invalidMode) {
      throw new Error(`FileHandle should not be opened as '${this.lockedFile.mode}'`);
    }
    if (!this.lockedFile.active) {
      // Automatically relock the file with the last open mode
      this.file.reopenFileHandle(this);
    }
  }

  // Promise-based MutableFile API

  get mode() {
    return this.lockedFile.mode;
  }

  get active() {
    return this.lockedFile ? this.lockedFile.active : false;
  }

  async close() {
    if (!this.lockedFile) {
      throw new Error("FileHandle is not open");
    }

    // Wait the queued write to complete.
    await this.writeQueue;

    // Wait for flush request to complete if needed.
    if (this.lockedFile.active && this.lockedFile.mode !== "readonly") {
      await waitForDOMRequest(this.lockedFile.flush());
    }

    this.closed = true;
    this.lockedFile = null;
    this.writeQueue = Promise.resolve();
  }

  async abort() {
    if (this.lockedFile.active) {
      await waitForDOMRequest(this.lockedFile.abort());
    }

    this.aborted = true;
    this.lockedFile = null;
    this.writeQueue = Promise.resolve();
  }

  async getMetadata() {
    this.ensureLocked();
    return await waitForDOMRequest(this.lockedFile.getMetadata());
  }

  async readAsText(size, location) {
    this.ensureLocked({invalidMode: "writeonly"});
    if (typeof location === "number") {
      this.lockedFile.location = location;
    }
    return await waitForDOMRequest(this.lockedFile.readAsText(size));
  }

  async readAsArrayBuffer(size, location) {
    this.ensureLocked({invalidMode: "writeonly"});
    if (typeof location === "number") {
      this.lockedFile.location = location;
    }
    return await waitForDOMRequest(this.lockedFile.readAsArrayBuffer(size));
  }

  async trucate() {
    this.ensureLocked({invalidMode: "readonly"});
    return await waitForDOMRequest(this.lockedFile.truncate());
  }

  async append(data) {
    this.ensureLocked({invalidMode: "readonly"});
    return await waitForDOMRequest(this.lockedFile.append(data));
  }

  async write(data, location) {
    this.ensureLocked({invalidMode: "readonly"});
    if (typeof location === "number") {
      this.lockedFile.location = location;
    }
    return await waitForDOMRequest(
      this.lockedFile.write(data),
      // Resolves to the new location.
      () => {
        return this.lockedFile.location;
      }
    );
  }

  queuedWrite(data, location) {
    const nextWriteRequest = async lastLocation => {
      this.ensureLocked({invalidMode: "readonly"});

      if (typeof location === "number") {
        return this.write(data, location);
      }
      return this.write(data, lastLocation);
    };

    this.writeQueue = this.writeQueue.then(nextWriteRequest);
    return this.writeQueue;
  }

  async waitForQueuedWrites() {
    await this.writeQueue;
  }
}

class IDBPromisedMutableFile {
  constructor({filesStorage, idb, fileName, fileType, mutableFile}) {
    this.filesStorage = filesStorage;
    this.idb = idb;
    this.fileName = fileName;
    this.fileType = fileType;
    this.mutableFile = mutableFile;
  }

  reopenFileHandle(fileHandle) {
    fileHandle.lockedFile = this.mutableFile.open(fileHandle.mode);
  }

  // API methods.

  open(mode) {
    if (this.lockedFile) {
      throw new Error("MutableFile cannot be opened twice");
    }
    const lockedFile = this.mutableFile.open(mode);

    return new IDBPromisedFileHandle({file: this, lockedFile});
  }

  getFile() {
    return waitForDOMRequest(this.mutableFile.getFile());
  }

  persist() {
    return this.filesStorage.put(this);
  }
}

class IDBFileStorage {
  constructor({name} = {}) {
    this.name = name;
    this.indexedDBName = `IDBFilesStorage-DB-${this.name}`;
    this.objectStorageName = "IDBFilesObjectStorage";

    // TODO: evalutate schema migration between library versions?
    this.version = 1.0;
  }

  initializedDB() {
    if (this.initializedPromise) {
      return this.initializedPromise;
    }

    this.initializedPromise = (async () => {
      const dbReq = indexedDB.open(this.indexedDBName, this.version);

      dbReq.onupgradeneeded = () => {
        const db = dbReq.result;
        if (!db.objectStoreNames.contains(this.objectStorageName)) {
          db.createObjectStore(this.objectStorageName);
        }
      };

      return await waitForDOMRequest(dbReq);
    })();

    return this.initializedPromise;
  }

  getObjectStoreTransaction({idb, mode} = {}) {
    const transaction = idb.transaction([this.objectStorageName], mode);
    return transaction.objectStore(this.objectStorageName);
  }

  async createMutableFile(fileName, fileType = "text") {
    if (!window.IDBMutableFile) {
      throw new Error("This environment does not support IDBMutableFile");
    }
    const idb = await this.initializedDB();
    const mutableFile = await waitForDOMRequest(
      idb.createMutableFile(this.fileName, this.fileType)
    );
    return new IDBPromisedMutableFile({
      filesStorage: this, idb, fileName, fileType, mutableFile
    });
  }

  async put(file, fileName) {
    if (!(file instanceof File) && !(file instanceof Blob) &&
        !(window.IDBMutableFile && file instanceof window.IDBMutableFile) &&
        !(file instanceof IDBPromisedMutableFile)) {
      throw new Error(`Unable to persist ${fileName}. Unknown file type.`);
    }

    if (file instanceof IDBPromisedMutableFile) {
      fileName = fileName || file.fileName;
      file = file.mutableFile;
    }

    if (file instanceof File) {
      fileName = fileName || file.name;
    }

    const idb = await this.initializedDB();
    const objectStore = this.getObjectStoreTransaction({idb, mode: "readwrite"});
    return waitForDOMRequest(objectStore.put(file, fileName));
  }

  async remove(fileName) {
    const idb = await this.initializedDB();
    const objectStore = this.getObjectStoreTransaction({idb, mode: "readwrite"});
    return waitForDOMRequest(objectStore.delete(fileName));
  }

  async list() {
    const idb = await this.initializedDB();
    const objectStore = this.getObjectStoreTransaction({idb});
    return waitForDOMRequest(objectStore.getAllKeys());
  }

  async get(fileName) {
    const idb = await this.initializedDB();
    const objectStore = this.getObjectStoreTransaction({idb});
    return waitForDOMRequest(objectStore.get(fileName)).then(result => {
      if (window.IDBMutableFile && result instanceof window.IDBMutableFile) {
        return new IDBPromisedMutableFile({
          filesStorage: this,
          idb,
          fileName,
          fileType: result.type,
          mutableFile: result
        });
      }

      return result;
    });
  }

  async clear() {
    const idb = await this.initializedDB();
    const objectStore = this.getObjectStoreTransaction({idb, mode: "readwrite"});
    return waitForDOMRequest(objectStore.clear());
  }
}

const IDBFiles = { // eslint-disable-line no-unused-vars
  waitForDOMRequest,
  IDBFileStorage,
  IDBPromisedMutableFile,
  IDBPromisedFileHandle,
  async getFileStorage({name} = {}) {
    const filesStorage = new IDBFileStorage({name: name || "default"});
    await filesStorage.initializedDB();
    return filesStorage;
  }
};
