import Chat from "../models/Chat.js";

export const sendMessage = async (req, res) => {
  const msg = await Chat.create(req.body);
  res.json(msg);
};

export const getMessages = async (req, res) => {
  const msgs = await Chat.find({ itemId: req.params.id });
  res.json(msgs);
};