describe("IDBFiles", () => {
  beforeEach(async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.clear();
  });

  describe("IDBPromisedMutableFile", () => {
    before(skipOnUnsupportedIDBMutableFile);

    it('should create a IDBPromisedMutableFile instance', async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      expect(
        await tmpFiles.createMutableFile("test-mutable-file-exception.txt")
      ).to.be.instanceOf(IDBFiles.IDBPromisedMutableFile);
    });
  });
});
