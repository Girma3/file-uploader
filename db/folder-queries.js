import prisma from "./queries.js";
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
async function editFolderFilesUrl(userId, folderId, newUrl) {
  try {
    const files = await prisma.files.updateMany({
      where: {
        userId: userId,
        folderId: folderId,
      },
      data: {
        url: newUrl,
      },
    });
    return files;
  } catch (e) {
    console.log(e, "err while editing folder files url");
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
//functions to handle shared folder operation
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

export {
  addFolder,
  getUserAllFolders,
  getFolderById,
  getFolderByName,
  getFolderSize,
  countFolderFiles,
  editFolderName,
  editFolderFilesUrl,
  deleteFolder,
  saveSharedFolder,
  getNextExpiringPublicFolder,
  getPublicFolderByOwnerId,
  unShareFolder,
};
