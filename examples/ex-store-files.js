/* globals IDBFiles */

function appendLog(msg) {
  window.parent.postMessage({type: "appendLog", msg}, window.location.origin);
}

async function storeFile(fileName, file) {
  if (!fileName) {
    throw new TypeError("Filename is mandatory");
  }

  if (!(file instanceof File)) {
    throw new TypeError("File missing or invalid");
  }

  try {
    const tmpFiles = await IDBFiles.getFileStorage({
      name: "tmpFiles"
    });
    await tmpFiles.put(fileName, file);
    return fileName;
  } catch (err) {
    console.error("File storing error", err);
    throw err;
  }
}

let lastDroppedFile;
const fileNameInput = document.querySelector("#store-file-filename");
const fileDropSizeLabel = document.querySelector("#store-file-drop-size");
const dropZone = document.querySelector("#store-file-dropzone");

dropZone.ondragover = ev => {
  ev.preventDefault();
};

dropZone.ondrop = ev => {
  ev.preventDefault();

  if (ev.dataTransfer.files.length === 0) {
    appendLog("Error: no File objects have been dropped\n");
  } else {
    lastDroppedFile = ev.dataTransfer.files[0];

    fileNameInput.value = lastDroppedFile.name;
    fileDropSizeLabel.textContent = lastDroppedFile.size;
  }
};

document.querySelector("button#store-file").onclick = () => {
  const fileName = fileNameInput.value;
  const file = lastDroppedFile;

  storeFile(fileName, file).then(storedFileName => {
    appendLog(`File successfully stored as "${storedFileName}"\n`);
  }).catch(err => {
    const fileName = err.fileName ? new URL(err.fileName).pathname : "";
    appendLog(`${err} - ${fileName}:${err.lineNumber}\n`);
    throw err;
  });
};
