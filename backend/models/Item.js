const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name ist erforderlich'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Menge ist erforderlich'],
    min: [0, 'Menge darf nicht negativ sein']
  },
  price: {
    type: Number,
    min: [0, 'Preis darf nicht negativ sein']
  },
  category: {
    type: String,
    trim: true
  },
  isDummy: {
    type: Boolean,
    default: false
  },
  displayId: {
    type: Number,
    default: null
  },
  image: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);

