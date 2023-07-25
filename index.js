import express from "express";
import cors from "cors";
import fs from "fs";
const morgan = require("morgan");
import csrf from "csurf";
import cookieParser from "cookie-parser";
require("dotenv").config();
import mongoose from "mongoose";

//create express app
const app = express();

//csrf cookie

const csrfProtection = csrf({ cookie: true });

//connect to db
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

//middleware for express
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

//router
fs.readdirSync("./routes").map((r) => {
  app.use("/api/v1", require(`./routes/${r}`));
});

//csrf
app.use(csrfProtection);

app.get("/api/v1/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// app.use("/api/v1", router);

const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
  console.log(`App running on port ${PORT}!`);
});
