import {
  countFolderFiles,
  getUserAllFolders,
  addFolder,
  getUserIndependentFiles,
  getFolderById,
  getFolderSize,
  getFolderFiles,
  addIndependentFile,
  addFileToFolder,
  deleteFolder,
  deleteFile,
  editFolderName,
} from "../db/queries.js";
import { body, validationResult } from "express-validator";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { formatDate } from "date-fns";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const validateUser = [
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("name can't be empty!")
    .isLength({ min: 3 })
    .withMessage("name should be at least 3 characters"),
  body("userPassword")
    .trim()
    .notEmpty()
    .withMessage("password can't be empty")
    .isLength({ min: 3 })
    .withMessage("password must be at least 3 characters"),
];
const validateLogIn = [
  body("logInUserName")
    .trim()
    .notEmpty()
    .withMessage("name can't be empty!")
    .isLength({ min: 3 })
    .withMessage("name should be at least 3  characters"),
  body("logInUserPassword")
    .trim()
    .notEmpty()
    .withMessage("password can't be empty")
    .isLength({ min: 3 }) //adjust later
    .withMessage("password must be at least 3  characters"),
];
const validateFolderName = [
  body("folderName").trim().notEmpty().withMessage("name can't be empty!"),
];
async function handleHomePage(req, res, next) {
  try {
    res.render("home");
    // const user = await getUserById(1);
    // console.log(user);
  } catch (err) {
    console.log(err);
  }
}
async function handleUploadPage(req, res, next) {
  try {
    const allFolders = await getUserAllFolders(req.session.user.id);
    const allFiles = await getUserIndependentFiles(req.session.user.id);
    const folderCount = await countFolderFiles(1);
    const formattedFolder = await formatFolderTimeStamp(allFolders);

    res.render("upload-page", { folders: formattedFolder, files: allFiles });
  } catch (err) {
    console.log(err);
  }
}
async function handleSignIn(req, res, next) {
  const errors = validationResult(req);
  console.log(errors, "in sign in");
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors });
  }
  const { userName, userPassword } = req.body;
  try {
    //add user to db
    // await addUser(userName, userPassword);
    return res.status(200).json({ redirect: "/upload-page" });
  } catch (err) {
    console.log(err, "err,while sign in");
  }
}
async function handleLogIn(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors.array() });
  }

  authenticateUser(req, res, async () => {
    try {
      if (req.session.user !== null) {
        return res.status(200).json({
          redirect: "/upload-page",
        });
      }

      return res.status(401).json({
        msg: "not authenticated in session.",
        redirect: "/",
      });
    } catch (err) {
      console.error("Error during login:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
}
async function handleOpenFolder(req, res, next) {
  let folderId = req.params.id;
  const userId = req.session.user.id;

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "folder id or user id not found." });
  }
  folderId = Number(folderId);

  try {
    const folder = await getFolderById(userId, folderId);
    console.log(folder, "open");
    if (!folder) {
      return res.status(401).json({ msg: "folder not found." });
    }

    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (e) {
    console.log(e, "err while opening folder.");
  }
}
async function handleFolderDetailPage(req, res, next) {
  let folderId = req.query.id;
  const userId = req.session.user.id;

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "folder id or user id not found." });
  }
  folderId = Number(folderId);

  try {
    const folder = await getFolderById(userId, folderId);
    if (!folder) {
      return res.status(401).json({ msg: "folder not found." });
    }
    const FolderFilesNum = await countFolderFiles(userId, folderId);
    const folderSize = await getFolderSize(userId, folderId);
    const folderCreatedTime = formatDate(folder.createdAt, "MMM dd yyyy");
    const folderFiles = await getFolderFiles(userId, folderId);
    const formattedFolder = {
      ...folder,
      count: FolderFilesNum,
      size: folderSize,
      timestamp: folderCreatedTime,
      files: folderFiles, //files array
    };

    return res.render("folder-detail", { folder: formattedFolder });
  } catch (err) {
    console.log(err);
  }
}
function formatFolderTimeStamp(folders) {
  return folders.map((folder) => {
    const formattedFolder = {
      ...folder,
      timestamp: formatDate(folder.createdAt, "MMM dd"),
    };
    return formattedFolder;
  });
}

