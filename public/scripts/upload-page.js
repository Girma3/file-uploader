const uploadContainer = document.querySelector("[data-name='upload-holder']");
const ele = document.querySelector("#x");
//folder form
const formModal = document.querySelector("[data-name='folder-modal']");
const folderForm = document.querySelector("[data-name='folder-form']");
const closeModal = document.querySelector("[data-name='close-form']");
const newFolderBtn = document.querySelector("[data-name='new-folder']");
//folder and files holder
const folderListHolder = document.querySelector(
  "[data-name='folder-list-holder']"
);

const filesListHolder = document.querySelector(
  "[data-name='file-list-holder']"
);
//file element
const fileHolder = document.querySelector("[data-name='file-holder']");
//upload form
const uploadFolderForm = document.querySelector(
  "[data-name='upload-folder-form']"
);
const uploadFileForm = document.querySelector("[data-name='upload-file-form']");
//upload folder form holder
const uploadFolderFormHolder = document.querySelector(
  "[data-name='upload-folder-form-holder']"
);
const uploadFileFormHolder = document.querySelector(
  "[data-name='upload-file-form-holder']"
);
//upload btn choice
const uploadBtnHolder = document.querySelector(
  "[data-name='upload-btn-holder']"
);
//show by button holder
const showBtnHolder = document.querySelector("[data-name='show-by-holder']");

if (showBtnHolder) {
  showBtnHolder.addEventListener("click", (e) => {
    if (e.target.matches("[data-name='show-folders']")) {
      folderListHolder.classList.remove("hidden");
      folderListHolder.style.display = "grid";
      e.target.classList.add("active");
      const fileBtn = document.querySelector("[data-name='show-files']");
      fileBtn.classList.remove("active");
      filesListHolder.classList.add("hidden");
    } else if (e.target.matches("[data-name='show-files']")) {
      filesListHolder.classList.remove("hidden");
      folderListHolder.style.display = "none";
      folderListHolder.classList.add("hidden");

      e.target.classList.add("active");
      const folderBtn = document.querySelector("[data-name='show-folders']");
      folderBtn.classList.remove("active");
    }
  });
}

uploadBtnHolder.addEventListener("click", async (e) => {
  if (e.target.matches("[data-name='upload-file']")) {
    uploadFolderFormHolder.style.display = "none";
    uploadFileFormHolder.style.display = "block";
    e.target.classList.add("active");
    const uploadFolderBtn = document.querySelector(
      "[data-name='upload-folder']"
    );
    uploadFolderBtn.classList.remove("active");
  } else if (e.target.matches("[data-name='upload-folder']")) {
    uploadFileFormHolder.style.display = "none";
    uploadFolderFormHolder.style.display = "block";
    e.target.classList.add("active");
    const uploadFileBtn = document.querySelector("[data-name='upload-file']");
    uploadFileBtn.classList.remove("active");
  } else if (e.target.matches("[data-name='log-out']")) {
    const endPoint = "/log-out";
    try {
      const response = await fetch(endPoint, {
        method: "GET",
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
    } catch (error) {
      console.error("Error:", error);
    }
  }
});

//create folder form
if (folderForm) {
  folderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const endPoint = "/folder/create";
    const formData = new FormData(folderForm);
    const formJson = JSON.stringify(Object.fromEntries(formData.entries()));
    try {
      const response = await fetch(endPoint, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: formJson,
      });
      const result = await response.json();

      if (response.status === 200) {
        folderForm.reset();
        formModal.close();
        window.location.href = result.redirect;
      } else if (response.status === 401) {
        alert(result.msg);
      }
    } catch (e) {
      console.log(e, "err while creating folder");
    }
  });
}

//folder event
if (folderListHolder) {
  folderListHolder.addEventListener("click", async (e) => {
    if (e.target.matches("[data-name='folder-open']")) {
      let folderId = e.target.dataset.id;
      folderId = Number(folderId);
      try {
        const endPoint = `/folder/open/${folderId}`;
        const response = await fetch(endPoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        if (response.status === 200) {
          window.location.href = result.redirect;
        } else if (response.status === 401) {
          alert(result.msg);
        }
      } catch (e) {
        console.log(e, "err while opening folder.");
      }
    }
  });
}

//upload folder
if (uploadFolderFormHolder) {
  const progressBarHolder = document.querySelector(".progress-bar-holder");
  const progressBar = document.getElementById("progress-bar");
  const uploadInput = document.getElementById("uploadFolder");
  async function uploadFiles() {
    const formData = new FormData();
    const files = Array.from(uploadInput.files);

    if (!files.length) {
      return alert("can't upload Empty Folder.");
    }

    files.forEach((file) => {
      formData.append("paths", file.webkitRelativePath); // Path data
      formData.append("uploadFolder", file); // Files data
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload/folder", true);

    // Update progress bar
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);

        progressBarHolder.classList.remove("hidden");
        progressBar.style.width = `${percentage}%`;
        progressBar.innerText = `${percentage}%`;
        progressBar.style.backgroundColor = "green";
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        alert("Upload complete!");
      } else {
        alert("Upload failed!");
      }
    };

    xhr.send(formData);
  }

  uploadFolderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadFiles();
    uploadFolderForm.reset();
    progressBarHolder.classList.add("hidden");
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";
  });
}
//upload file
if (uploadFileFormHolder) {
  const progressBar = document.getElementById("progress-bar");
  const uploadInput = document.getElementById("uploadFile");
  async function uploadFiles() {
    const formData = new FormData();
    const files = Array.from(uploadInput.files);
    if (!files.length) {
      return alert("can't upload EmptyFile,Add file Please!");
    }
    files.forEach((file) => {
      formData.append("paths", file.webkitRelativePath); // Path data
      formData.append("uploadFile", file); // Files data
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload/file", true);

    // Update progress bar
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.innerText = `${percentage}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        alert("Upload complete!");
      } else {
        const result = JSON.parse(xhr.responseText);
        alert(result.msg || "Upload failed!");
      }
    };

    xhr.send(formData);
  }

  uploadFileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadFiles();
    uploadFileForm.reset();
  });
}
//show image if file type is image

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

//event on files
if (filesListHolder) {
  filesListHolder.addEventListener("click", async (e) => {
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
          alert(result.msg);
        }
      } catch (e) {
        console.log(e, "err while deleting file.");
      }
    } else if (e.target.matches("[data-name='file-download']")) {
      const fileId = e.target.dataset.file;
      const fileName = e.target.dataset.filename;
      const endPoint = `/file/download/${fileId}`;
      try {
        const response = await fetch(endPoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        //  const result = await response.json();
        if (response.status === 200) {
          console.log(response, "result");
          const blob = await response.blob();

          downloadImage(blob, fileName);
        } else {
          alert(result.msg);
        }
      } catch (e) {
        console.log(e, "err while downloading file.");
      }
    }
  });
}
function downloadImage(blob, fileName) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
async function getImageProxyUrl(endPoint, container) {
  try {
    const response = await fetch(endPoint, { method: "GET" });
    const result = await response.json();
    if (response.status === 200) {
      const img = document.createElement("img");

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
