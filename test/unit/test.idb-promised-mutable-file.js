"use strict";

describe("IDBFiles", () => {
  beforeEach(async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.clear();
  });

  describe("IDBPromisedMutableFile", () => {
    before(skipOnUnsupportedIDBMutableFile);

    it("should provide a getFile method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const file = await mutableFile.getFile();

      expect(file).to.be.instanceOf(File);
      expect(file).to.be.instanceOf(Blob);
    });

    it("should provide a persist method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const filesPre = await tmpFiles.list();

      expect(filesPre.length).to.be.eql(0);

      await mutableFile.persist();

      const filesPost = await tmpFiles.list();

      expect(filesPost.length).to.be.eql(1);
      expect(filesPost[0]).to.be.eql("test-mutable-file.txt");
    });

    it("should provide a open method which returns a IDBPromisedFileHandle instance", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      const fh = await mutableFile.open();

      expect(fh).to.be.instanceOf(IDBFiles.IDBPromisedFileHandle);
    });
  });
});
