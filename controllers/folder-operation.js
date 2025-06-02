import {
  addFolder,
  getFolderById,
  getFolderByName,
  saveSharedFolder,
  getPublicFolderByOwnerId,
  editFolderName,
  deleteFolder,
  editFolderFilesUrl,
} from "../db/folder-queries.js";
import {
  addFileToFolder,
  getFolderFiles,
  getFileById,
} from "../db/file-queries.js";

import supabase from "../db/supabase.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { body, validationResult } from "express-validator";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";

const validateFolderName = [
  body("folderName").trim().notEmpty().withMessage("name can't be empty!"),
];

async function handleOpenFolder(req, res, next) {
  let folderId = req.params.id;
  const userId = req.user.id;

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "folder id or user id not found." });
  }
  folderId = Number(folderId);

  try {
    const folder = await getFolderById(userId, folderId);

    if (!folder) {
      return res.status(401).json({ msg: "folder not found." });
    }

    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (e) {
    console.log(e, "err while opening folder.");
  }
}
async function handleNewFolder(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors });
  }
  const userId = req.user.id;
  const folderName = [req.body.files][0].folderName;
  console.log(folderName, "folder name");

  const homeDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");

  const uploadDir = path.join(homeDir, "uploads", folderName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const folderExist = await getFolderByName(folderName, userId);
    if (folderExist) {
      return res.status(401).json({ msg: "folder already exists." });
    }
    const folder = await addFolder(folderName, userId);
    if (!folder) {
      return res.status(401).json({ msg: "folder not added." });
    }

    return res
      .status(200)
      .json({ redirect: `/folder/detail/?id=${folder.id}` });
  } catch (e) {
    console.log(e, "err while adding new folder.");
  }
}
async function handleDeleteFolder(req, res, next) {
  let folderId = req.params.id;
  const userId = req.user.id;
  folderId = Number(folderId);

  try {
    const folder = await deleteFolder(userId, folderId);
    const { data, error } = await supabase.storage
      .from("folders")
      .remove([`folders/${folder.name}`]);
    if (!folder || error) {
      return res.status(401).json({ msg: "folder not deleted." });
    }

    return res.status(200).json({ redirect: `/upload-page` });
  } catch (e) {
    console.log(e, "err while deleting folder");
  }
}
async function handleEditFolderJson(req, res, next) {
  const folderId = req.params.id;
  const userId = req.user.id;
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
async function handleEditFolderName(req, res) {
  const errors = validationResult(req);
  let folderId = Number(req.params.id);
  const userId = req.user.id;
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors.array() });
  }
  const folderName = req.body.folderName;

  try {
    const { name } = await getFolderById(userId, folderId);
    const folderUpdated = await editFolderName(userId, folderId, folderName);
    if (!folderUpdated) {
      return res.status(401).json({ msg: "Folder not edited." });
    }

    const { data: files, error } = await supabase.storage
      .from("folders")
      .list(name);

    if (error) {
      console.error("Error fetching folder files:", error);
      return res.status(401).json({ msg: "Error retrieving folder contents." });
    }

    if (!files || files.length === 0) {
      await handleEmptyFolder(name, folderName);
    } else {
      const edit = await handleNonEmptyFolder(name, folderName, files);
      const folderFiles = await getFolderFiles(userId, folderId);
      const baseUrl = `folders/${folderName}`;
      if (edit && folderFiles.length > 0) {
        for (const file of folderFiles) {
          //update file url that used  to get it from supabase
          await editFolderFilesUrl(
            userId,
            file.folderId,
            `${baseUrl}/${file.fileHashedName}`
          );
        }
      }
    }

    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (e) {
    console.error("Error while editing folder name:", e);
    return res.status(500).json({ msg: "Server error while renaming folder." });
  }
}

async function handleEmptyFolder(foldName, newName) {
  // Create a placeholder file
  const { data: file, error: uploadError } = await supabase.storage
    .from("folders")
    .upload(`${foldName}/placeholder.txt`, new Blob(["This is a temp file"]), {
      contentType: "text/plain",
    });

  if (uploadError) {
    console.error("Error creating placeholder file:", uploadError);
    return;
  }

  // Move placeholder file to the new folder name
  const { error: moveError } = await supabase.storage
    .from("folders")
    .move(`${foldName}/placeholder.txt`, `${newName}/placeholder.txt`);

  if (moveError) {
    console.error("Error moving placeholder file:", moveError);
    return;
  }

  // Delete the placeholder file
  await supabase.storage.from("folders").remove([`${newName}/placeholder.txt`]);
}

async function handleNonEmptyFolder(oldName, newName, files) {
  for (const file of files) {
    const { error } = await supabase.storage
      .from("folders")
      .move(`${oldName}/${file.name}`, `${newName}/${file.name}`);

    if (error) {
      console.error(`Error moving file ${file.name}:`, error);
    }
  }
  await supabase.storage.from("folders").remove([oldName]);
  return true;
}

