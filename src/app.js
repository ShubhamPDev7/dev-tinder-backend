const express = require("express");

const app = express();

app.use("/", (req, res) => {
  res.send("Welcome to Namaste NodeJS");
});

app.use("/meow", (req, res) => {
  res.send("Meow Meow Meow");
});

app.use("/hello", (req, res) => {
  res.send("Hello Hello Hello");
});

app.use("/test", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777...");
});
