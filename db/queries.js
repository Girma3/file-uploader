import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "./prisma/generated/prisma-client/index.js";
import { GoTrueAdminApi } from "@supabase/supabase-js";
const prisma = new PrismaClient();

async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  } catch (e) {
    console.log(e, "error while getting user by id.");
  }
}
async function getUserByName(userName) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        name: userName,
      },
    });
    return user;
  } catch (e) {
    console.log(e, "error while getting user by name.");
  }
}
//folder operation
async function addFolder(folderName, userId) {
  try {
    const uploadFolder = await prisma.folders.create({
      data: {
        name: folderName,
        userId: userId,
      },
    });
    return uploadFolder;
  } catch (e) {
    console.log(e, "err while adding file.");
  }
}
async function getUserAllFolders(userId) {
  try {
    const folders = await prisma.folders.findMany({
      where: {
        userId: userId,
      },
    });
    return folders;
  } catch (e) {
    console.log(e, "error while getting all folders.");
  }
}

async function getFolderSize(userId, folderId) {
  if (!userId || !folderId) {
    return null;
  }
  folderId = Number(folderId);
  try {
    const folder = await prisma.folders.findFirst({
      where: {
        id: folderId,
        userId: userId,
      },
      include: {
        files: {
          select: {
            fileSize: true,
          },
        },
      },
    });
    if (folder) {
      const folderSize = folder.files.reduce(
        (total, file) => total + file.fileSize,
        0
      );
      return folderSize;
    }
    return 0;
  } catch (e) {
    console.log(e, "err while getting folder size");
  }
}
async function countFolderFiles(userId, folderId) {
  if (!userId || !folderId) {
    return null;
  }
  folderId = Number(folderId);
  try {
    const folder = await prisma.folders.findUnique({
      where: {
        id: folderId,
        userId: userId,
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });
    return folder._count.files;
  } catch (e) {
    console.log(e, "err while counting folder files");
  }
}
async function getFolderById(userId, folderId) {
  if (!userId || !folderId) {
    return null;
  }
  folderId = Number(folderId);

  try {
    const folder = await prisma.folders.findFirst({
      where: {
        id: folderId,
        userId: userId,
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "error while getting folder by id.");
  }
}
async function getFolderByName(folderName, userId) {
  try {
    const folder = await prisma.folders.findFirst({
      where: {
        name: folderName,
        userId: userId,
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "error while getting folder by name.");
  }
}
async function editFolderName(userId, folderId, folderName) {
  try {
    const folder = await prisma.folders.update({
      where: {
        id: folderId,
        userId: userId,
      },
      data: {
        name: folderName,
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "err while editing folder");
  }
}
async function deleteFolder(userId, folderId) {
  try {
    // delete all files in the folder first
    await prisma.files.deleteMany({
      where: {
        userId: userId,
        folderId: folderId,
      },
    });

    // delete the folder itself
    await prisma.folders.deleteMany({
      where: {
        userId: userId,
        id: folderId,
      },
    });
    return true;
  } catch (e) {
    console.log(e, "err while deleting folder and its files");
  }
}
//file operation
async function getFolderFiles(userId, folderId) {
  folderId = Number(folderId);
  try {
    const folderFiles = await prisma.files.findMany({
      where: {
        userId: userId,
        folderId: folderId,
      },
    });
    return folderFiles;
  } catch (e) {
    console.log(e, "err while getting folder files.");
  }
}

async function addIndependentFile(
  fileOriginalName,
  fileHashedName,
  fileType,
  fileSize,
  filePath,
  userId
) {
  try {
    const uploadFile = await prisma.files.create({
      data: {
        fileOriginalName: fileOriginalName,
        fileHashedName: fileHashedName,
        fileType: fileType,
        fileSize: fileSize,
        url: filePath,
        userId: userId,
      },
    });
    return uploadFile;
  } catch (e) {
    console.log(e, "err while adding file.");
  }
}

async function getUserIndependentFiles(userId) {
  try {
    const files = await prisma.files.findMany({
      where: {
        userId: userId,
        folderId: null,
      },
    });
    return files;
  } catch (e) {
    console.log(e, "error while getting all files.");
  }
}

async function addFileToFolder(
  fileOriginalName,
  fileHashedName,
  fileType,
  fileSize,
  url,
  folderId,
  userId
) {
  try {
    const file = await prisma.files.create({
      data: {
        fileOriginalName: fileOriginalName,
        fileHashedName: fileHashedName,
        fileType: fileType,
        fileSize: fileSize,
        url: url,
        folderId: folderId,
        userId: userId,
      },
    });
    return file;
  } catch (e) {
    console.log(e, "err while adding file to folder.");
  }
}

async function deleteFile(userId, fileId) {
  try {
    await prisma.files.delete({
      where: {
        userId: userId,
        id: fileId,
      },
    });
    return true;
  } catch (e) {
    console.log(e, "err while removing file.");
  }
}
async function getFileByHashedName(fileHashedName, userId) {
  try {
    const file = await prisma.files.findFirst({
      where: {
        fileHashedName: fileHashedName,
        userId: userId,
      },
    });
    return file;
  } catch (e) {
    console.log(e, "error while getting file by name.");
  }
}
async function getFileByName(fileName, userId) {
  try {
    const file = await prisma.files.findFirst({
      where: {
        fileOriginalName: fileName,
        userId: userId,
      },
    });
    return file;
  } catch (e) {
    console.log(e, "error while getting file by name.");
  }
}
async function getFileById(fileId, userId) {
  try {
    const file = await prisma.files.findUnique({
      where: {
        id: fileId,
        userId: userId,
      },
    });
    return file;
  } catch (e) {
    console.log(e, "error while getting file by id.");
  }
}
async function saveSharedFolder(
  folderId,
  ownerId,
  linkExpirationTime,
  shareLink
) {
  try {
    const sharedFolder = await prisma.folders.update({
      where: {
        id: folderId,
      },
      data: {
        owner_id: ownerId,
        link_expiration: linkExpirationTime,
        share_link: shareLink,
        shared: true,
      },
    });
    return sharedFolder;
  } catch (e) {
    console.log(e, "error while saving shared folder");
  }
}
async function unShareFolder(folderId) {
  try {
    const folder = await prisma.folders.update({
      where: {
        id: folderId,
      },
      data: {
        owner_id: null,
        link_expiration: null,
        share_link: null,
        shared: false,
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "error while un sharing folder");
  }
}
async function getPublicFolderByOwnerId(userId, ownerId) {
  try {
    const folder = await prisma.folders.findFirst({
      where: {
        owner_id: ownerId,
        shared: true,
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "error while getting folder by owner id");
  }
}
async function getNextExpiringPublicFolder(userId) {
  try {
    const folder = await prisma.folders.findFirst({
      where: {
        userId: userId,
        shared: true,
        link_expiration: {
          not: null,
        },
      },
      orderBy: {
        link_expiration: "asc",
      },
    });
    return folder;
  } catch (e) {
    console.log(e, "error while getting next expiring public folder");
  }
}
export {
  getUserById,
  getUserByName,
  getUserIndependentFiles,
  getUserAllFolders,
  getFolderById,
  getFolderByName,
  getFolderSize,
  addFolder,
  editFolderName,
  deleteFolder,
  countFolderFiles,
  getFolderFiles,
  addIndependentFile,
  addFileToFolder,
  deleteFile,
  getFileByHashedName,
  getFileByName,
  getFileById,
  saveSharedFolder,
  unShareFolder,
  getPublicFolderByOwnerId,
  getNextExpiringPublicFolder,
  prisma,
};
