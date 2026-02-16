// E-Mail-Empfänger (interne Adressen für Teams-Einladung & Absage)
// Werden aus data/emailRecipients.json gelesen, änderbar über Einstellungen-Tab
const path = require('path');
const fs = require('fs');

const RECIPIENTS_PATH = path.join(__dirname, '..', 'data', 'emailRecipients.json');
const DEFAULT_RECIPIENTS = ['technik@evjucelle.de'];

function getAdditionalRecipients() {
  try {
    const data = fs.readFileSync(RECIPIENTS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === 'string' && e.trim()) : DEFAULT_RECIPIENTS;
  } catch {
    return DEFAULT_RECIPIENTS;
  }
}

module.exports = {
  getAdditionalRecipients,
  RECIPIENTS_PATH,
  DEFAULT_RECIPIENTS
};
