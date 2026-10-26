const express = require("express");

const app = express();

app.get("/user/:userId", (req, res) => {
  console.log(req.params);
  res.send({ firstName: "Shubham", lastName: "Pawar " });
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777...");
});