async function handleUpload(req, res) {
  if (!req.file || !req.files) {
    return res.status(401).json({ msg: "file not uploaded" });
  }
  console.log(req.files);

  try {
    // if (req.files.length > 0) {
    //   req.files.forEach((file) => {
    //     console.log(file, "file");
    //     // const file = await addFile(uploadFile, req.session.user.id);
    //   });
    //   return res.status(200).json({
    //     redirect: `/upload-page`,
    //   });
    // }
  } catch (e) {
    console.log(e, "err while uploading file");
    return res.status(500).json({ error: "File upload failed" });
  }
}

async function handleAddFileToFolder(req, res, next) {
  let folderId = req.query.id;
  const userId = req.session.user.id;

  folderId = Number(folderId);
  console.log(req.file);

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "folder id or user id not found." });
  }
  const fileUrl = req.file.path;
  const fileName = req.file.hashedFileName;

  // console.log(fileUrl, fileName);
  try {
    const file = await addFileToFolder(folderId, userId, fileName, fileUrl);

    if (!file) {
      return res.status(401).json({ msg: "file not added." });
    }
    //add file to folder here
    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (e) {
    console.log(e, "err while adding file to folder");
  }
}
async function handleNewFolder(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors });
  }
  const userId = req.session.user.id;
  const folderName = req.body.folderName;
  const uploaderDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../"
  );
  const uploadDir = path.join(uploaderDir, "uploads", folderName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const folder = await addFolder(folderName, userId);
    if (!folder) {
      return res.status(401).json({ msg: "folder not added." });
    } else {
      return res
        .status(200)
        .json({ redirect: `/folder/detail/?id=${folder.id}` });
    }
  } catch (e) {
    console.log(e, "err while adding new folder.");
  }
}

async function handleDeleteFolder(req, res, next) {
  let folderId = req.params.id;
  const userId = req.session.user.id;
  folderId = Number(folderId);

  try {
    const folder = await deleteFolder(userId, folderId);
    if (!folder) {
      return res.status(401).json({ msg: "folder not deleted." });
    }
    return res.status(200).json({ redirect: `/upload-page` });
  } catch (e) {
    console.log(e, "err while deleting folder");
  }
}

async function handleDeleteFile(req, res, next) {
  let fileId = req.params.id;
  const folderId = req.query.folderId;
  const userId = req.session.user.id;
  fileId = Number(fileId);

  try {
    const file = await deleteFile(userId, fileId);
    if (!file) {
      return res.status(401).json({ msg: "file not deleted." });
    }
    if (file && folderId) {
      return res
        .status(200)
        .json({ redirect: `/folder/detail/?id=${folderId}` });
    } else {
      return res.status(200).json({ redirect: `/upload-page` });
    }
  } catch (e) {
    console.log(e, "err while deleting file.");
  }
}

async function handleEditFolderJson(req, res, next) {
  const folderId = req.params.id;
  const userId = req.session.user.id;
  try {
    const folder = await getFolderById(userId, folderId);
    if (!folder) {
      return res.status(401).json({ msg: "folder not found." });
    }
    return res.status(200).json({ folder: folder });
  } catch (e) {
    console.log(e, "err while sending json");
  }
}

async function handleEditFolderName(req, res, next) {
  const errors = validationResult(req);
  let folderId = req.params.id;
  const userId = req.session.user.id;
  folderId = Number(folderId);
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors });
  }
  const folderName = req.body.folderName;

  try {
    const folder = await editFolderName(userId, folderId, folderName);
    if (!folder) {
      return res.status(401).json({ msg: "folder not edited." });
    }
    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (e) {
    console.log(e, "err while editing folder name.");
  }
}
export {
  handleHomePage,
  handleUploadPage,
  handleOpenFolder,
  handleFolderDetailPage,
  handleSignIn,
  validateUser,
  handleLogIn,
  validateLogIn,
  handleUpload,
  handleAddFileToFolder,
  handleNewFolder,
  validateFolderName,
  handleDeleteFolder,
  handleDeleteFile,
  handleEditFolderJson,
  handleEditFolderName,
};
