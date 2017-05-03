/* globals IDBFiles */

function appendLog(msg) {
  window.parent.postMessage(msg, window.location.origin);
}

async function storeBlob() {
  const fileName = document.querySelector("#store-blob-filename").value;
  const blobSize = parseInt(document.querySelector("#store-blob-size").value, 10);

  if (isNaN(blobSize)) {
    throw new TypeError("Size is missing or invalid");
  }

  if (!fileName) {
    throw new TypeError("Filename is mandatory");
  }

  const blobData = new ArrayBuffer(blobSize);
  const blob = new Blob([blobData]);

  try {
    const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
    await tmpFiles.put(fileName, blob);
    return fileName;
  } catch (err) {
    console.error("Blob storing error", err);
    throw err;
  }
}

document.querySelector("button#store-blob").onclick = () => {
  storeBlob().then(storedFileName => {
    appendLog({
      type: "appendLog",
      msg: `File successfully stored as "${storedFileName}"\n`
    });
  }).catch(err => {
    const fileName = err.fileName ? new URL(err.fileName).pathname : "";
    appendLog({
      type: "appendLog",
      msg: `${err} - ${fileName}:${err.lineNumber}\n`
    });
    throw err;
  });
};
