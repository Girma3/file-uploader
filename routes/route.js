import { Router } from "express";
import {
  handleFolderDetailPage,
  handleHomePage,
  handleUploadPage,
  handleSignIn,
  validateUser,
  handleLogIn,
  validateLogIn,
  handleOpenFolder,
  handleUpload,
  handleAddFileToFolder,
  handleNewFolder,
  validateFolderName,
} from "../controllers/control.js";
import { ensureUserAuthenticated } from "../middleware/authenticateUser.js";
import { handleLogOut } from "../authentication/authController.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

import { supaBase } from "../db/superbase.js";

//const { data, error } = await supaBase.storage.from("file-uploader").upload();

const userRouter = Router();

// create uploads folder
const uploaderDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");

const uploadDir = path.join(uploaderDir, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath); // Read file contents
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return hash;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const filePaths = Array.isArray(req.body.paths)
      ? req.body.paths
      : [req.body.paths];

    const filePath = filePaths.find((p) => p.endsWith(file.originalname));
    const folderPath = filePath
      ? path.join(uploadDir, path.dirname(filePath))
      : uploadDir;

    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, folderPath); // Set the folder path as the destination
    });
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Temporarily save with the original name
  },
});

// Middleware to rename file with hash after saving
const hashFileNameMiddleware = (req, res, next) => {
  console.log(req.file, "file");
  const files = req.files || (req.file ? [req.file] : []); // Handle both single and multiple files

  if (files.length === 0) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  try {
    files.forEach((file) => {
      const uploadedFilePath = file.path;

      if (!fs.existsSync(uploadedFilePath)) {
        throw new Error(`File not found: ${uploadedFilePath}`);
      }

      const fileHash = generateFileHash(uploadedFilePath);
      const hashedFileName = `${fileHash}${path.extname(file.originalname)}`;

      const newFilePath = path.join(
        path.dirname(uploadedFilePath),
        hashedFileName
      );

      // Rename the file
      fs.renameSync(uploadedFilePath, newFilePath);
      file.hashedFileName = hashedFileName; // Attach the hashed name to the file object
    });

    next();
  } catch (error) {
    next(error); // Pass errors to the error-handling middleware
  }
};
const upload = multer({ storage: storage });

userRouter.get("/", handleHomePage);
userRouter.post("/sign-in", validateUser, handleSignIn);
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
  handleUpload
);
userRouter.post(
  "/upload/file",
  ensureUserAuthenticated,
  upload.single("uploadFile"),
  hashFileNameMiddleware,
  handleUpload
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
  upload.single("folderName"),
  validateFolderName,
  handleNewFolder
);

userRouter.get("log-out", handleLogOut);
userRouter.get("*", (req, res) => {
  res.send("not found in here.");
});
export default userRouter;
