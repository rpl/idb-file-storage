describe("IDBFiles", () => {
  beforeEach(async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.clear();
  });

  it('should provide a getFileStorage', async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    expect(tmpFiles).to.be.instanceOf(IDBFiles.IDBFileStorage);
  });

  describe("IDBFileStorage", () => {
    it('can store and list Blob instances as files', async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const blob = new Blob(["test content"], {type: "text/plain"});

      await tmpFiles.put(blob, "path/to/filename1");

      const results = await tmpFiles.list();

      expect(results.length).to.be.eq(1);
      expect(results[0]).to.be.eq("path/to/filename1");
    });

    it('can store and list File instances', async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const file = new File(["test content"], "path2/filename2");
      await tmpFiles.put(file);

      const results = await tmpFiles.list();

      expect(results.length).to.be.eq(1);
      expect(results[0]).to.be.eq("path2/filename2");
    });
  });

  describe("IDBFileStorage.createMutableFile without IDBMutableFile", () => {
    before(skipOnSupportedIDBMutableFile);

    it('should reject if the browser do not support IDBMutableFile', async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      expect(
        tmpFiles.createMutableFile("test-mutable-file-exception.txt")
      ).to.rejectedWith(/This environment does not support IDBMutableFile/);
    });
  });

  describe("IDBFileStorage.createMutableFile with IDBMutableFile", () => {
    before(skipOnUnsupportedIDBMutableFile);

    it('should create a IDBPromisedMutableFile instance', async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      expect(
        await tmpFiles.createMutableFile("test-mutable-file-exception.txt")
      ).to.be.instanceOf(IDBFiles.IDBPromisedMutableFile);
    });
  });
});
