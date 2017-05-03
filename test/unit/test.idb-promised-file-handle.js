"use strict";

/* eslint-disable no-await-in-loop */

describe("IDBFiles", () => {
  beforeEach(async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.clear();
  });

  describe("IDBPromisedFileHandle", () => {
    before(skipOnUnsupportedIDBMutableFile);

    it("should be opened as readonly by default", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fh = await mutableFile.open();

      expect(fh.mode).to.be.eql("readonly");
    });

    it("can be configured to be opened in a readonly/readwrite mode", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRo = await mutableFile.open("readonly");
      expect(fhRo.mode).to.be.eql("readonly");

      const fhRw = await mutableFile.open("readwrite");
      expect(fhRw.mode).to.be.eql("readwrite");
    });

    it("provides a getMetadata method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRo = await mutableFile.open("readonly");
      const metadata = await fhRo.getMetadata();
      expect(Object.getOwnPropertyNames(metadata).sort()).to.be.eql(["lastModified", "size"]);
      expect(metadata.size).to.be.eql(0);
      expect(metadata.lastModified).to.be.defined; // eslint-disable-line no-unused-expressions
    });

    it("provides a readAsText method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRo = await mutableFile.open("readonly");
      const fileText = await fhRo.readAsText(1);
      expect(fileText).to.be.eql("");
    });

    it("provides a readAsArrayBuffer method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRo = await mutableFile.open("readonly");
      const fileData = await fhRo.readAsArrayBuffer(1);
      expect(fileData).to.be.instanceOf(ArrayBuffer);
    });

    it("provides an append method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = [
        "content line1\n",
        "content line2\n",
        "content line3\n"
      ];
      const fileSize = fileContent.join().length;

      for (const line of fileContent) {
        await fhRw.append(line);
      }

      const fileText = await fhRw.readAsText(fileSize);
      expect(fileText).to.be.eql(fileContent.join(""));
    });

    it("provides a write method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = [
        "content line1\n",
        "content line2\n",
        "content line3\n"
      ];
      const fileSize = fileContent.join().length;

      let expectedLocation = 0;
      for (const line of fileContent) {
        const newLocation = await fhRw.write(line, expectedLocation);
        expectedLocation += line.length;
        expect(newLocation).to.be.eql(expectedLocation);
      }

      const fileText = await fhRw.readAsText(fileSize);
      expect(fileText).to.be.eql(fileContent.join(""));
    });

    it("provides a truncate method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = "content line1\n";
      const fileSize = fileContent.length;

      await fhRw.append(fileContent);

      let metadata = await fhRw.getMetadata();
      expect(metadata.size).to.be.eql(fileSize);

      await fhRw.truncate();

      metadata = await fhRw.getMetadata();
      expect(metadata.size).to.be.eql(0);

      await fhRw.append(fileContent);

      metadata = await fhRw.getMetadata();
      expect(metadata.size).to.be.eql(fileSize);

      await fhRw.truncate(4);

      metadata = await fhRw.getMetadata();
      expect(metadata.size).to.be.eql(4);
    });

    it("provides a close method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = "content line1\n";
      const fileSize = fileContent.length * 2;

      fhRw.append(fileContent);
      fhRw.append(fileContent);
      await fhRw.close();
      fhRw.append(fileContent);
      fhRw.append(fileContent);

      const fhRo = await mutableFile.open("readonly");
      const metadata = await fhRo.getMetadata();
      expect(metadata.size).to.be.eql(fileSize);
    });

    it("provides an abort method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = "content line1\n";
      const fileSize = fileContent.length;

      fhRw.append(fileContent);
      await fhRw.abort();
      fhRw.append(fileContent);
      fhRw.append(fileContent);
      fhRw.append(fileContent);

      const fhRo = await mutableFile.open("readonly");
      const metadata = await fhRo.getMetadata();
      expect(metadata.size).to.be.eql(fileSize);
    });

    it("provides a queuedWrite method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = [
        "content line1\n",
        "content line2\n",
        "content line3\n"
      ];
      const fileSize = fileContent.join().length;

      for (const line of fileContent) {
        fhRw.queuedWrite(line);
      }

      await fhRw.waitForQueuedWrites();

      const fileText = await fhRw.readAsText(fileSize);
      expect(fileText).to.be.eql(fileContent.join(""));
    });

    it("can persist the changes on the file content", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fhRw = await mutableFile.open("readwrite");
      const fileContent = [
        "content line1\n",
        "content line2\n",
        "content line3\n"
      ];
      const fileSize = fileContent.join().length;

      await fhRw.append(fileContent[0]);
      await fhRw.close();

      await mutableFile.persist();

      const persistedFile = await tmpFiles.get(mutableFile.fileName);
      expect(persistedFile).to.be.instanceOf(IDBFiles.IDBPromisedMutableFile);

      const fhRo = await persistedFile.open("readonly");
      let fileText = await fhRo.readAsText(fileSize);
      expect(fileText).to.be.eql(fileContent[0]);

      const fhRw2 = await persistedFile.open("readwrite");
      await fhRw2.append(fileContent[1]);
      await fhRw2.append(fileContent[2]);
      await fhRw2.close();

      fileText = await fhRo.readAsText(fileSize);
      expect(fileText).to.be.eql(fileContent.join(""));
    });
  });
});
