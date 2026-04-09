const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://ai-receptionist.onrender.com/stream" />
      </Connect>
    </Response>
  `);
});

const server = app.listen(10000, () => console.log("Running"));

const wss = new WebSocket.Server({ server, path: "/stream" });

wss.on("connection", (ws) => {
  console.log("Twilio connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "media") {
      console.log("Receiving audio...");
    }
  });

  ws.on("close", () => console.log("Call ended"));
});
