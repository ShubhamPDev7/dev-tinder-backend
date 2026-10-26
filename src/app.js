const express = require("express");

const app = express();

app.get("/user", (req, res) => {
  res.send({ firstName: "Shubham", lastName: "Pawar " });
});

app.post("/user", (req, res) => {
  res.send("Data successfully saved to the database");
});

app.delete("/user", (req, res) => {
  res.send("Deleted user successfu lly");
});

app.use("/test", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777...");
});
