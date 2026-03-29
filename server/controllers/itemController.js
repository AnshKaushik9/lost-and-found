import Item from "../models/itemModel.js";

// CREATE ITEM (POST)
export const createItem = async (req, res) => {
  try {
    const { title, description, category, type, lat, lng, address } = req.body;

    const item = await Item.create({
      title,
      description,
      category,
      type,
      image: req.file ? req.file.path : null,
      location: { lat, lng, address },
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ITEMS
export const getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MATCH ITEMS
export const matchItems = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    const oppositeType = item.type === "lost" ? "found" : "lost";

    const matches = await Item.find({
      category: item.category,
      type: oppositeType
    });

    const scored = matches.map(m => {
      let score = 0;

      // 📍 LOCATION SCORE
      const latDiff = Math.abs(m.location.lat - item.location.lat);
      const lngDiff = Math.abs(m.location.lng - item.location.lng);

      if (latDiff < 0.01 && lngDiff < 0.01) score += 50;
      else if (latDiff < 0.05) score += 30;

      // 🧠 TEXT MATCH (simple AI)
      if (m.title.toLowerCase().includes(item.title.toLowerCase()))
        score += 20;

      if (m.description.toLowerCase().includes(item.description.toLowerCase()))
        score += 20;

      return { ...m.toObject(), score };
    });

    const result = scored
      .filter(m => m.score > 20)
      .sort((a, b) => b.score - a.score);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ITEM
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!item) return res.status(404).json({ error: "Item not found" });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE ITEM
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};