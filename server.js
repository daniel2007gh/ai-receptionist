const express = require("express");
const app = express();

app.use(express.json());

app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Say voice="Polly.Amy">
        Hello. Your AI receptionist is now active.
      </Say>
    </Response>
  `);
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(10000, () => console.log("Running on port 10000"));
