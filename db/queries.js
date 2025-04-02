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
async function getUserByName(name) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        name: name,
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
async function getFolderSize(folderId) {
  try {
    const folder = await prisma.folders.findUnique({
      where: {
        id: folderId,
      },
      include: {
        _sum: {
          files: {
            size: true,
          },
        },
      },
    });
    if (folder) {
      const folderSize = count;
      return folderSize;
    }
  } catch (e) {
    console.log(e, "err while getting folder size");
  }
}
async function countFolderFiles(folderId) {
  try {
    const folder = await prisma.folders.findUnique({
      where: {
        id: folderId,
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });
  } catch (e) {
    console.log(e, "err while counting folder files");
  }
}

export {
  getUserById,
  getUserByName,
  getUserIndependentFiles,
  getUserAllFolders,
  getFolderSize,
  prisma,
};
