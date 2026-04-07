const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// Smart Match - find potential matches for an item
router.get('/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    // Find opposite type items
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Build smart match query
    const keywords = item.title.split(' ').filter(w => w.length > 2);

    const matches = await Item.find({
      type: oppositeType,
      status: 'active',
      _id: { $ne: item._id },
      $or: [
        { category: item.category },
        { title: { $regex: keywords.join('|'), $options: 'i' } },
        { location: { $regex: item.location.split(' ')[0], $options: 'i' } }
      ]
    })
    .populate('postedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

    // Score matches
    const scored = matches.map(m => {
      let score = 0;
      if (m.category === item.category) score += 40;
      keywords.forEach(kw => {
        if (m.title.toLowerCase().includes(kw.toLowerCase())) score += 20;
        if (m.description.toLowerCase().includes(kw.toLowerCase())) score += 10;
      });
      if (m.location.toLowerCase().includes(item.location.split(' ')[0].toLowerCase())) score += 30;
      return { ...m.toObject(), matchScore: Math.min(score, 100) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
