const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { getAdditionalRecipients, RECIPIENTS_PATH } = require('../config/emailConfig');

const router = express.Router();

// Aktive E-Mail-Empfänger (interne Adressen für Einladungen/Absagen) abrufen
router.get('/email-recipients', auth, (req, res) => {
  try {
    const emails = getAdditionalRecipients();
    res.json({ emails });
  } catch (error) {
    console.error('Fehler beim Lesen der E-Mail-Empfänger:', error);
    res.status(500).json({ message: 'Fehler beim Laden der Einstellungen.' });
  }
});

// E-Mail-Empfänger speichern
router.put('/email-recipients', auth, (req, res) => {
  try {
    let emails = req.body.emails;
    if (!Array.isArray(emails)) {
      return res.status(400).json({ message: 'emails muss ein Array sein.' });
    }
    emails = emails
      .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const dir = path.dirname(RECIPIENTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RECIPIENTS_PATH, JSON.stringify(emails, null, 2), 'utf8');
    res.json({ emails });
  } catch (error) {
    console.error('Fehler beim Speichern der E-Mail-Empfänger:', error);
    res.status(500).json({ message: 'Fehler beim Speichern der Einstellungen.' });
  }
});

module.exports = router;
