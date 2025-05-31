const folderBtnHolder = document.querySelector(
  "[data-name='folder-btn-holder']"
);
const uploadFileInput = document.querySelector("[data-name='upload-file']");
const fileHolder = document.querySelector("[data-name='file-list-holder']");
//edit folder modal
const editFolderModal = document.querySelector(
  "[data-name='edit-folder-modal']"
);
const editFolderForm = document.querySelector("[data-name='edit-folder-form']");
const editInput = editFolderForm.querySelector("input");
//share folder modal
const shareFolderModal = document.querySelector(
  "[data-name='share-folder-modal']"
);
const copyLinkModal = document.querySelector("[data-name='copy-link-modal']");
const shareFolderForm = shareFolderModal.querySelector(
  "[data-name='share-folder-form']"
);
folderBtnHolder.addEventListener("click", async (e) => {
  if (e.target.matches("[data-name='add-file']")) {
    uploadFileInput.click();
  } else if (e.target.matches("[data-name='delete-folder']")) {
    const folderId = e.target.dataset.folder;
    try {
      const endPoint = `/folder/delete/${folderId}`;
      const response = await fetch(endPoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (response.status === 200) {
        window.location.href = result.redirect;
      } else {
        alert(result.msg);
      }
    } catch (e) {
      console.log(e, "err while removing folder.");
    }
  } else if (e.target.matches("[data-name='share-folder']")) {
    shareFolderModal.showModal();
  } else if (e.target.matches("[data-name='edit-folder']")) {
    const folderId = e.target.dataset.folder;
    try {
      const response = await fetch(`/folder/edit/json/${folderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (response.status === 200) {
        //edit modal form
        editFolderModal.showModal();
        editInput.value = result.folder.name;
        editFolderForm.action = `/edit/folder/${folderId}`;
      } else {
        alert(result.msg);
      }
    } catch (e) {
      console.log(e, "err while getting folder json");
    }
  } else if (e.target.matches("[data-name='download-folder']")) {
    const folderId = e.target.dataset.folder;
    const folderName = e.target.dataset.folderName;
    const endPoint = `/download/folder/${folderId}`;

    try {
      const response = await fetch(endPoint, { method: "GET" });

      if (response.status === 200) {
        //convert response to blob
        const result = await response.blob();
        downloadZip(result, folderName);
      } else {
        const result = await response.json();
        alert(result.msg || "error while downloading folder.");
      }
    } catch (e) {
      console.log(e, "err while downloading folder.");
    }
  }
});
uploadFileInput.addEventListener("change", async (e) => {
  const folderId = e.target.dataset.folder;
  const formData = new FormData();
  const files = Array.from(uploadFileInput.files);

  files.forEach((file) => {
    formData.append("paths", file.webkitRelativePath); // Path data
    formData.append("addFile", file); // Files data
  });

  const endPoint = `/folder/add/file/?id=${folderId}`;

  try {
    const response = await fetch(endPoint, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (response.status === 200) {
      window.location.href = result.redirect;
    } else {
      alert(result.msg || "file upload failed,try again.");
    }
  } catch (e) {
    console.log(e, "err while adding file to folder.");
  }
});

//event on files
if (fileHolder) {
  fileHolder.addEventListener("click", async (e) => {
    if (e.target.matches("[data-name='file-delete']")) {
      const fileId = e.target.dataset.file;
      const endPoint = `/file/delete/${fileId}/`;
      try {
        const response = await fetch(endPoint, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.status === 200) {
          window.location.href = result.redirect;
        } else {
          alert(
            result.msg || "error while deleting file refresh and try again."
          );
        }
      } catch (e) {
        console.log(e, "err while deleting file.");
      }
    } else if (e.target.matches("[data-name='file-download']")) {
      const fileId = e.target.dataset.file;
      const folderId = e.target.dataset.folder;
      const fileName = e.target.dataset.filename;
      const endPoint = `/download/${fileId}?folderId=${folderId}`;
      try {
        const response = await fetch(endPoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          const blob = await response.blob();
          downloadImage(blob, fileName);
        } else {
          const result = await response.json();
          alert(result.msg);
        }
      } catch (e) {
        console.log(e, "err while downloading file.");
      }
    }
  });
}
if (editFolderModal) {
  editFolderModal.addEventListener("click", (e) => {
    if (e.target.matches("[data-name='close-btn']")) {
      editFolderModal.close();
    }
  });
}
if (editFolderForm) {
  editFolderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const folderId = editFolderForm.dataset.folder;
    const formData = new FormData(editFolderForm);
    const endPoint = `/edit/folder/${folderId}`;

    try {
      const response = await fetch(endPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json();
      if (response.status === 200) {
        window.location.href = result.redirect;
      } else {
        alert(
          result.msg ||
            result.errors[0].msg ||
            "error while editing folder refresh and try again."
        );
      }
    } catch (e) {
      console.log(e, "err while editing form");
    }
  });
}
const proxyUrlHolders = document.querySelectorAll(
  "[data-name='proxy-url-holder']"
);
if (proxyUrlHolders.length > 0) {
  const allProxyUrlHolders = Array.from(proxyUrlHolders);
  const fileLi = Array.from(
    document.querySelectorAll("[data-name='file-holder']")
  );
  const imgHolder = document.querySelectorAll("[data-name='img-holder']");
  allProxyUrlHolders.forEach((holder, index) => {
    if (fileLi[index]) {
      const endPoint = holder.dataset.proxyUrl;

      getImageProxyUrl(endPoint, imgHolder[index]);
    }
  });
}
async function getImageProxyUrl(endPoint, container) {
  try {
    const response = await fetch(endPoint, { method: "GET" });
    const result = await response.json();
    if (response.status === 200) {
      const img = document.createElement("img");
      //console.log(response, "response");
      img.src = result.imageUrl;
      img.alt = "preview image";
      img.loading = "lazy";
      img.classList.add("preview-image");
      container.appendChild(img);
    } else {
      const result = await response.json();
      alert(result.msg);
    }
  } catch (e) {
    console.log(e, "err while getting proxy url");
  }
}
function downloadImage(blob, fileName) {
  //create a temporary URL for the blob

  const url = URL.createObjectURL(blob);
  // create an anchor (`<a>`) element dynamically
  const a = document.createElement("a");
  a.href = url; // Set the URL as the file source
  a.download = fileName; // Define the default file name
  // Append the anchor to the document (required in some browsers)
  document.body.appendChild(a);
  a.click(); //  click to trigger download
  // cleanup: Remove the anchor and free memory used by the blob URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function downloadZip(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (shareFolderForm) {
  const copyLinkModal = document.querySelector("[data-name='copy-link-modal']");
  const closeLinkBtn = copyLinkModal.querySelector(
    "[data-name='close-link-modal']"
  );
  const closeBtn = shareFolderModal.querySelector(
    "[data-name='close-share-modal']"
  );
  closeBtn.addEventListener("click", () => {
    shareFolderModal.close();
  });
  closeLinkBtn.addEventListener("click", () => {
    copyLinkModal.close();
  });
  shareFolderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectForm = shareFolderForm.querySelector(
      "[data-name='linkDuration']"
    );

    const durationValue = Number(selectForm.value);
    const folderId = shareFolderForm.dataset.folder;
    const formData = new FormData(shareFolderForm);
    const formJson = JSON.stringify(Object.fromEntries(formData.entries()));

    const endPoint = `/share/folder/${folderId}/?duration=${durationValue}`;

    try {
      const response = await fetch(endPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formJson,
      });
      const result = await response.json();
      if (response.status === 200) {
        shareFolderModal.close();
        copyLinkModal.showModal();

        const linkInput = copyLinkModal.querySelector("#copyLinkInput");
        const copyBtn = copyLinkModal.querySelector(
          "[data-name='copy-link-btn']"
        );

        linkInput.value = result.link;
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(linkInput.value);
          alert("copied to clipboard");
        });
        shareFolderModal.close();
      } else {
        alert(result.msg);
      }
    } catch (e) {
      console.log(e, "err while sharing folder.");
    }
  });
}
