require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");


// use the Express JSON middleware
app.use(express.json());

// create the twilioClient

const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const findOrCreateRoom = async (roomName) => {
  try {
    // see if the room exists already. If it doesn't, this will throw
    // error 20404.
    await twilioClient.video.v1.rooms(roomName).fetch();
  } catch (error) {
    // the room was not found, so create it
    if (error.code == 20404) {
      await twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type: "go",
      });
    } else {
      // let other errors bubble up
      console.log(error)
      throw error;
      
    }
  }
};

const getAccessToken = (roomName) => {
  // create an access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    // generate a random unique identity for this participant
    { identity: uuidv4() }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};
const getMeetingId=async ()=>{
  const fetch = require("cross-fetch");

  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmFwcGVhci5pbiIsImF1ZCI6Imh0dHBzOi8vYXBpLmFwcGVhci5pbi92MSIsImV4cCI6OTAwNzE5OTI1NDc0MDk5MSwiaWF0IjoxNjY1NzkyMTY1LCJvcmdhbml6YXRpb25JZCI6MTcxMDY5LCJqdGkiOiI1MTgwYmU5NS01OGIxLTQwNDgtOTgxYS02ZGQxZDM4YTZmYzUifQ.gSID7BReKrhb0fQS79rmtoVIMqqx6ryVhRqIG7DdhbQ";
  var url=''
  const data = {
    endDate: "2099-02-18T14:23:00.000Z",
    fields: ["hostRoomUrl"],
  };
  
      await fetch("https://api.whereby.dev/v1/meetings", {
          method: "POST",
          headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept",
              "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
      }).then(async res => {
      //console.log(res);
      const data = await res.json();
      console.log("Room URL:", data.roomUrl);
      url=data.roomUrl
     // console.log("Host room URL:", data.hostRoomUrl);
     
  })
  console.log("ar",url)
return url
}

app.use(cors());

app.post("/join-room", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body || !req.body.roomName) {
    return res.status(400).send("Must include roomName argument.");
  }
  const roomName = req.body.roomName;
  // find or create a room with the given roomName
  findOrCreateRoom(roomName);
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName);
  res.send({
    token: token,
  });
});

app.post("/get-Meeting-Id", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  const meetingUrl=await getMeetingId()
  // find or create a room with the given roomName
  // generate an Access Token for a participant in this room
  console.log("meetingURL------>",meetingUrl)
  console.log("reqRoomName",req.body.roomName)
  res.send({
    meetingURL:meetingUrl,
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("public/index.html");
});
