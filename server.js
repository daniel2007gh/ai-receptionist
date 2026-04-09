const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/respond" method="POST">
    <Say>Hello, how can I help you today?</Say>
  </Gather>
</Response>`);
});

app.post("/respond", (req, res) => {
  const userSpeech = req.body.SpeechResult || "I didn't hear anything";

  // SIMPLE AI LOGIC (we upgrade later)
  let reply = "Sorry, I didn't understand.";

  if (userSpeech.toLowerCase().includes("appointment")) {
    reply = "Sure, I can help you book an appointment.";
  } else if (userSpeech.toLowerCase().includes("hours")) {
    reply = "We are open from 9 AM to 5 PM.";
  } else {
    reply = "Thanks for calling, how else can I help?";
  }

  res.type("text/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${reply}</Say>
  <Redirect>/voice</Redirect>
</Response>`);
});

app.listen(10000, () => console.log("Running"));
