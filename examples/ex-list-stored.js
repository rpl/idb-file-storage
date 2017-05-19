/* globals IDBFiles */

function appendLog(msg) {
  window.parent.postMessage(msg, window.location.origin);
}

async function listStoredFiles() {
  const startsWith = document.querySelector("#filter-startsWith").value;
  const endsWith = document.querySelector("#filter-endsWith").value;
  const contains = document.querySelector("#filter-contains").value;

  try {
    const tmpFiles = await IDBFiles.getFileStorage({
      name: "tmpFiles"
    });
    // Filtered count...
    const count = await tmpFiles.count({
      startsWith, endsWith, contains
    });

    // As well as filtered list
    const fileList = await tmpFiles.list({
      startsWith, endsWith, contains
    });

    return {count, fileList};
  } catch (err) {
    console.error("List stored files error", err);
    throw err;
  }
}

document.querySelector("button#list-stored").onclick = () => {
  listStoredFiles().then(({count, fileList}) => {
    appendLog({
      type: "appendLog",
      msg: `Number of files found: ${count}\n`
    });
    appendLog({
      type: "appendLog",
      msg: `List of files found:\n\n${fileList.join("\n")}\n\n`
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
