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

    it("should provide a runFileRequestGenerator method", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const mutableFile = await tmpFiles.createMutableFile("test-mutable-file.txt");

      function* fileOperations(lockedFile) {
        expect(lockedFile.active).to.be.eql(true);
        expect(lockedFile.location).to.be.eql(0);

        lockedFile.location = 3;
        expect(lockedFile.location).to.be.eql(3);

        let expectedLocation = 3;
        let expectedData = "\0\0\0";

        for (let i = 0; i < 9; i++) {
          const data = `test data ${i} - `;
          expectedData += data;
          expectedLocation += data.length;

          const res = yield lockedFile.write(data);

          expect(lockedFile.active).to.be.eql(true);
          expect(lockedFile.location).to.be.eql(expectedLocation);
          expect(res).to.be.eql(undefined);
        }

        lockedFile.location = 0;
        expect(lockedFile.active).to.be.eql(true);
        expect(lockedFile.location).to.be.eql(0);

        const res = yield lockedFile.readAsText(expectedLocation);
        expect(lockedFile.active).to.be.eql(true);
        expect(res).to.be.eql(expectedData);
      }

      await mutableFile.runFileRequestGenerator(fileOperations, "readwrite");
    });
  });
});
