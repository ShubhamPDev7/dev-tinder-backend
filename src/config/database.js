const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://shubhampawar5929_db_user:xOP7XX1i6ORAWee6@mavinaya1.qaho4pd.mongodb.net/devTinder",
  );
};

module.exports = connectDB;
