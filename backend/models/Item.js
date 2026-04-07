const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Phone', 'Wallet', 'Keys', 'ID/Documents', 'Bag', 'Jewellery', 'Electronics', 'Other'],
    required: true 
  },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  image: { type: String, default: '' },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contact: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
