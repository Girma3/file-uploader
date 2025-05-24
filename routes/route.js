import { Router } from "express";
import {
  handleHomePage,
  handleSignUp,
  handleLogIn,
  handleUploadPage,
  handleFolderDetailPage,
  handleDisPlaySharedFolder,
  validateUser,
  validateLogIn,
} from "../controllers/control.js";

import {
  handleOpenFolder,
  handleNewFolder,
  handleAddFolderWithFiles,
  handleDeleteFolder,
  handleEditFolderJson,
  handleEditFolderName,
  handleDownloadFolder,
  handleShareFolder,
  handleDownLoadFolderFiles,
  handleFolderImages,
  validateFolderName,
} from "../controllers/folder-operation.js";

import {
  handleAddFileToFolder,
  handleAddIndependentFile,
  handleDeleteFile,
  handleDownloadIndependentFile,
  handleFileImages,
} from "../controllers/file-operation.js";

import { ensureUserAuthenticated } from "../middleware/authenticateUser.js";
import { handleLogOut } from "../authentication/authController.js";
import { upload, hashFileNameMiddleware } from "../db/multer.js";

const userRouter = Router();

userRouter.get("/", handleHomePage);

userRouter.post("/sign-in", validateUser, handleSignUp);

userRouter.post("/log-in", validateLogIn, handleLogIn);
userRouter.get("/upload-page", ensureUserAuthenticated, handleUploadPage);
userRouter.get("/folder/open/:id", ensureUserAuthenticated, handleOpenFolder);

userRouter.get(
  "/folder/detail",
  ensureUserAuthenticated,
  handleFolderDetailPage
);

userRouter.post(
  "/upload/folder",
  ensureUserAuthenticated,
  upload.array("uploadFolder"),
  hashFileNameMiddleware,
  handleAddFolderWithFiles
);
userRouter.post(
  "/upload/file",
  ensureUserAuthenticated,
  upload.single("uploadFile"),
  hashFileNameMiddleware,
  handleAddIndependentFile
);

userRouter.post(
  "/folder/add/file",
  ensureUserAuthenticated,
  upload.single("addFile"),
  hashFileNameMiddleware,
  handleAddFileToFolder
);

userRouter.post(
  "/folder/create",
  ensureUserAuthenticated,
  validateFolderName,
  handleNewFolder
);

userRouter.delete(
  "/folder/delete/:id",
  ensureUserAuthenticated,
  handleDeleteFolder
);

userRouter.delete(
  "/file/delete/:id",
  ensureUserAuthenticated,
  handleDeleteFile
);

userRouter.get(
  "/folder/edit/json/:id",
  ensureUserAuthenticated,
  handleEditFolderJson
);

userRouter.post(
  "/edit/folder/:id",
  ensureUserAuthenticated,
  validateFolderName,
  handleEditFolderName
);
//make image preview by using proxy url for folder and independent files
userRouter.get("/get-image/:fileId", handleFolderImages);
userRouter.get("/get/file/image/:fileId", handleFileImages);
//download folder and its content
userRouter.get("/download/folder/:id", handleDownloadFolder);

//download  files inside folder and file
userRouter.get("/download/:fileId", handleDownLoadFolderFiles);
userRouter.get(
  "/file/download/:fileId",
  ensureUserAuthenticated,
  handleDownloadIndependentFile
);

//share folder
userRouter.post(
  "/share/folder/:id",
  ensureUserAuthenticated,
  handleShareFolder
);
//show shared folder for everyone
userRouter.get("/public/folder/:ownerId", handleDisPlaySharedFolder);

userRouter.get("/log-out", ensureUserAuthenticated, handleLogOut);
userRouter.get("*", (req, res) => {
  res.render("error-page", { error: "Page not Found." });
});
export default userRouter;
