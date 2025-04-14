import dotenv from "dotenv";
dotenv.config();
import dpkg from "@prisma/client";
const { PrismaClient } = dpkg;
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
            size: true,
          },
        },
      },
    });
    if (folder) {
      const folderSize = folder.files.reduce(
        (total, file) => total + file.size,
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
async function addIndependentFile(filePath, userId) {
  try {
    const uploadFile = await prisma.files.create({
      data: {
        url: filePath,
        userId: userId,
      },
    });
    return uploadFile;
  } catch (e) {
    console.log(e, "err while adding file.");
  }
}
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
async function addFileToFolder(folderId, userId, name, url) {
  try {
    const file = await prisma.files.create({
      data: {
        folderId: folderId,
        userId: userId,
        name: name,
        url: url,
      },
    });
    return file;
  } catch (e) {
    console.log(e, "err while adding file to folder.");
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

export {
  getUserById,
  getUserByName,
  getUserIndependentFiles,
  getUserAllFolders,
  getFolderById,
  getFolderSize,
  countFolderFiles,
  getFolderFiles,
  prisma,
  addFolder,
  addIndependentFile,
  addFileToFolder,
  deleteFolder,
  deleteFile,
  editFolderName,
};
