import {
  countFolderFiles,
  getUserAllFolders,
  getUserIndependentFiles,
  getFolderById,
  getFolderSize,
  getFolderFiles,
  getFileByHashedName,
  getFileById,
  saveSharedFolder,
  unShareFolder,
  getPublicFolderByOwnerId,
  getNextExpiringPublicFolder,
  deleteFile,
} from "../db/queries.js";
import dotenv from "dotenv";
dotenv.config();
import { body, validationResult } from "express-validator";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { formatDate } from "date-fns";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import supabase from "../db/supabase.js";
import { ResultWithContextImpl } from "express-validator/lib/chain/context-runner-impl.js";
const __dirname = path.join(dirname(fileURLToPath(import.meta.url)), "../");
import { v4 as uuidv4 } from "uuid";

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
    // const user = await getUserById(1);
    // console.log(user);
  } catch (err) {
    console.log(err);
  }
}

async function handleUploadPage(req, res, next) {
  const userId = req.session.user.id;
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
    console.log(allFiles, "all files");

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

async function handleFolderDetailPage(req, res, next) {
  let folderId = req.query.id;
  const userId = req.session.user.id;
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
    const folderCreatedTime = formatDate(folder.createdAt, "MMM dd yyyy");
    const folderFiles = await getFolderFiles(userId, folderId);
    //if folder is public add owner id as query
    let ownerId = folder.owner_id;
    const filesWithPublicUrl = folderFiles.map((file) => {
      if (file.fileType.includes("image")) {
        return {
          ...file,
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
      size: folderSize,
      timestamp: folderCreatedTime,
      files: filesWithPublicUrl, //files array
    };

    return res.render("folder-detail", {
      folder: formattedFolder,
      public: false,
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
async function handleFileImages(req, res) {
  const fileId = Number(req.params.fileId);

  try {
    let userId = req.session.user?.id;

    const file = await getFileById(fileId, userId);

    const fileType = file.fileType;
    if (fileType.includes("image")) {
      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(`${file.fileHashedName}`, 60 * 60 * 24 * 7); // 1 week URL

      if (error) {
        return res.status(404).json({ error: "file not found in supabase." });
      }

      if (data) {
        return res.status(200).json({ imageUrl: data.signedUrl });
      } else if (file && !fileType.includes(image)) {
        return res.status(200).json({ msg: "file not  image" });
      }
    } else {
      return res.status(404).json({ error: "file not found" });
    }
  } catch (e) {
    console.log(e, "error in handle folder images");
  }
}
async function handleFolderImages(req, res) {
  const fileId = Number(req.params.fileId);

  try {
    let userId = req.session.user?.id;
    //if folder is for public get owner id not session
    if (userId === undefined) {
      const folder = await getPublicFolderByOwnerId(req.query.ownerId);
      if (folder && folder.shared) {
        userId = folder.userId;
      }
    }

    const file = await getFileById(fileId, userId);
    const folder = await getFolderById(userId, file.folderId);
    const fileType = file.fileType;
    if (fileType.includes("image")) {
      const { data, error } = await supabase.storage
        .from("folders")
        .createSignedUrl(
          `${folder.name}/${file.fileHashedName}`,
          60 * 60 * 24 * 7
        ); // 1 week URL

      if (error) {
        return res.status(404).json({ error: "file not found in supabase." });
      }

      if (data) {
        return res.status(200).json({ imageUrl: data.signedUrl });
      } else if (file && !fileType.includes(image)) {
        return res.status(200).json({ msg: "file not  image" });
      }
    } else {
      return res.status(404).json({ error: "file not found" });
    }
  } catch (e) {
    console.log(e, "error in handle folder images");
  }
}
//function to handle download file that are found inside folder
async function handleDownLoadFolderFiles(req, res) {
  const fileId = Number(req.params.fileId);
  const folderId = Number(req.query.folderId);

  let userId = req.session.user.id;

  try {
    if (folder.shared) {
      userId = folder.userId;
    }
    const file = await getFileById(fileId, userId);
    const folder = await getFolderById(userId, folderId);
    if (!file) {
      return res.status(404).json({ error: "file not found." });
    }

    // const { data, error } = await supabase.storage
    //   .from("folders")
    //   .download(`${folder.name}/${file.fileHashedName}`);
    const { data, error } = await supabase.storage
      .from("folders")
      .download(`${folder.name}/${file.fileHashedName}`);
    if (error) {
      return res.status(404).json({ error: "file not found in supabase." });
    }
    if (data) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.fileName}"`
      );
      res.setHeader("Content-Type", file.fileType);
      return res.send(Buffer.from(await data.arrayBuffer())); // Convert Blob/Buffer to Buffer and send
    } else {
      return res.status(500).json({ error: "Failed to download file." });
    }
  } catch (e) {
    console.log(e, "error while downloading file.");
  }
}
async function handleShareFolder(req, res) {
  let folderId = req.params.id;
  folderId = Number(folderId);
  const userId = req.session.user.id;
  let linkExpirationTime = Number(req.body.linkDuration) || 60 * 60; // Default to 1 hr if not provided
  const timestamp = new Date(Date.now() + `${linkExpirationTime}` * 1000);
  const backEndUrl = process.env.BACKEND_URL;

  try {
    const folder = await getFolderById(userId, folderId);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found." });
    }

    if (folder.shared) {
      const prevLinkExpirationTime = folder.link_expiration_time;
      if (prevLinkExpirationTime < linkExpirationTime) {
        const ownerId = folder.owner_id;

        const linkUrl = `${backEndUrl}/share/${ownerId}`;

        const folder = await saveSharedFolder(
          folderId,
          ownerId,
          timestamp,
          linkUrl
        );
        return res.status(200).json({ link: folder.share_link });
      }
    }
    const ownerId = uuidv4();

    const linkUrl = `${backEndUrl}/public/folder/${ownerId}`;
    const sharedFolder = await saveSharedFolder(
      folderId,
      ownerId,
      timestamp,
      linkUrl
    );
    return res.status(200).json({ link: sharedFolder.share_link });
  } catch (e) {
    console.error(e, "Error while sharing folder");
    return res.status(500).json({ error: "Internal server error." });
  }
}
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
    console.log(folder);
    const formattedFolder = {
      ...folder,
      count: FolderFilesNum,
      size: folderSize,
      timestamp: folderCreatedTime,
      files: filesWithPublicUrl, //files array
    };

    return res.render("folder-detail", {
      folder: formattedFolder,
      //if user signed make public false to show upload page link else home link shown
      public: req.session.user ? false : true,
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
      console.log(delay);

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
  handleSignIn,
  handleLogIn,
  handleUploadPage,
  handleFolderDetailPage,
  handleFolderImages,
  handleDownLoadFolderFiles,
  handleShareFolder,
  handleDisPlaySharedFolder,
  handleFileImages,
  validateUser,
  validateLogIn,
};
