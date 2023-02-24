const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const router = require("./routes/user-routes");

const app = express();
dotenv.config();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.json());
app.use("/api", router);

const url = String(process.env.MONGO_URL);
mongoose
  .connect(url)
  .then(() => {
    app.listen(5000, () => console.log("Server running on 5000"));
    console.log("Database connected Successfully");
  })
  .catch((err) => console.error(err));
