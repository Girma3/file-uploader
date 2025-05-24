import {
  addNewUser,
  getUserByName,
  getUserAllFolders,
  getFolderById,
  getFolderSize,
  getFolderFiles,
  countFolderFiles,
  unShareFolder,
  getUserIndependentFiles,
  getPublicFolderByOwnerId,
  getNextExpiringPublicFolder,
} from "../db/queries.js";
import dotenv from "dotenv";
dotenv.config();
import { body, validationResult } from "express-validator";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { formatDate } from "date-fns";
import bcrypt from "bcryptjs";

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
function convertSize(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return size > 0
    ? `${size.toFixed(2)} ${units[unitIndex].toLowerCase()}`
    : "0 b";
}
async function handleHomePage(req, res, next) {
  try {
    res.render("home");
  } catch (err) {
    console.log(err);
  }
}

async function handleUploadPage(req, res, next) {
  const userId = req.user.id;
  try {
    const allFolders = await getUserAllFolders(userId);

    const allFiles = await getUserIndependentFiles(userId);
    const backEndUrl = process.env.BACKEND_URL;
    if (allFiles) {
      allFiles.map((file) => {
        file.timestamp = formatDate(file.createdAt, "MMM dd");
        file.size = convertSize(file.fileSize);
        file.proxyUrl = `${backEndUrl}/get/file/image/${file.id}`;
      });
    }

    let formattedFolder = await formatFolderTimeStamp(allFolders);

    if (formattedFolder) {
      for (const folder of formattedFolder) {
        const folderSize = await getFolderSize(userId, folder.id);

        folder.size = convertSize(folderSize);
        const folderCount = await countFolderFiles(userId, folder.id);
        folder.count = folderCount;
      }
    }

    res.render("upload-page", { folders: formattedFolder, files: allFiles });
  } catch (err) {
    console.log(err);
  }
}
async function handleSignUp(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors });
  }
  const { userName, userPassword } = req.body;
  console.log(userName, userPassword);

  try {
    const checkUserExist = await getUserByName(userName);
    if (checkUserExist) {
      return res.status(401).json({ msg: "user already exist." });
    }
    //add user to db
    const hashPassword = await bcrypt.hash(userPassword, 10);
    if (!hashPassword) {
      return res.status(401).json({ msg: "Invalid password." });
    }

    const user = await addNewUser(userName, hashPassword);

    if (!user) {
      return res.status(401).json({ msg: "user not added." });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ msg: "Error logging in after sign-up." });
      }
      req.session.user = user;
      return res.status(200).json({ redirect: "/upload-page" });
    });
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

async function handleFolderDetailPage(req, res, next) {
  let folderId = req.query.id;
  const userId = req.user.id;
  const backEndUrl = process.env.BACKEND_URL;

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
    const folderSizeUnit = convertSize(folderSize);
    const folderCreatedTime = formatDate(folder.createdAt, "MMM dd yyyy");
    const folderFiles = await getFolderFiles(userId, folderId);
    //if folder is public add owner id as query
    let ownerId = folder.owner_id;
    const filesWithPublicUrl = folderFiles.map((file) => {
      if (file.fileType.includes("image")) {
        return {
          ...file,
          size: convertSize(file.fileSize),
          proxyUrl: ownerId
            ? `${backEndUrl}/get-image/${file.id}?ownerId=${ownerId}`
            : `${backEndUrl}/get-image/${file.id}`,
        };
      }
      return file;
    });
    const formattedFolder = {
      ...folder,
      count: FolderFilesNum,
      size: folderSizeUnit,
      timestamp: folderCreatedTime,
      files: filesWithPublicUrl, //files array
    };

    return res.render("folder-detail", {
      folder: formattedFolder,
      shared: false,
    });
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

//display shared folder to public
async function handleDisPlaySharedFolder(req, res) {
  const ownerId = req.params.ownerId;
  try {
    const folder = await getPublicFolderByOwnerId(ownerId);
    const folderLinkExpired = unShareFolderLinkPeriodically(folder?.userId);

    if (folderLinkExpired && ownerId && !folder) {
      return res.render("error-page", {
        error: "This Folder link expired so it's no longer public.",
      });
    }

    const folderId = folder.id;
    const userId = folder.userId;
    const FolderFilesNum = await countFolderFiles(userId, folderId);
    const folderSize = await getFolderSize(userId, folderId);
    const folderCreatedTime = formatDate(folder.createdAt, "MMM dd yyyy");
    const folderFiles = await getFolderFiles(userId, folderId);
    const backEndUrl = process.env.BACKEND_URL;
    const folderOwner = folder.owner_id; //folder if it's public
    const filesWithPublicUrl = folderFiles.map((file) => {
      if (file.fileType.includes("image")) {
        return {
          ...file,
          proxyUrl: folderOwner
            ? `${backEndUrl}/get-image/${file.id}?ownerId=${folderOwner}`
            : `${backEndUrl}/get-image/${file.id}`,
        };
      }
      return file;
    });

    const formattedFolder = {
      ...folder,
      count: FolderFilesNum,
      size: folderSize,
      timestamp: folderCreatedTime,
      files: filesWithPublicUrl, //files array
    };
    const checkUserSigned = req.session.user;
    const folderPublic = folder.shared;
    const bothTrue = checkUserSigned && folderPublic;
    return res.render("folder-detail", {
      folder: formattedFolder,
      //if user signed make public false to show upload page link and folder operations
      //  else home link shown
      shared: bothTrue ? false : true,
    });
  } catch (e) {
    console.log(e, "error while displaying shared folder");
  }
}
async function unShareFolderLinkPeriodically(userId) {
  try {
    const shareFolder = await getNextExpiringPublicFolder(userId);
    if (shareFolder) {
      const expireTime = shareFolder.link_expiration;
      const currentTime = Date.now();
      const delay = new Date(expireTime).getTime() - currentTime;

      if (delay > 0) {
        setTimeout(async () => {
          const folderId = shareFolder.id;
          const ownerId = shareFolder.owner_id;
          const folder = await unShareFolder(folderId, ownerId);
          if (folder) {
            return true;
          } else {
            return false;
          }
        }, delay);
      }
    }
  } catch (e) {
    console.log(e, "error while un sharing folder.");
  }
}

export {
  handleHomePage,
  handleSignUp,
  handleLogIn,
  handleUploadPage,
  handleFolderDetailPage,
  handleDisPlaySharedFolder,
  validateUser,
  validateLogIn,
};
