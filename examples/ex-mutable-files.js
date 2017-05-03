/* globals IDBFiles */

function appendLog(msg) {
  window.parent.postMessage({type: "appendLog", msg}, window.location.origin);
}

let lastDroppedFile;
const fileNameInput = document.querySelector("#store-mutablefile-filename");
const fileSizeInput = document.querySelector("#store-mutable-size");
const dropZone = document.querySelector("#store-file-dropzone");
const contentTextArea = document.querySelector("#store-mutablefile-text");
const appendContentTextArea = document.querySelector("#store-mutablefile-append-text");

dropZone.ondragover = ev => {
  ev.preventDefault();
};

dropZone.ondrop = ev => {
  ev.preventDefault();

  if (ev.dataTransfer.files.length === 0) {
    appendLog("Error: no File objects have been dropped\n");
  } else {
    lastDroppedFile = ev.dataTransfer.files[0];

    // Pre-fill the file name input if empty.
    if (!fileNameInput.value) {
      fileNameInput.value = lastDroppedFile.name;
    }

    // Clear the context text.
    contentTextArea.value = null;
    // Update the size preview.
    fileSizeInput.value = lastDroppedFile.size;
  }
};

const CHUNK_SIZE = 1024 * 1024;

function* chunkedBlob(blob, chunkSize) {
  if (blob.size <= chunkSize) {
    yield blob;
    return;
  }

  const start = 0;

  while (start < blob.size) {
    yield blob.slice(start, start + chunkSize);
  }
}

async function storeMutableFile({filename, droppedFile, fileContentText}) {
  try {
    const tmpFiles = await IDBFiles.getFileStorage({
      name: "tmpFiles"
    });

    let mutableFile;

    if (droppedFile) {
      mutableFile = await tmpFiles.createMutableFile(filename, droppedFile.type);
      const fhRw = mutableFile.open("readwrite");
      // Copy the file content into the mutable file by writing
      // a sequence of chunks of CHUNK_SIZE size.
      for (const slicedBlob of chunkedBlob(droppedFile, CHUNK_SIZE)) {
        console.log("SLICE", slicedBlob);
        await fhRw.append(slicedBlob); // eslint-disable-line no-await-in-loop
      }

      await fhRw.close();
    } else {
      mutableFile = await tmpFiles.createMutableFile(filename);
      const fhRw = mutableFile.open("readwrite");
      await fhRw.append(fileContentText);
      await fhRw.close();
    }

    // Persist the mutable file into the IndexedDB storage.
    await tmpFiles.put(filename, mutableFile);

    return filename;
  } catch (err) {
    console.error("File storing error", err);
    throw err;
  }
}

document.querySelector("button#store-mutable-file").onclick = () => {
  const filename = fileNameInput.value;
  const fileContentText = contentTextArea.value;

  storeMutableFile({
    filename,
    droppedFile: lastDroppedFile,
    fileContentText
  }).then(storedFileName => {
    appendLog(`File successfully stored as "${storedFileName}"\n`);
  }).catch(err => {
    const errFileName = err.fileName ? new URL(err.fileName).pathname : "";
    appendLog(`${err} - ${errFileName}:${err.lineNumber}\n`);
    throw err;
  });
};

document.querySelector("button#append-text").onclick = async () => {
  const filename = fileNameInput.value;
  const appendText = appendContentTextArea.value;

  try {
    const tmpFiles = await IDBFiles.getFileStorage({
      name: "tmpFiles"
    });

    const mutableFile = await tmpFiles.get(filename);
    const fhRw = mutableFile.open("readwrite");
    await fhRw.append(appendText);
    await fhRw.close();

    appendLog(`Content successfully appended to "${filename}"\n`);
  } catch (err) {
    const errFileName = err.fileName ? new URL(err.fileName).pathname : "";
    appendLog(`${err} - ${errFileName}:${err.lineNumber}\n`);
    throw err;
  }
};
