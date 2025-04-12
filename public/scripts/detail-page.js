const folderBtnHolder = document.querySelector(
  "[data-name='folder-btn-holder']"
);
const uploadFileInput = document.querySelector("[data-name='upload-file']");

folderBtnHolder.addEventListener("click", (e) => {
  if (e.target.matches("[data-name='add-file']")) {
    uploadFileInput.click();
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
  console.log(endPoint);
  try {
    const response = await fetch(endPoint, {
      method: "POST",
      body: formData,
    });
    const result = response.json();
    if (response.status === 200) {
      window.location.href = result.redirect;
    } else {
      alert(result.msg);
    }
  } catch (e) {
    console.log(e, "err while adding file to folder.");
  }
});
