const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const BookingItem = require('../models/BookingItem');

const router = express.Router();

// In-Memory Session-Speicher: sessionId -> { bookingId?, items: [ { itemId, quantity, itemName } ], createdAt }
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 Stunde
const sessions = new Map();

function getSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return s;
}

// Session erstellen
router.post('/sessions', auth, async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      bookingId: bookingId || null,
      items: [],
      createdAt: Date.now(),
    });
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Scanner session create:', error);
    res.status(500).json({ message: 'Fehler beim Anlegen der Scanner-Session.' });
  }
});

// Item zur Session hinzufügen (Scan)
router.post('/sessions/:sessionId/scan', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { itemId } = req.body || {};
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session abgelaufen oder unbekannt.' });
    }

    if (!itemId) {
      return res.status(400).json({ message: 'itemId fehlt.' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item nicht gefunden.' });
    }

    if (session.bookingId) {
      const booking = await Booking.findById(session.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Buchung nicht gefunden.' });
      }
      let bookingItem = await BookingItem.findOne({
        bookingId: session.bookingId,
        itemId: item._id,
      });
      if (bookingItem) {
        bookingItem.quantity += 1;
        await bookingItem.save();
      } else {
        bookingItem = new BookingItem({
          bookingId: session.bookingId,
          itemId: item._id,
          quantity: 1,
        });
        await bookingItem.save();
      }
    }

    const existing = session.items.find(
      (e) => e.itemId.toString() === item._id.toString()
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      session.items.push({
        itemId: item._id,
        quantity: 1,
        itemName: item.name,
      });
    }

    res.json({
      success: true,
      itemName: item.name,
      message: `${item.name} erfasst.`,
    });
  } catch (error) {
    console.error('Scanner scan:', error);
    res.status(500).json({
      message: error.message || 'Fehler beim Erfassen des Scans.',
    });
  }
});

// Gescannte Items einer Session abrufen
router.get('/sessions/:sessionId/items', auth, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session abgelaufen oder unbekannt.' });
    }
    res.json(session.items);
  } catch (error) {
    console.error('Scanner get items:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Items.' });
  }
});

module.exports = router;