async function handleAddFolderWithFiles(req, res, next) {
  // Add folder with Files{
  const userId = req.user.id;
  const uploads = req.files; // Handle multiple files
  //foldername saved from file
  const folderName = uploads[0].folderName;

  try {
    const homeDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");
    const uploadDir = path.join(homeDir, "uploads", folderName); // Include folder in path
    let folder = await getFolderByName(folderName, userId); // Check if folder exists
    if (!folder) {
      folder = await addFolder(folderName, userId); // Add only if it doesn't exist
    }

    // Upload each file to Supabase
    const uploadPromises = uploads.map(async (file) => {
      const filePath = path.join(uploadDir, file.hashedFileName);

      const { data, error: uploadError } = await supabase.storage
        .from("folders")
        .upload(
          `${folderName}/${file.hashedFileName}`,
          fs.createReadStream(filePath),
          {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
            duplex: "half",
          }
        );

      if (uploadError) throw uploadError;

      // save file info along with folder name to db
      const fileOriginalName = file.originalname;
      const fileHashedName = file.hashedFileName;
      const fileType = file.mimetype;
      const fileSize = file.size;
      const filePathToSupaBase = `folders/${folderName}/${fileHashedName}`; //  file path
      const folderId = folder.id;
      const fileEntry = await addFileToFolder(
        fileOriginalName,
        fileHashedName,
        fileType,
        fileSize,
        filePathToSupaBase,
        folderId,
        userId
      );

      return { supabaseData: data, fileEntry };
    });

    const results = await Promise.all(uploadPromises);
    const failedUploads = results.filter((r) => r.error);

    if (failedUploads.length > 0) {
      return res.status(401).json({
        message: "Some files failed to upload.",
        errors: failedUploads,
      });
    }

    // Delete local files after upload
    uploads.forEach((file) => {
      const filePath = path.join(uploadDir, file.hashedFileName);
      fs.unlinkSync(filePath);
    });
    //delete uploaded folder from local uploads folder
    fs.rmSync(uploadDir, { recursive: true, force: true });

    res.status(200).json({
      message: `Files uploaded successfully from folder: ${folderName}!`,
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading files", error });
  }
}

async function handleDownloadFolder(req, res) {
  const userId = req.user.id;
  let folderId = Number(req.params.id);

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "Folder ID or User ID not found." });
  }

  try {
    const folder = await getFolderById(userId, folderId);
    const folderFiles = await getFolderFiles(userId, folderId);

    if (!folder || !folderFiles.length) {
      return res.status(404).json({ msg: "Folder or files not found." });
    }

    const zip = new JSZip();
    // fetch files and add to ZIP
    await Promise.all(
      folderFiles.map(async (file) => {
        const { data, error } = await supabase.storage
          .from("folders")
          .download(`${folder.name}/${file.fileHashedName}`);

        if (!error) {
          const arrayBuffer = await data.arrayBuffer();
          zip.file(file.fileOriginalName, arrayBuffer);
        }
      })
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    if (!zipBuffer) {
      return res
        .status(401)
        .json({ msg: "Failed to create ZIP to download folder." });
    }
    // set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${folder.name}.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    return res.send(zipBuffer);
  } catch (e) {
    console.error(e, "Error while downloading folder");
    return res.status(500).json({ error: "Internal server error." });
  }
}
async function handleShareFolder(req, res) {
  let folderId = req.params.id;
  folderId = Number(folderId);
  const userId = req.user.id;
  let linkExpirationTime = Number(req.body.linkDuration) || 60 * 60; // Default to 1 hr if not provided

  // add user time to the current time
  const timeStamp = new Date(Date.now() + linkExpirationTime * 1000);
  const backEndUrl = process.env.BACKEND_URL;

  try {
    const folder = await getFolderById(userId, folderId);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found." });
    }

    if (folder.shared) {
      const prevLinkExpirationTime = new Date(folder.link_expiration);
      const effectiveTimeExpiration =
        prevLinkExpirationTime > timeStamp ? prevLinkExpirationTime : timeStamp;

      const ownerId = folder.owner_id;
      const linkUrl = `${backEndUrl}/public/folder/${ownerId}`;

      const updatedFolder = await saveSharedFolder(
        folderId,
        ownerId,
        effectiveTimeExpiration,
        linkUrl
      );
      return res.status(200).json({ link: updatedFolder.share_link });
    }
    const ownerId = uuidv4();

    const linkUrl = `${backEndUrl}/public/folder/${ownerId}`;
    const sharedFolder = await saveSharedFolder(
      folderId,
      ownerId,
      timeStamp,
      linkUrl
    );
    return res.status(200).json({ link: sharedFolder.share_link });
  } catch (e) {
    console.error(e, "Error while sharing folder");
    return res.status(500).json({ error: "Internal server error." });
  }
}
async function handleDownLoadFolderFiles(req, res) {
  const fileId = Number(req.params.fileId);
  const folderId = Number(req.query.folderId);

  let userId = req.user.id;

  try {
    const folder = await getFolderById(userId, folderId);
    const file = await getFileById(fileId, userId);
    if (folder.shared) {
      userId = folder.userId;
    }
    if (!file) {
      return res.status(404).json({ error: "file not found." });
    }

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
async function handleFolderImages(req, res) {
  const fileId = Number(req.params.fileId);

  try {
    let userId = req.user?.id;
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
export {
  handleOpenFolder,
  handleAddFolderWithFiles,
  handleNewFolder,
  handleDeleteFolder,
  handleEditFolderJson,
  handleEditFolderName,
  handleDownloadFolder,
  handleShareFolder,
  handleDownLoadFolderFiles,
  handleFolderImages,
  validateFolderName,
};
