const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Save message to DB
router.post('/message', auth, async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const msg = new Message({
      roomId,
      sender: req.user.id,
      senderName: req.user.name,
      message
    });
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get chat history
router.get('/history/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
