import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  itemId: String,
  sender: String,
  message: String
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);