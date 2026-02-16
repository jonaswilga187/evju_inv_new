import React, { useState, useEffect } from 'react';
import { bookingsAPI, customersAPI, itemsAPI } from '../services/api';
import BookingCalendar from './BookingCalendar';
import CustomerList from './CustomerList';
import CustomerForm from './CustomerForm';
import BookingForm from './BookingForm';

const CalendarTab = () => {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

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

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      return;
    }

    try {
      await customersAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Fehler beim Löschen des Kunden.');
      console.error(err);
    }
  };

  const handleAddBooking = (date) => {
    setSelectedDate(date);
    setEditingBooking(null);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setSelectedDate(null);
    setShowBookingForm(true);
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Möchten Sie diese Buchung wirklich löschen?')) {
      return;
    }

    try {
      await bookingsAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Fehler beim Löschen der Buchung.');
      console.error(err);
    }
  };

  const handleDeleteBookingAndClose = async (id, sendCancellationEmail, sendToCustomer) => {
    await bookingsAPI.deleteWithOptions(id, { sendCancellationEmail, sendToCustomer });
    loadData();
    setShowBookingForm(false);
    setEditingBooking(null);
    setSelectedDate(null);
  };

  const handleCustomerFormClose = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleCustomerFormSubmit = async (customerData) => {
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer._id, customerData);
      } else {
        await customersAPI.create(customerData);
      }
      handleCustomerFormClose();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Fehler beim Speichern des Kunden.');
      console.error(err);
    }
  };

  const handleBookingFormClose = () => {
    setShowBookingForm(false);
    setEditingBooking(null);
    setSelectedDate(null);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kalender</h2>
              <button
                onClick={() => handleAddBooking(new Date())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buchung hinzufügen
              </button>
            </div>
            <BookingCalendar
              bookings={bookings.filter((b) => b.status === 'active')}
              onSelectSlot={handleAddBooking}
              onSelectEvent={handleEditBooking}
              onDeleteBooking={handleDeleteBooking}
            />
          </div>
        </div>

        {/* Kunden Section */}
        <div>
          <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kunden</h2>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Kunde
              </button>
            </div>
            <CustomerList
              customers={customers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
            />
          </div>
        </div>
      </div>

      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCustomerFormClose}
          onSubmit={handleCustomerFormSubmit}
        />
      )}

      {showBookingForm && (
        <BookingForm
          booking={editingBooking}
          customers={customers}
          items={items}
          selectedDate={selectedDate}
          onClose={handleBookingFormClose}
          onSubmit={handleBookingFormSubmit}
          onDelete={handleDeleteBookingAndClose}
          allowDelete={false}
        />
      )}
    </div>
  );
};

export default CalendarTab;

