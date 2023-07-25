const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB

let URL = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
