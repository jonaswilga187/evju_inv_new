import React, { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getStatusColor } from '../utils/bookingStatus';

moment.locale('de');
const localizer = momentLocalizer(moment);

const BookingCalendar = ({ bookings, onSelectSlot, onSelectEvent, onDeleteBooking }) => {
  const events = useMemo(() => {
    return bookings.map((booking) => {

      // Titel basierend auf Anzahl der Items
      let title = '';
      if (booking.items && Array.isArray(booking.items) && booking.items.length > 0) {
        if (booking.items.length === 1) {
          title = `${booking.items[0].itemId?.name || 'Unbekannt'} - ${booking.customerId?.name || 'Unbekannt'}`;
        } else {
          title = `${booking.items.length} Items - ${booking.customerId?.name || 'Unbekannt'}`;
        }
      } else {
        title = `Buchung - ${booking.customerId?.name || 'Unbekannt'}`;
      }

      return {
        id: booking._id,
        title: title,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        resource: booking,
        style: {
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status),
        },
      };
    });
  }, [bookings]);

  const handleSelectEvent = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event.resource);
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    if (onSelectSlot) {
      onSelectSlot(start);
    }
  };

  const eventStyleGetter = (event) => {
    return {
      style: event.style,
    };
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={{
          next: 'Weiter',
          previous: 'Zurück',
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag',
          agenda: 'Agenda',
          date: 'Datum',
          time: 'Zeit',
          event: 'Ereignis',
        }}
      />
      <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffc107' }}></span>
          <span>Geplant</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-4 rounded-full bg-green-500"></span>
          <span>Terminiert (im Kalender)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-4 rounded-full bg-gray-500"></span>
          <span>Abgeschlossen</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-4 rounded-full bg-red-500"></span>
          <span>Storniert</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;

