import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { bookingsAPI, customersAPI, itemsAPI } from '../services/api';
import { STATUS_OPTIONS, getStatusColor } from '../utils/bookingStatus';
import BookingForm from './BookingForm';

const BuchungenTab = () => {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deleteModalBooking, setDeleteModalBooking] = useState(null);
  const [deleteSendCancellationEmail, setDeleteSendCancellationEmail] = useState(true);
  const [deleteSendToCustomer, setDeleteSendToCustomer] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, customersRes, itemsRes] = await Promise.all([
        bookingsAPI.getAll(),
        customersAPI.getAll(),
        itemsAPI.getAll(),
      ]);
      setBookings(bookingsRes.data);
      setCustomers(customersRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      alert('Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  const handleAddBooking = () => {
    setEditingBooking(null);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowBookingForm(true);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingStatusId(bookingId);
    try {
      await bookingsAPI.update(bookingId, { status: newStatus });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Fehler beim Aktualisieren des Status.');
      console.error(err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleOpenDeleteModal = (booking) => {
    setDeleteModalBooking(booking);
    setDeleteSendCancellationEmail(true);
    setDeleteSendToCustomer(false);
    setDeleteError('');
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalBooking(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBooking?._id) return;
    setDeletingBooking(true);
    setDeleteError('');
    try {
      await bookingsAPI.deleteWithOptions(deleteModalBooking._id, {
        sendCancellationEmail: deleteSendCancellationEmail,
        sendToCustomer: deleteSendToCustomer,
      });
      handleCloseDeleteModal();
      loadData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Fehler beim Löschen der Buchung.');
      console.error(err);
    } finally {
      setDeletingBooking(false);
    }
  };

  const handleBookingFormClose = () => {
    setShowBookingForm(false);
    setEditingBooking(null);
  };

  const handleBookingFormSubmit = async (bookingData) => {
    try {
      if (editingBooking) {
        await bookingsAPI.update(editingBooking._id, bookingData);
      } else {
        await bookingsAPI.create(bookingData);
      }
      handleBookingFormClose();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Fehler beim Speichern der Buchung.');
      console.error(err);
    }
  };

  const formatItemsSummary = (booking) => {
    if (!booking.items || !Array.isArray(booking.items) || booking.items.length === 0) {
      return '–';
    }
    return booking.items
      .map((bi) => {
        const name = bi.itemId?.name || 'Unbekannt';
        const qty = bi.quantity != null ? bi.quantity : '';
        return qty ? `${name} (${qty})` : name;
      })
      .join(', ');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="">Alle</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddBooking}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Buchung
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kunde</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Start</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ende</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Notizen</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  {bookings.length === 0
                    ? 'Noch keine Buchungen. Legen Sie eine neue Buchung an.'
                    : 'Keine Buchungen mit diesem Filter.'}
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {booking.customerId?.name || '–'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {booking.startDate ? moment(booking.startDate).format('DD.MM.YYYY HH:mm') : '–'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {booking.endDate ? moment(booking.endDate).format('DD.MM.YYYY HH:mm') : '–'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.status || 'pending'}
                      onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      disabled={updatingStatusId === booking._id}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: getStatusColor(booking.status),
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={formatItemsSummary(booking)}>
                    {formatItemsSummary(booking)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={booking.notes || ''}>
                    {booking.notes ? booking.notes : '–'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditBooking(booking)}
                        className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(booking)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBookingForm && (
        <BookingForm
          booking={editingBooking}
          customers={customers}
          items={items}
          selectedDate={null}
          onClose={handleBookingFormClose}
          onSubmit={handleBookingFormSubmit}
          onDelete={null}
          allowDelete={false}
        />
      )}

      {deleteModalBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={handleCloseDeleteModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Buchung löschen</h3>
            <p className="text-sm text-gray-600 mb-4">
              Möchten Sie diese Buchung wirklich löschen? Optional kann eine Absage per E-Mail versendet werden.
            </p>
            {deleteError && <p className="text-sm text-red-600 mb-4">{deleteError}</p>}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteSendCancellationEmail}
                  onChange={(e) => setDeleteSendCancellationEmail(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Absage per E-Mail senden</span>
              </label>
              {deleteSendCancellationEmail && (
                <div className="ml-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteSendToCustomer}
                      onChange={(e) => setDeleteSendToCustomer(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">E-Mail auch an Kunden senden</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingBooking ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Wird gelöscht...
                  </>
                ) : (
                  'Löschen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuchungenTab;
