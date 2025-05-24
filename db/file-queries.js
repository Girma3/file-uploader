import prisma from "./queries.js"
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
//functions  for files that is not in the folder
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
//folder files operation
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

export {
  getFileById,
  getFileByName,
  getFileByHashedName,
  deleteFile,
  getUserIndependentFiles,
  addIndependentFile,
  addFileToFolder,
  getFolderFiles,
}
