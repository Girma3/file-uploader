const uploadContainer = document.querySelector("[data-name='upload-holder']");
const ele = document.querySelector("#x");
//folder form
const formModal = document.querySelector("[data-name='folder-modal']");
const folderForm = document.querySelector("[data-name='folder-form']");
const closeModal = document.querySelector("[data-name='close-form']");
const newFolderBtn = document.querySelector("[data-name='new-folder']");
//folder element
const folderHolder = document.querySelector("[data-name='folder-holder']");
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

uploadBtnHolder.addEventListener("click", (e) => {
  if (e.target.matches("[data-name='upload-file']")) {
    uploadFolderFormHolder.style.display = "none";
    uploadFileFormHolder.style.display = "block";
    e.target.classList.add("active");
    const uploadFolderBtn = document.querySelector(
      "[data-name='upload-folder']"
    );
    uploadFolderBtn.classList.remove("active");
  }
  if (e.target.matches("[data-name='upload-folder']")) {
    uploadFileFormHolder.style.display = "none";
    uploadFolderFormHolder.style.display = "block";
    e.target.classList.add("active");
    const uploadFileBtn = document.querySelector("[data-name='upload-file']");
    uploadFileBtn.classList.remove("active");
  }
});
//upload file form holder

ele.addEventListener("dragstart", dragstartHandler);
//uploadContainer.addEventListener("dragover", dragOverHandler);
//uploadContainer.addEventListener("drop", dropHandler);

function dragstartHandler(e) {
  e.dataTransfer.setData("text", e.target.id);
}
function dragOverHandler(e) {
  e.preventDefault();
}
function dropHandler(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData("text");
  console.log(data);
  e.target.appendChild(document.getElementById(data));
  // const files = e.dataTransfer.files;
  // if (files.length > 0) {
  //     const file = files[0];
  //     const reader = new FileReader();
  //     reader.onload = function(event) {
  //     const content = event.target.result;
  //     document.getElementById('file-content').value = content;
  //     };
  //     reader.readAsText(file);
  // }
}

// folder form modal
newFolderBtn.addEventListener("click", (e) => {
  formModal.showModal();
});
closeModal.addEventListener("click", (e) => {
  formModal.close();
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
      console.log(result);
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
if (folderHolder) {
  folderHolder.addEventListener("click", async (e) => {
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
//file event
if (fileHolder) {
  fileHolder.addEventListener("click", async (e) => {
    if (e.target.matches("[data-name='download-file']")) {
      let fileId = e.target.dataset.file.id;
      fileId = Number(fileId);
      try {
        const endPoint = `/file/download/${fileId}`;
        const response = await fetch(endPoint, {
          method: "get",
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
        console.log(e, "err while downloading file.");
      }
    }
    if (e.target.matches("[data-name='share-file']")) {
      let fileId = e.target.dataset.file.id;
      fileId = Number(fileId);
      try {
        const endPoint = `/file/share/${fileId}`;
        const response = await fetch(endPoint, {
          method: "get",
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
        console.log(e, "err while sharing file.");
      }
    }
    if (e.target.matches("[data-name='delete-file']")) {
      let fileId = e.target.dataset.file.id;
      fileId = Number(fileId);
      try {
        const endPoint = `/file/delete/${fileId}`;
        const response = await fetch(endPoint, {
          method: "delete",
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
        console.log(e, "err while deleting file.");
      }
    }
  });
}
//upload folder
if (uploadFolderFormHolder) {
  const progressBar = document.getElementById("progress-bar");
  const uploadInput = document.getElementById("uploadFolder");
  async function uploadFiles() {
    const formData = new FormData();
    const files = Array.from(uploadInput.files);

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
        progressBar.style.width = `${percentage}%`;
        progressBar.innerText = `${percentage}%`;
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
        alert("Upload failed!");
      }
    };

    xhr.send(formData);
  }

  uploadFileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadFiles();
    uploadFileForm.reset();
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";
  });

  /* uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log(uploadInput.files);

    const formData = new FormData();
    const files = Array.from(uploadInput.files);

    files.forEach((file) => {
      formData.append("paths", file.webkitRelativePath); // Path data
      formData.append("uploadFile", file); // Files data
    });
   

    const endPoint = "/upload";

    try {
      const response = await fetch(endPoint, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.status === 200) {
        uploadForm.reset();
       
        // window.location.href = result.redirect;
      } else if (response.status === 401) {
        alert(result.msg);
      }
    } catch (e) {
      console.log(e, "err while uploading file.");
    }
  });*/
}
