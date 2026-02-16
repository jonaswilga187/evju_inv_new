const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Alle Kunden abrufen
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kunden:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Kunden.' });
  }
});

// Einzelnen Kunden abrufen
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden.' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Fehler beim Abrufen des Kunden:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Kunden.' });
  }
});

// Neuen Kunden erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name ist erforderlich.' });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      address
    });

    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Fehler beim Erstellen des Kunden:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Kunden.' });
  }
});

// Kunden aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden.' });
    }

    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Kunden.' });
  }
});

// Kunden löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Kunde nicht gefunden.' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kunde erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Kunden.' });
  }
});

module.exports = router;

