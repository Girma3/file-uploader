import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "./prisma/generated/prisma-client/index.js";
const prisma = new PrismaClient();
export default prisma;
