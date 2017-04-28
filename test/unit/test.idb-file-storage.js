"use strict";

describe("IDBFiles", () => {
  beforeEach(async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.clear();
  });

  it("should provide a getFileStorage", async () => {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    expect(tmpFiles).to.be.instanceOf(IDBFiles.IDBFileStorage);
  });

  describe("IDBFileStorage", () => {
    it("can store and list Blob instances as files", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const blob = new Blob(["test content"], {type: "text/plain"});

      await tmpFiles.put("path/to/filename1", blob);

      const results = await tmpFiles.list();

      expect(results.length).to.be.eq(1);
      expect(results[0]).to.be.eq("path/to/filename1");
    });

    it("can store and list File instances", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const file = new File(["test content"], "filename2");
      await tmpFiles.put("path2/filename2", file);

      const results = await tmpFiles.list();

      expect(results.length).to.be.eq(1);
      expect(results[0]).to.be.eq("path2/filename2");
    });

    it("can remove stored files", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const file = new File(["test content"], "filename2");
      await tmpFiles.put("path2/filename2", file);

      const results = await tmpFiles.list();

      expect(results.length).to.be.eq(1);
      expect(results[0]).to.be.eq("path2/filename2");

      await tmpFiles.remove("path2/filename2");

      const updatedResults = await tmpFiles.list();
      expect(updatedResults.length).to.be.eq(0);
    });

    it("can count the stored files", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      const file = new File(["test content"], "filename");
      await tmpFiles.put("path1/filename1", file);
      const file2 = new File(["test content2"], "filename2");
      await tmpFiles.put("path2/filename2", file2);

      const result = await tmpFiles.count();

      expect(result).to.be.eq(2);

      await tmpFiles.remove("path2/filename2");

      const updatedResult = await tmpFiles.count();
      expect(updatedResult).to.be.eq(1);
    });

    it("can list and count files with custom filtering options", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      await tmpFiles.put("path1/filename.json", new File(["test content"], "filename.json"));
      await tmpFiles.put("path1/filename.txt", new File(["test content"], "filename.txt"));
      await tmpFiles.put("path2/filename.txt", new File(["test content2"], "filename.txt"));
      await tmpFiles.put("path2/filename.json", new File(["test content2"], "filename.json"));

      const testFilterOptions = async (filterOptions, cb) => {
        let listResult = await tmpFiles.list(filterOptions);
        let countResult = await tmpFiles.count(filterOptions);

        cb({listResult, countResult});
      };

      const filterOptionsTestCases = [
        {
          filterOptions: {startsWith: "path1/"},
          test({countResult, listResult}) {
            expect(countResult).to.be.eq(2);
            expect(listResult.length).to.be.eq(2);
            expect(listResult[0]).to.be.eq("path1/filename.json");
            expect(listResult[1]).to.be.eq("path1/filename.txt");
          }
        },
        {
          filterOptions: {endsWith: ".json"},
          test({countResult, listResult}) {
            expect(countResult).to.be.eq(2);
            expect(listResult.length).to.be.eq(2);
            expect(listResult[0]).to.be.eq("path1/filename.json");
            expect(listResult[1]).to.be.eq("path2/filename.json");
          }
        },
        {
          filterOptions: {startsWith: "path1/", endsWith: ".json"},
          test({countResult, listResult}) {
            expect(countResult).to.be.eq(1);
            expect(listResult.length).to.be.eq(1);
            expect(listResult[0]).to.be.eq("path1/filename.json");
          }
        },
        {
          filterOptions: {contains: "filename"},
          test({countResult, listResult}) {
            expect(countResult).to.be.eq(4);
            expect(listResult.length).to.be.eq(4);
          }
        },
        {
          filterOptions: {
            filterFn(key) {
              return /^path\d\/[a-z]*\.json$/.test(key);
            }
          },
          test({countResult, listResult}) {
            expect(countResult).to.be.eq(2);
            expect(listResult.length).to.be.eq(2);
          }
        }
      ];

      let waitAllTestCases = [];

      for (const {filterOptions, test} of filterOptionsTestCases) {
        waitAllTestCases.push(testFilterOptions(filterOptions, test));
      }

      await Promise.all(waitAllTestCases);
    });
  });

  describe("IDBFileStorage.createMutableFile without IDBMutableFile", () => {
    before(skipOnSupportedIDBMutableFile);

    it("should reject if the browser do not support IDBMutableFile", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      expect(
        tmpFiles.createMutableFile("test-mutable-file-exception.txt")
      ).to.rejectedWith(/This environment does not support IDBMutableFile/);
    });
  });

  describe("IDBFileStorage.createMutableFile with IDBMutableFile", () => {
    before(skipOnUnsupportedIDBMutableFile);

    it("should create a IDBPromisedMutableFile instance", async () => {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});

      expect(
        await tmpFiles.createMutableFile("test-mutable-file.txt")
      ).to.be.instanceOf(IDBFiles.IDBPromisedMutableFile);
    });
  });
});
