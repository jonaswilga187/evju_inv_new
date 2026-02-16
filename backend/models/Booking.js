const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Kunde ist erforderlich']
  },
  startDate: {
    type: Date,
    required: [true, 'Startdatum ist erforderlich']
  },
  endDate: {
    type: Date,
    required: [true, 'Enddatum ist erforderlich'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Enddatum muss nach dem Startdatum liegen'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);

