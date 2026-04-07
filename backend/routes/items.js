const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST - Create Item
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { type, title, description, category, location, date, contact } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const item = new Item({
      type, title, description, category, location,
      date: new Date(date), image, contact,
      postedBy: req.user.id
    });

    await item.save();
    await item.populate('postedBy', 'name email');
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET - All Items
router.get('/', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let filter = { status: 'active' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];

    const items = await Item.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET - Single Item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'name email');
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET - My Items
router.get('/user/my', auth, async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT - Mark Resolved
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    if (item.postedBy.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    item.status = 'resolved';
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE - Delete Item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    if (item.postedBy.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    await item.deleteOne();
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
