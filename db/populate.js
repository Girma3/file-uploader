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
        name: "upload-me",
        user: {
          connect: { id: user.id },
        },
      },
    });

    // Create standalone files and associate them with the user
    await prisma.files.createMany({
      data: [
        {
          fileOriginalName: "OIP.jpeg",
          fileHashedName:
            "f0f0f46c6bd135c51ec55c626e80d64e134fc1996d3ee2c6336a55a420de1909.jpeg",
          fileType: "image/jpeg",
          fileSize: 22874,
          createdAt: new Date(),
          url: "folders/upload-me/f0f0f46c6bd135c51ec55c626e80d64e134fc1996d3ee2c6336a55a420de1909.jpeg",
          folderId: folder.id,
          userId: user.id,
        },
        {
          fileOriginalName: "Pinterest_Download (20).jpg",
          fileHashedName:
            "eeb40e22460168d8a4945c07a66e8ad46db6a516871a695d80acd8d77484e8f7.jpg",
          fileType: "image/jpeg",
          fileSize: 64711,
          createdAt: new Date(),
          url: "folders/upload-me/eeb40e22460168d8a4945c07a66e8ad46db6a516871a695d80acd8d77484e8f7.jpg",
          folderId: folder.id,
          userId: user.id,
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
