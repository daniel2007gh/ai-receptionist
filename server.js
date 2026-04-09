import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://${req.headers.host}/ws" />
      </Connect>
    </Response>
  `);
});

const server = app.listen(PORT, () => {
  console.log("Server running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("📞 Call started");

  const deepgram = new WebSocket(
    "wss://api.deepgram.com/v1/listen",
    ["token", process.env.DEEPGRAM_API_KEY]
  );

  deepgram.on("message", async (msg) => {
    const data = JSON.parse(msg.toString());
    const transcript = data.channel?.alternatives?.[0]?.transcript;

    if (transcript && data.is_final) {
      console.log("User:", transcript);

      const gptResponse = await getGPT(transcript);

      await speak(ws, gptResponse.reply);

      // If booking detected → send to Make.com
      if (gptResponse.book) {
        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gptResponse.details),
        });
      }
    }
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.event === "media") {
      const audio = Buffer.from(data.media.payload, "base64");
      deepgram.send(audio);
    }
  });

  ws.on("close", () => {
    deepgram.close();
  });
});

// ---------------- GPT ----------------

async function getGPT(text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a professional hair salon receptionist.

If the user wants to book:
Extract:
- name
- service
- date
- time

Return JSON:
{
  "reply": "...",
  "book": true/false,
  "details": { ... }
}
          `,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await res.json();

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return {
      reply: data.choices[0].message.content,
      book: false,
      details: {},
    };
  }
}

// ---------------- ELEVENLABS ----------------

async function speak(ws, text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2",
      }),
    }
  );

  const audioBuffer = await res.arrayBuffer();

  ws.send(
    JSON.stringify({
      event: "media",
      media: {
        payload: Buffer.from(audioBuffer).toString("base64"),
      },
    })
  );
}
