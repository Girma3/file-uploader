import express from "express";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();

import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma from "./db/queries.js";
import passport from "./authentication/passportConfig.js";
import userRouter from "./routes/route.js";

const app = express();
//console.log(prisma);

app.set("view engine", "ejs");
//app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.set("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
        res.set("Content-Type", "text/css");
      }
    },
  })
);

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: "man at garden",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      // dbRecordIdFunction: undefined,
    }),
  })
);
//app.use(passport.initialize());
app.use(passport.session());
app.use("/", userRouter);

const PORT = process.env.PORT || 3400;
app.listen(PORT, () => {
  console.log("server running...");
});
