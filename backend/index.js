import express from "express";
import ImageKit from "imagekit";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Chat from "./models/Chat.js";
import UserChats from "./models/userChats.js";
import { clerkAuthMiddleware } from "./middlewares/clerkAuth.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB once (cache connection for serverless)
let isConnected = false;
const connect = async () => {
  if (isConnected) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URL);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};
// Connect immediately on cold start
connect();

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

app.get("/api/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.get("/api/test", clerkAuthMiddleware, (req, res) => {
  const userId = req.user.id;
  console.log("Authenticated userId (/api/test):", userId);
  console.log("Request headers:", req.headers);

  res.status(200).json({
    message: "User is authenticated",
    user: {
      id: userId,
    },
  });
});

app.post("/api/chats", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("Authenticated userId (POST /api/chats):", userId);

  const { text } = req.body;

  try {
    const newChat = new Chat({
      userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    const userChats = await UserChats.find({ userId });

    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
    } else {
      await UserChats.updateOne(
        { userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
    }

    res.status(201).send(savedChat._id);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating chat!");
  }
});

app.get("/api/userchats", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("Authenticated userId:", userId);

  try {
    const userChats = await UserChats.find({ userId });
    console.log(userChats);
    res.status(200).send(userChats[0]?.chats || []);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/api/chats/:id", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/api/chats/:id", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { question, answer, img } = req.body;

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding conversation!");
  }
});

/* 
// Commented out for Vercel serverless deployment: 
// Vercel manages server lifecycle, so no need to listen on a port

app.listen(port, () => {
  connect();
  console.log("backend is running!");
});
*/

// Export the app for Vercel serverless function
export default app;
