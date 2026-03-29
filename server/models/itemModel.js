import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,

  category: String, // optional but useful

  type: {
    type: String,
    enum: ["lost", "found"],
  },

  image: String,

  location: {
    lat: Number,
    lng: Number,
    address: String,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

}, { timestamps: true });

export default mongoose.model("Item", itemSchema);