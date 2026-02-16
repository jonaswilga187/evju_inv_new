const express = require('express');
const Booking = require('../models/Booking');
const BookingItem = require('../models/BookingItem');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { sendTeamsInvite, sendCancellationEmail } = require('../services/emailService');

const router = express.Router();

// Alle Buchungen abrufen
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name email phone')
      .sort({ startDate: 1 });
    
    // BookingItems für jede Buchung laden
    const bookingsWithItems = await Promise.all(
      bookings.map(async (booking) => {
        const bookingItems = await BookingItem.find({ bookingId: booking._id })
          .populate('itemId', 'name description');
        return {
          ...booking.toObject(),
          items: bookingItems
        };
      })
    );
    
    res.json(bookingsWithItems);
  } catch (error) {
    console.error('Fehler beim Abrufen der Buchungen:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Buchungen.' });
  }
});

// MS Teams Einladung per E-Mail versenden
// Route als /send-teams-invite/:id statt /:id/send-teams-invite um Konflikte zu vermeiden
router.post('/send-teams-invite/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone address');

    if (!booking) {
      return res.status(404).json({ message: 'Buchung nicht gefunden.' });
    }

    // BookingItems laden
    const bookingItems = await BookingItem.find({ bookingId: req.params.id })
      .populate('itemId', 'name description quantity price category');

    const bookingWithItems = {
      ...booking.toObject(),
      items: bookingItems
    };

    // sendToCustomer aus Request Body (Standard: false)
    const sendToCustomer = req.body.sendToCustomer === true;

    // E-Mail versenden
    const result = await sendTeamsInvite(bookingWithItems, sendToCustomer);
    
    res.json({ 
      success: true, 
      message: 'MS Teams Einladung erfolgreich per E-Mail versendet.',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Fehler beim Versenden der Teams-Einladung:', error);
    res.status(500).json({ 
      message: error.message || 'Fehler beim Versenden der Teams-Einladung.' 
    });
  }
});

// Einzelne Buchung abrufen
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone address');
    
    if (!booking) {
      return res.status(404).json({ message: 'Buchung nicht gefunden.' });
    }
    
    // BookingItems für diese Buchung laden
    const bookingItems = await BookingItem.find({ bookingId: booking._id })
      .populate('itemId', 'name description quantity price category');
    
    res.json({
      ...booking.toObject(),
      items: bookingItems
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Buchung:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Buchung.' });
  }
});

// Neue Buchung erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, startDate, endDate, status, notes, items } = req.body;

    if (!customerId || !startDate || !endDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Alle erforderlichen Felder müssen ausgefüllt sein.' });
    }

    // Prüfen ob Kunde existiert
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden.' });
    }

    // Prüfen ob alle Items existieren
    for (const itemData of items) {
      if (!itemData.itemId || !itemData.quantity) {
        return res.status(400).json({ message: 'Jedes Item muss eine ID und Menge haben.' });
      }

      const item = await Item.findById(itemData.itemId);
      if (!item) {
        return res.status(404).json({ message: `Item mit ID ${itemData.itemId} nicht gefunden.` });
      }
    }

    // Buchung erstellen
    const booking = new Booking({
      customerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'pending',
      notes
    });

    const savedBooking = await booking.save();

    // BookingItems erstellen
    const bookingItems = await Promise.all(
      items.map(async (itemData) => {
        const bookingItem = new BookingItem({
          bookingId: savedBooking._id,
          itemId: itemData.itemId,
          quantity: itemData.quantity
        });
        return await bookingItem.save();
      })
    );

    // Populated BookingItems laden
    const populatedBookingItems = await BookingItem.find({ bookingId: savedBooking._id })
      .populate('itemId', 'name description');

    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('customerId', 'name email phone');

    res.status(201).json({
      ...populatedBooking.toObject(),
      items: populatedBookingItems
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Buchung:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Buchung.' });
  }
});

// Buchung aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const { customerId, startDate, endDate, status, notes, items } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Buchung nicht gefunden.' });
    }

    // Buchungsdaten aktualisieren
    if (customerId !== undefined) booking.customerId = customerId;
    if (startDate !== undefined) booking.startDate = new Date(startDate);
    if (endDate !== undefined) booking.endDate = new Date(endDate);
    if (status !== undefined) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    // Wenn Items aktualisiert werden sollen
    if (items && Array.isArray(items)) {
      // Prüfen ob alle Items existieren
      for (const itemData of items) {
        if (!itemData.itemId || !itemData.quantity) {
          return res.status(400).json({ message: 'Jedes Item muss eine ID und Menge haben.' });
        }

        const item = await Item.findById(itemData.itemId);
        if (!item) {
          return res.status(404).json({ message: `Item mit ID ${itemData.itemId} nicht gefunden.` });
        }
      }

      // Alte BookingItems löschen
      await BookingItem.deleteMany({ bookingId: req.params.id });

      // Neue BookingItems erstellen
      await Promise.all(
        items.map(async (itemData) => {
          const bookingItem = new BookingItem({
            bookingId: req.params.id,
            itemId: itemData.itemId,
            quantity: itemData.quantity
          });
          return await bookingItem.save();
        })
      );
    }

    const updatedBooking = await booking.save();

    // Populated Daten laden
    const populatedBookingItems = await BookingItem.find({ bookingId: req.params.id })
      .populate('itemId', 'name description');

    const populatedBooking = await Booking.findById(updatedBooking._id)
      .populate('customerId', 'name email phone');

    res.json({
      ...populatedBooking.toObject(),
      items: populatedBookingItems
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Buchung:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Buchung.' });
  }
});

// Buchung löschen inkl. optionaler Absage-E-Mail (POST mit Body, da DELETE-Body oft nicht ankommt)
router.post('/delete/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone address');
    if (!booking) {
      return res.status(404).json({ message: 'Buchung nicht gefunden.' });
    }

    const sendCancellationEmailFlag = req.body.sendCancellationEmail === true;
    const sendToCustomer = req.body.sendToCustomer === true;

    if (sendCancellationEmailFlag) {
      const bookingItems = await BookingItem.find({ bookingId: req.params.id })
        .populate('itemId', 'name description quantity price category');
      const bookingWithItems = {
        ...booking.toObject(),
        items: bookingItems
      };
      await sendCancellationEmail(bookingWithItems, sendToCustomer);
    }

    await BookingItem.deleteMany({ bookingId: req.params.id });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Buchung erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen der Buchung:', error);
    res.status(500).json({
      message: error.message || 'Fehler beim Löschen der Buchung.'
    });
  }
});

// Einfaches Löschen ohne Body (z. B. aus anderem Kontext)
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Buchung nicht gefunden.' });
    }
    await BookingItem.deleteMany({ bookingId: req.params.id });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Buchung erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen der Buchung:', error);
    res.status(500).json({ message: 'Fehler beim Löschen der Buchung.' });
  }
});

module.exports = router;

