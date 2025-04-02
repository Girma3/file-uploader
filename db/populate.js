import pkg from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, 10);
  } catch (err) {
    console.error("Error while hashing password:", err);
    throw err;
  }
}

async function main() {
  try {
    const userPassword = await hashPassword("1234");

    // Create a user
    const user = await prisma.user.create({
      data: {
        name: "king",
        password: userPassword,
      },
    });

    // Create a folder associated with the user
    const folder = await prisma.folders.create({
      data: {
        name: "folder1",
        user: {
          connect: { id: user.id }, // Use the created user's ID
        },
      },
    });

    // Create standalone files and associate them with the user
    await prisma.files.createMany({
      data: [
        {
          name: "file1.txt",
          size: 300,
          url: "/file1.txt",
          userId: user.id, // Associate this file with the user
        },
        {
          name: "file2.txt",
          size: 400,
          url: "/file2.txt",
          folderId: folder.id, // Associate this file with the folder
          userId: user.id, // Associate this file with the user
        },
      ],
    });

    console.log("Database populated successfully.");
  } catch (error) {
    console.error("Error while populating the database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  process.exit(1);
});
