const express = require("express");

const app = express();

app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">
    Hello, this is your AI receptionist. How can I help you today?
  </Say>
</Response>`);
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(10000, () => console.log("Running"));
