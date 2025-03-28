import {Router} from "express"
import { handleHomePage } from "../controllers/control.js";

const userRouter = Router();

userRouter.get("/",handleHomePage);

export default userRouter;