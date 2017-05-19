/* globals IDBFiles */

function appendLog(msg) {
  window.parent.postMessage({type: "appendLog", msg}, window.location.origin);
}

function setPreviewImage(url) {
  document.querySelector("#image-preview").setAttribute("src", url);
}

function previewTextFile(filename, blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => {
      if (reader.error) {
        reject(reader.error);
      } else {
        appendLog(`\n${filename}: File content\n\n${reader.result}\nEOF\n\n`);
        resolve();
      }
    });
    try {
      reader.readAsText(blob);
    } catch (err) {
      reject(err);
    }
  });
}

function previewBlobOrFile(filename, blobOrFile) {
  if (blobOrFile.type.startsWith("image")) {
    setPreviewImage(URL.createObjectURL(blobOrFile));
  } else if (blobOrFile.type.startsWith("text")) {
    return previewTextFile(filename, blobOrFile);
  }
}

function appendLogBlob(filename, blob) {
  const {size, type} = blob;

  appendLog(`${filename}: Blob ${JSON.stringify({size, type}, null, 2)}\n`);
  previewBlobOrFile(filename, blob);
}

function appendLogFile(filename, file) {
  const {size, type, lastModifiedDate} = file;

  appendLog(`${filename}: File ${JSON.stringify({size, type, lastModifiedDate}, null, 2)}\n`);
  previewBlobOrFile(filename, file);
}

async function appendLogMutableFile(filename, mutableFile) {
  const file = await mutableFile.persistAsFileSnapshot(`${filename}/last_snapshot`);
  const {size, type, lastModifiedDate} = file;
  appendLog(`${filename}: MutableFile ${JSON.stringify({size, type, lastModifiedDate}, null, 2)}\n`);
  await previewBlobOrFile(filename, file);
}

setPreviewImage("about:blank");
document.querySelector("#clear-preview").onclick = () => setPreviewImage("about:blank");

async function getStoredData(filename) {
  try {
    setPreviewImage("about:blank");

    const tmpFiles = await IDBFiles.getFileStorage({
      name: "tmpFiles"
    });

    const storedData = await tmpFiles.get(filename);

    if (!storedData) {
      // No data stored with the specified filename.
      return undefined;
    } else if (storedData instanceof File) {
      // Found a File stored with the specified filename.
      appendLogFile(filename, storedData);
    } else if (storedData instanceof Blob) {
      // Found a Blob stored with the specified filename.
      appendLogBlob(filename, storedData);
    } else if (storedData instanceof IDBFiles.IDBPromisedMutableFile) {
      // Found a Mutable File stored with the specified filename.
      await appendLogMutableFile(filename, storedData);
    }

    return storedData;
  } catch (err) {
    console.error("Get stored data", err);
    throw err;
  }
}

document.querySelector("button#get-stored").onclick = async () => {
  try {
    const filename = document.querySelector("#stored-filename").value;
    const foundData = await getStoredData(filename);
    console.log("FOUND DATA", foundData);
    if (!foundData) {
      throw new Error(`No '${filename}' file has been found`);
    }
  } catch (err) {
    const fileName = err.fileName ? new URL(err.fileName).pathname : "";
    appendLog(`${err} - ${fileName}:${err.lineNumber}\n`);
    throw err;
  }
};
