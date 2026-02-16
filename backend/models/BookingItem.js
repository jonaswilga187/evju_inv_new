const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Buchung ist erforderlich']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ist erforderlich']
  },
  quantity: {
    type: Number,
    required: [true, 'Menge ist erforderlich'],
    min: [1, 'Menge muss mindestens 1 sein']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BookingItem', bookingItemSchema);



