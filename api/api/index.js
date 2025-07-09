// api/index.js
import express from "express";
import ImageKit from "imagekit";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import UserChats from "../models/userChats.js";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import serverless from "serverless-http";

const app = express();

app.use(
  cors({
    origin: "https://ai-chatbot-plum-six-89.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());
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

app.get("/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

// app.get("/api/test", clerkAuthMiddleware, (req, res) => {
//   const userId = req.user.id;
//   console.log("Authenticated userId (/api/test):", userId);
//   console.log("Request headers:", req.headers);

//   res.status(200).json({
//     message: "User is authenticated",
//     user: {
//       id: userId,
//     },
//   });
// });

app.post("/chats", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  await connect();
  console.log("Authenticated userId (POST /api/chats):", userId);
  console.log("Request body (POST /api/chats):", req.body);

  const { text } = req.body;

  try {
    console.log("Creating new Chat document");
    const newChat = new Chat({
      userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();
    console.log("Saved new Chat with id:", savedChat._id);

    const userChats = await UserChats.find({ userId });
    console.log("Fetched UserChats:", userChats.length);

    if (!userChats.length) {
      console.log("No UserChats found, creating new UserChats document");
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
      console.log("Created new UserChats document");
    } else {
      console.log("Updating existing UserChats document");
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
      console.log("Updated UserChats document");
    }

    console.log("Sending response with savedChat._id");
    res.status(201).send(savedChat._id);
  } catch (err) {
    console.log("Error in POST /api/chats:", err);
    res.status(500).send("Error creating chat!");
  }
});

app.get("/userchats", clerkAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  await connect();
  console.log("Authenticated userId (GET /api/userchats):", userId);

  try {
    const userChats = await UserChats.find({ userId });
    console.log("UserChats found:", userChats.length);
    res.status(200).send(userChats[0]?.chats || []);
  } catch (err) {
    console.log("Error in GET /api/userchats:", err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/chats/:id", clerkAuthMiddleware, async (req, res) => {
  await connect();
  const userId = req.user.id;
  const chatId = req.params.id;
  console.log(`Authenticated userId (GET /api/chats/${chatId}):`, userId);

  try {
    const chat = await Chat.findOne({ _id: chatId, userId });
    console.log("Chat found:", !!chat);
    res.status(200).send(chat);
  } catch (err) {
    console.log(`Error in GET /api/chats/${chatId}:`, err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/chats/:id", clerkAuthMiddleware, async (req, res) => {
  await connect();
  const userId = req.user.id;
  const chatId = req.params.id;
  const { question, answer, img } = req.body;
  console.log(`Authenticated userId (PUT /api/chats/${chatId}):`, userId);
  console.log("Request body (PUT /api/chats/:id):", req.body);

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: chatId, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    console.log("Updated chat history:", updatedChat);
    res.status(200).send(updatedChat);
  } catch (err) {
    console.log(`Error in PUT /api/chats/${chatId}:`, err);
    res.status(500).send("Error adding conversation!");
  }
});

// Export the app wrapped with serverless-http
const handler = serverless(app);
export { handler as default };
