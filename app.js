import express from "express";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();
import passport from "./authentication/passportConfig.js";
import userRouter from "./routes/route.js";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
//app.use(session({}));
//app.use(passport.initialize());
//app.use(passport.session())

app.use(userRouter);

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log("server running...");
});
