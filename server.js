const express = require("express");
const WebSocket = require("ws");

const app = express();

/* IMPORTANT: Twilio needs URL-encoded, not JSON */
app.use(express.urlencoded({ extended: true }));

app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you now.</Say>
  <Connect>
    <Stream url="wss://ai-receptionist-production-5fe7.up.railway.app" />
  </Connect>
</Response>`);
});

const server = app.listen(10000, () => {
  console.log("Running on port 10000");
});

/* WebSocket server */
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("✅ Twilio connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "media") {
        console.log("🎤 Receiving audio...");
      }
    } catch (err) {
      console.log("⚠️ Parse error");
    }
  });

  ws.on("close", () => console.log("❌ Call ended"));
});
