import ImageKit from "imagekit";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import UserChats from "../models/userChats.js";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";

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

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

// Main handler function
export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://ai-chatbot-plum-six-89.vercel.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  await connect();

  const { url, method } = req;

  // Route handling
  if (url === "/" && method === "GET") {
    return res.json({
      message: "AI Chat API is running",
      endpoints: [
        "GET /ping - Health check",
        "GET /api/upload - ImageKit auth",
        "POST /api/chats - Create new chat",
        "GET /api/userchats - Get user chats",
        "GET /api/chats/:id - Get specific chat",
        "PUT /api/chats/:id - Update chat",
      ],
    });
  }

  if (url === "/ping" && method === "GET") {
    return res.send("pong");
  }

  if (url === "/api/upload" && method === "GET") {
    const result = imagekit.getAuthenticationParameters();
    return res.send(result);
  }

  if (url === "/api/userchats" && method === "GET") {
    try {
      await new Promise((resolve, reject) => {
        clerkAuthMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const userId = req.user.id;
      console.log("Authenticated userId (GET /api/userchats):", userId);

      const userChats = await UserChats.find({ userId });
      console.log("UserChats found:", userChats.length);
      return res.status(200).send(userChats[0]?.chats || []);
    } catch (err) {
      console.log("Error in GET /api/userchats:", err);
      return res.status(401).send("Unauthorized");
    }
  }

  if (url === "/api/chats" && method === "POST") {
    try {
      await new Promise((resolve, reject) => {
        clerkAuthMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const userId = req.user.id;
      const { text } = req.body;

      console.log("Authenticated userId (POST /api/chats):", userId);
      console.log("Request body (POST /api/chats):", req.body);

      const newChat = new Chat({
        userId,
        history: [{ role: "user", parts: [{ text }] }],
      });

      const savedChat = await newChat.save();
      console.log("Saved new Chat with id:", savedChat._id);

      const userChats = await UserChats.find({ userId });
      console.log("Fetched UserChats:", userChats.length);

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

      return res.status(201).send(savedChat._id);
    } catch (err) {
      console.log("Error in POST /api/chats:", err);
      return res.status(401).send("Unauthorized");
    }
  }

  // Handle dynamic routes for chats/:id
  const chatIdMatch = url.match(/^\/api\/chats\/(.+)$/);
  if (chatIdMatch) {
    const chatId = chatIdMatch[1];

    try {
      await new Promise((resolve, reject) => {
        clerkAuthMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const userId = req.user.id;

      if (method === "GET") {
        console.log(`Authenticated userId (GET /api/chats/${chatId}):`, userId);

        const chat = await Chat.findOne({ _id: chatId, userId });
        console.log("Chat found:", !!chat);
        return res.status(200).send(chat);
      }

      if (method === "PUT") {
        const { question, answer, img } = req.body;
        console.log(`Authenticated userId (PUT /api/chats/${chatId}):`, userId);
        console.log("Request body (PUT /api/chats/:id):", req.body);

        const newItems = [
          ...(question
            ? [
                {
                  role: "user",
                  parts: [{ text: question }],
                  ...(img && { img }),
                },
              ]
            : []),
          { role: "model", parts: [{ text: answer }] },
        ];

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
        return res.status(200).send(updatedChat);
      }
    } catch (err) {
      console.log(`Error in chat route:`, err);
      return res.status(401).send("Unauthorized");
    }
  }

  // Default 404
  return res.status(404).json({ error: "Not found" });
}
