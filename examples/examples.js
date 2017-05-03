/* global IDBFiles */

window.addEventListener("load", () => {
  const logsEl = document.querySelector("#logs");

  function clearLogs() {
    logsEl.innerHTML = "";
  }
  function appendLog(msg) {
    logsEl.textContent += msg;
  }

  window.addEventListener("message", evt => {
    if (evt.data.type === "appendLog") {
      appendLog(evt.data.msg);
    }
  });

  function render(exampleUrl) {
    clearLogs();
    const iframe = document.querySelector("#example-iframe");
    iframe.setAttribute("src", exampleUrl);
  }

  const exampleIds = [
    "ex-store-blobs", "ex-store-files", "ex-list-stored", "ex-get-stored",
    "ex-mutable-files"
  ];

  for (const id of exampleIds) {
    document.querySelector(`#${id}`).onclick = evt => {
      evt.preventDefault();
      render(`${evt.target.id}.html`);
    };
  }

  document.querySelector("#list-all-files").onclick = async () => {
    clearLogs();
    try {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      const storedFiles = await tmpFiles.list();
      if (storedFiles.length === 0) {
        appendLog("No files stored.\n");
      } else {
        appendLog("List of the stored files:\n\n");
        for (const filename of storedFiles) {
          appendLog(`${filename}\n`);
        }
      }
    } catch (err) {
      appendLog("ERROR: exception raised while listing all the stored files:\n");
      appendLog(`${err}\n`);
    }
  };

  document.querySelector("#clear-all-files").onclick = async () => {
    clearLogs();
    try {
      const tmpFiles = await IDBFiles.getFileStorage({name: "tmpFiles"});
      await tmpFiles.clear();
      appendLog("All stored files have been removed.\n");
    } catch (err) {
      appendLog("ERROR: exception raised while clearing all the stored files:\n");
      appendLog(`${err}\n`);
    }
  };

  document.querySelector("#clear-logs").onclick = clearLogs;
}, {once: true});
