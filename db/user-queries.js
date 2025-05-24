import prisma from "./queries.js";
async function addNewUser(userName, userPassword) {
  try {
    const user = await prisma.user.create({
      data: {
        name: userName,
        password: userPassword,
      },
    });
    return user;
  } catch (e) {
    console.log(e, "error while adding new user");
  }
}
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
async function deleteUser(id) {
  try {
    const files = await prisma.files.deleteMany({
      where: {
        userId: id,
      },
    });
    const folders = await prisma.folders.deleteMany({
      where: {
        userId: id,
      },
    });
    const user = await prisma.user.delete({
      where: {
        id: id,
      },
    });
    return user;
  } catch (e) {
    console.log(e, "err while deleting user");
  }
}

export { addNewUser, getUserById, getUserByName, deleteUser };
