import React, { useState, useEffect } from 'react';
import { settingsAPI, itemsAPI } from '../services/api';

const EinstellungenTab = () => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [dummyItems, setDummyItems] = useState([]);
  const [dummyName, setDummyName] = useState('');
  const [dummyDescription, setDummyDescription] = useState('');
  const [dummySaving, setDummySaving] = useState(false);
  const [dummyMessage, setDummyMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [recipientsRes, itemsRes] = await Promise.all([
        settingsAPI.getEmailRecipients(),
        itemsAPI.getAll({ dummyOnly: '1' })
      ]);
      setEmails(recipientsRes.data.emails || []);
      setDummyItems(itemsRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Einstellungen.' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const res = await settingsAPI.getEmailRecipients();
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error(err);
    }
  };

  const validateEmail = (email) => {
    const trimmed = (email || '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const handleAdd = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!validateEmail(trimmed)) {
      setMessage({ type: 'error', text: 'Bitte eine gültige E-Mail-Adresse eingeben.' });
      return;
    }
    if (emails.includes(trimmed)) {
      setMessage({ type: 'error', text: 'Diese Adresse ist bereits in der Liste.' });
      return;
    }
    setEmails([...emails, trimmed]);
    setNewEmail('');
    setMessage({ type: '', text: '' });
  };

  const handleRemove = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (emails.length === 0) {
      setMessage({ type: 'error', text: 'Mindestens eine E-Mail-Adresse ist nötig (z. B. für interne Einladungen/Absagen).' });
      return;
    }
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await settingsAPI.updateEmailRecipients(emails);
      setMessage({ type: 'success', text: 'E-Mail-Empfänger gespeichert.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Fehler beim Speichern.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDummy = async () => {
    const name = (dummyName || '').trim();
    if (!name) {
      setDummyMessage({ type: 'error', text: 'Bitte einen Namen eingeben (z. B. Ton komplett).' });
      return;
    }
    try {
      setDummySaving(true);
      setDummyMessage({ type: '', text: '' });
      await itemsAPI.create({
        name,
        description: (dummyDescription || '').trim(),
        isDummy: true,
        quantity: 0
      });
      setDummyName('');
      setDummyDescription('');
      setDummyMessage({ type: 'success', text: `"${name}" wurde als Buchungsvorlage angelegt.` });
      setTimeout(() => setDummyMessage({ type: '', text: '' }), 3000);
      const res = await itemsAPI.getAll({ dummyOnly: '1' });
      setDummyItems(res.data || []);
    } catch (err) {
      setDummyMessage({ type: 'error', text: err.response?.data?.message || 'Fehler beim Anlegen.' });
    } finally {
      setDummySaving(false);
    }
  };

  const handleRemoveDummy = async (id) => {
    if (!window.confirm('Diese Buchungsvorlage wirklich entfernen? Sie bleibt in bestehenden Buchungen erhalten.')) return;
    try {
      await itemsAPI.delete(id);
      setDummyItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setDummyMessage({ type: 'error', text: err.response?.data?.message || 'Fehler beim Entfernen.' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">E-Mail-Empfänger</h2>
        <p className="text-sm text-gray-600 mb-4">
          Diese Adressen erhalten Einladungen und Absagen (wenn „E-Mail auch an Kunden senden“ deaktiviert ist). Kunden-E-Mails werden hier nicht konfiguriert.
        </p>

        {message.text && (
          <p className={`text-sm mb-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Aktuell aktiv:</p>
          {emails.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Keine Empfänger eingetragen. Bitte mindestens eine Adresse hinzufügen und speichern.</p>
          ) : (
            <ul className="space-y-2">
              {emails.map((email, index) => (
                <li
                  key={`${email}-${index}`}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-900">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    title="Entfernen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Neue E-Mail-Adresse"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Hinzufügen
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || emails.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Buchungsvorlagen (Dummy-Items)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vorlagen für große Buchungen (z. B. „Ton komplett“, „Lichtpaket“). Sie erscheinen im Kalender bei der Buchung zur Auswahl, werden aber nicht im Inventar geführt.
        </p>

        {dummyMessage.text && (
          <p className={`text-sm mb-4 ${dummyMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {dummyMessage.text}
          </p>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Aktuell angelegt:</p>
          {dummyItems.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Keine Buchungsvorlagen. Neue z. B. „Ton komplett“ anlegen.</p>
          ) : (
            <ul className="space-y-2">
              {dummyItems.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    {item.displayId != null && (
                      <span className="text-indigo-600 font-mono font-semibold mr-2">{item.displayId}</span>
                    )}
                    <span className="text-gray-900 font-medium">{item.name}</span>
                    {item.description && (
                      <span className="text-gray-500 text-sm ml-2">– {item.description}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDummy(item._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    title="Vorlage entfernen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="text"
            value={dummyName}
            onChange={(e) => setDummyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDummy())}
            placeholder="z. B. Ton komplett"
            className="w-56 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            value={dummyDescription}
            onChange={(e) => setDummyDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDummy())}
            placeholder="Beschreibung (optional)"
            className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddDummy}
            disabled={dummySaving || !dummyName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dummySaving ? 'Wird angelegt...' : 'Vorlage hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EinstellungenTab;
