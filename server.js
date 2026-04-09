const express = require("express");
const WebSocket = require("ws");
const axios = require("axios");

const app = express();
app.use(express.urlencoded({ extended: true }));

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://ai-receptionist-production-5fe7.up.railway.app" />
  </Connect>
</Response>`);
});

const server = app.listen(10000, () => {
  console.log("Running");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Twilio connected");

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "media") {
        const audio = data.media.payload;

        const response = await axios.post(
          "https://api.elevenlabs.io/v1/convai",
          {
            audio: audio,
            agent_id: AGENT_ID
          },
          {
            headers: {
              "xi-api-key": ELEVEN_API_KEY
            }
          }
        );

        ws.send(JSON.stringify({
          event: "media",
          media: {
            payload: response.data.audio
          }
        }));
      }
    } catch (err) {
      console.log("Error:", err.message);
    }
  });

  ws.on("close", () => console.log("Call ended"));
});
