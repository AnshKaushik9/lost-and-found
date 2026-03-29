import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import itemRoutes from "./routes/itemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("server/uploads"));

// middlewares
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

export default app;