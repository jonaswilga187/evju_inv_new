import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { bookingsAPI } from '../services/api';
import { STATUS_OPTIONS } from '../utils/bookingStatus';

const loadBookingItems = (bookingId) =>
  bookingsAPI.getById(bookingId).then((res) => res.data.items || []);

const BookingForm = ({ booking, customers, items, selectedDate, onClose, onSubmit, onDelete, allowDelete = true }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    startDate: '',
    endDate: '',
    status: 'pending',
    notes: '',
  });
  const [bookingItems, setBookingItems] = useState([{ itemId: '', quantity: 1 }]);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendToCustomer, setSendToCustomer] = useState(false); // Standard: nur interne Empfänger
  const [sendCancellationEmail, setSendCancellationEmail] = useState(true);
  const [sendToCustomerCancel, setSendToCustomerCancel] = useState(false); // Standard: nur interne Empfänger
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    if (booking) {
      setFormData({
        customerId: booking.customerId?._id || booking.customerId || '',
        startDate: booking.startDate ? moment(booking.startDate).format('YYYY-MM-DDTHH:mm') : '',
        endDate: booking.endDate ? moment(booking.endDate).format('YYYY-MM-DDTHH:mm') : '',
        status: booking.status || 'pending',
        notes: booking.notes || '',
      });
      
      // BookingItems laden
      if (booking.items && Array.isArray(booking.items)) {
        setBookingItems(
          booking.items.map(bi => ({
            itemId: bi.itemId?._id || bi.itemId || '',
            quantity: bi.quantity || 1
          }))
        );
      }
    } else if (selectedDate) {
      const start = moment(selectedDate);
      const end = moment(selectedDate).add(1, 'day');
      setFormData({
        ...formData,
        startDate: start.format('YYYY-MM-DDTHH:mm'),
        endDate: end.format('YYYY-MM-DDTHH:mm'),
        status: 'active',
      });
    }
  }, [booking, selectedDate]);

  // Beim Zurückkehren vom Scanner-Tab Buchung neu laden (gescannte Items)
  useEffect(() => {
    if (!booking?._id) return;
    const onFocus = () => {
      loadBookingItems(booking._id).then((items) => {
        if (items && items.length > 0) {
          setBookingItems(
            items.map((bi) => ({
              itemId: bi.itemId?._id || bi.itemId || '',
              quantity: bi.quantity || 1,
            }))
          );
        }
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [booking?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...bookingItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setBookingItems(updatedItems);
  };

  const handleAddItem = () => {
    setBookingItems([...bookingItems, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (bookingItems.length > 1) {
      const updatedItems = bookingItems.filter((_, i) => i !== index);
      setBookingItems(updatedItems);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung
    if (bookingItems.length === 0) {
      alert('Bitte fügen Sie mindestens ein Item hinzu.');
      return;
    }

    for (const item of bookingItems) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        alert('Bitte füllen Sie alle Item-Felder aus.');
        return;
      }
    }

    const submitData = {
      ...formData,
      items: bookingItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }))
    };

    onSubmit(submitData);
  };

  const handleSendTeamsInvite = async () => {
    if (!booking || !booking._id) {
      setInviteMessage('Fehler: Buchung nicht gefunden.');
      return;
    }

    setSendingInvite(true);
    setInviteMessage('');

    try {
      const response = await bookingsAPI.sendTeamsInvite(booking._id, sendToCustomer);
      setInviteMessage('MS Teams Einladung erfolgreich per E-Mail versendet!');
      setTimeout(() => setInviteMessage(''), 5000);
    } catch (error) {
      setInviteMessage(error.response?.data?.message || 'Fehler beim Versenden der Teams-Einladung.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDelete = async () => {
    if (!booking || !booking._id || !onDelete) return;
    const message = sendCancellationEmail
      ? 'Buchung wirklich löschen und Absage per E-Mail senden?'
      : 'Buchung wirklich löschen?';
    if (!window.confirm(message)) return;
    setDeletingBooking(true);
    setDeleteMessage('');
    try {
      await onDelete(booking._id, sendCancellationEmail, sendToCustomerCancel);
      onClose();
    } catch (error) {
      setDeleteMessage(error.response?.data?.message || 'Fehler beim Löschen der Buchung.');
    } finally {
      setDeletingBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">{booking ? 'Buchung bearbeiten' : 'Neue Buchung hinzufügen'}</h3>
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kunde <span className="text-red-500">*</span>
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Kunde auswählen</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Startdatum <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enddatum <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Items <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const q = booking?._id ? `?booking=${booking._id}` : '';
                    const url = `${window.location.origin}/scanner${q}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-semibold flex items-center gap-1"
                  title="Scanner öffnen: QR auf dem Handy scannen, dann Item-QR-Codes scannen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scanner
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Item hinzufügen
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {bookingItems.map((bookingItem, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item {index + 1}
                        </label>
                        <select
                          value={bookingItem.itemId}
                          onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Item auswählen</option>
                          {items.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.displayId != null ? `${item.displayId} – ${item.name}` : item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Menge
                        </label>
                        <input
                          type="number"
                          value={bookingItem.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {bookingItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Entfernen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {booking && booking._id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">MS Teams Einladung</h4>
                  <p className="text-sm text-gray-600">Senden Sie eine Teams-Einladung per E-Mail</p>
                  {inviteMessage && (
                    <p className={`text-sm mt-2 ${inviteMessage.includes('erfolgreich') ? 'text-green-600' : 'text-red-600'}`}>
                      {inviteMessage}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendTeamsInvite}
                  disabled={sendingInvite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingInvite ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Teams-Einladung senden
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToCustomer}
                    onChange={(e) => setSendToCustomer(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    E-Mail auch an Kunden senden
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-6">
                  {sendToCustomer 
                    ? 'E-Mail geht an Kunde (TO) und Config-Empfänger (CC)'
                    : 'E-Mail geht nur an Config-Empfänger (TO)'}
                </p>
              </div>
            </div>
          )}

          {booking && booking._id && onDelete && allowDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 mb-1">Buchung löschen</h4>
              <p className="text-sm text-gray-600">Buchung unwiderruflich löschen. Optional kann eine Absage per E-Mail versendet werden.</p>
              {deleteMessage && (
                <p className="text-sm text-red-600">{deleteMessage}</p>
              )}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendCancellationEmail}
                    onChange={(e) => setSendCancellationEmail(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Absage per E-Mail senden</span>
                </label>
                {sendCancellationEmail && (
                  <div className="ml-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToCustomerCancel}
                        onChange={(e) => setSendToCustomerCancel(e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">E-Mail auch an Kunden senden</span>
                    </label>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingBooking ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird gelöscht...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Buchung löschen
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {booking ? 'Aktualisieren' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

