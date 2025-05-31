import {
  deleteFolder,
  getFolderById,
  countFolderFiles,
} from "../db/folder-queries.js";
import {
  addFileToFolder,
  getFileById,
  getFileByName,
  addIndependentFile,
  deleteFile,
} from "../db/file-queries.js";

import supabase from "../db/supabase.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

async function handleAddFileToFolder(req, res, next) {
  let folderId = req.query.id;
  const userId = req.user.id;
  folderId = Number(folderId);

  if (!folderId || !userId) {
    return res.status(401).json({ msg: "Folder ID or User ID not found." });
  }

  const fileOriginalName = req.file.originalname;
  const fileHashedName = req.file.hashedFileName;
  const fileType = req.file.mimetype;
  const fileSize = req.file.size;

  const homeDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");
  const uploadDir = path.join(homeDir, "uploads");
  const filePath = path.join(uploadDir, req.file.hashedFileName);
  try {
    const folder = await getFolderById(userId, folderId);
    if (!folder) {
      return res.status(404).json({ msg: "Folder not found." });
    }
    const filePathToSupaBase = `${folder.name}/${fileHashedName}`;
    // console.log(fileOriginalName, fileHashedName, uploadDir);

    // Upload file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from("folders")
      .upload(filePathToSupaBase, fs.createReadStream(filePath), {
        cacheControl: "3600",
        duplex: "half",
        upsert: true,
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError);
      return res.status(500).json({ msg: "Error uploading file to Supabase." });
    }

    // Save file to database
    const fileUrlToSupaBase = data.fullPath;
    const file = await addFileToFolder(
      fileOriginalName,
      fileHashedName,
      fileType,
      fileSize,
      fileUrlToSupaBase,
      folderId,
      userId
    );

    //remove local upload
    if (fs.existsSync(uploadDir)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({ redirect: `/folder/detail/?id=${folderId}` });
  } catch (error) {
    console.error("Error while adding file to folder:", error);
    return res.status(500).json({ msg: "Error while adding file to folder." });
  }
}
async function handleAddIndependentFile(req, res) {
  const userId = req.user.id;
  const uploads = [req.file];

  try {
    const fileExist = await getFileByName(uploads[0].originalName, userId);
    if (fileExist) {
      return res.status(401).json({ msg: "file already exist." });
    }
    // Handles both single and array uploads
    const homeDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");
    const uploadDir = path.join(homeDir, "uploads");

    const uploadPromises = uploads.map(async (file) => {
      const filePath = path.join(uploadDir, file.hashedFileName);

      // Upload to Supabase (cloud storage)

      const { data, error: uploadError } = await supabase.storage

        .from("files")
        .upload(file.hashedFileName, fs.createReadStream(filePath), {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
          duplex: "half",
        });

      if (uploadError) throw uploadError;

      return data; // Return the Supabase upload result */
    });

    const results = await Promise.all(uploadPromises);

    // delete local files after successful upload
    uploads.forEach((file) => {
      console.log(file);
      const filePath = path.join(uploadDir, file.hashedFileName);
      fs.unlinkSync(filePath);
    });

    const fileOriginalName = uploads[0].originalname;
    const fileHashedName = uploads[0].hashedFileName;
    const filePathToSupaBase = `files/${fileHashedName}`;
    const fileType = uploads[0].mimetype;
    const fileSize = uploads[0].size;
    //save file to db
    const file = await addIndependentFile(
      fileOriginalName,
      fileHashedName,
      fileType,
      fileSize,
      filePathToSupaBase,
      userId
    );
    res.status(200).json({
      message: "Files uploaded to Supabase (cloud storage) successfully!",
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading files", error });
  }
}
async function handleDeleteFile(req, res, next) {
  let fileId = req.params.id;
  const folderId = req.query.folderId;
  const userId = req.user.id;
  fileId = Number(fileId);

  try {
    const fileToDelete = await getFileById(fileId, userId);
    const file = await deleteFile(userId, fileId);
    const folder = await getFolderById(userId, fileToDelete.folderId);
    const filesInFolder = await countFolderFiles(userId, fileToDelete.folderId);

    const { data, error } = await supabase.storage
      .from("folders")
      .remove([`${folder.name}/${file.fileHashedName}`]);

    if (error) {
      console.error("Error deleting file from Supabase:", error);
      return res
        .status(500)
        .json({ msg: "Error deleting file from Supabase." });
    }

    if (!file) {
      return res.status(401).json({ msg: "file not deleted." });
    }

    if (file && filesInFolder > 0) {
      return res
        .status(200)
        .json({ redirect: `/folder/detail/?id=${fileToDelete.folderId}` });
    } else if (file && filesInFolder === 0) {
      //remove folder form db and supabase since it's empty
      const { data: folderData, error: folderError } = await supabase.storage
        .from("folders")
        .remove([`${folder.name}`]);
      const folderDelete = await deleteFolder(userId, folderId);
      if (folderError || !folderDelete) {
        console.error("Error deleting folder from Supabase:", folderError);
        return res
          .status(500)
          .json({ msg: "Error deleting folder from Supabase." });
      }

      return res.status(200).json({ redirect: `/upload-page` });
    }
  } catch (e) {
    console.log(e, "err while deleting file.");
  }
}
async function handleDownloadIndependentFile(req, res) {
  const fileId = Number(req.params.fileId);
  let userId = req.user.id;

  try {
    const file = await getFileById(fileId, userId);

    if (!file) {
      return res.status(404).json({ error: "file not found." });
    }
    const { data, error } = await supabase.storage
      .from("files")
      .download(`${file.fileHashedName}`);
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
async function handleFileImages(req, res) {
  const fileId = Number(req.params.fileId);

  try {
    let userId = req.user?.id;

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
export {
  handleAddFileToFolder,
  handleDeleteFile,
  handleAddIndependentFile,
  handleDownloadIndependentFile,
  handleFileImages,
};
