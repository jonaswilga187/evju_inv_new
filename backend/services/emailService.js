const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');

// SMTP-Transporter erstellen
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.strato.de', // Strato SMTP
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true für 465 (SSL), false für 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || 'technik@evjucelle.de',
      pass: process.env.SMTP_PASS || 'evjucelletechnik',
    },
    tls: {
      rejectUnauthorized: false, // Strato-Zertifikat kann manchmal Probleme machen
      minVersion: 'TLSv1.2'
    }
  });
};

// .ics Datei (iCalendar) erstellen
const createICSFile = (booking, organizerEmail = 'technik@evjucelle.de') => {
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  // Items-Liste erstellen
  const itemsList = booking.items && Array.isArray(booking.items)
    ? booking.items.map(item => 
        `${item.itemId?.name || 'Unbekannt'} (${item.quantity}x)`
      ).join(', ')
    : 'Keine Items';

  const customerName = booking.customerId?.name || 'Unbekannt';
  const customerEmail = booking.customerId?.email || '';
  const description = `Items: ${itemsList}${booking.notes ? '\n\nNotizen: ' + booking.notes : ''}`;

  // WICHTIG: ORGANIZER und ATTENDEE müssen korrekt formatiert sein
  // Der ORGANIZER sollte NICHT auch als ATTENDEE aufgeführt sein
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inventarsystem//MS Teams Einladung//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking._id}@evjucelle.de`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Buchung - ${customerName}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n').replace(/[,;]/g, '').substring(0, 200)}`,
    `ORGANIZER;CN=Technik-Team:MAILTO:${organizerEmail}`
  ];

  // ATTENDEE nur hinzufügen, wenn es nicht der ORGANIZER ist
  if (customerEmail && customerEmail.toLowerCase() !== organizerEmail.toLowerCase()) {
    const safeCustomerName = customerName.replace(/[,;\\]/g, '').replace(/\n/g, ' ');
    icsLines.push(`ATTENDEE;CN=${safeCustomerName};RSVP=TRUE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:MAILTO:${customerEmail}`);
  }

  icsLines.push(
    'LOCATION:Microsoft Teams',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Erinnerung',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  const icsContent = icsLines.join('\r\n');

  return icsContent;
};

// .ics für Absage (METHOD:CANCEL) – gleiche UID wie Einladung, damit Kalender-Apps den Termin entfernen
const createICSCancel = (booking, organizerEmail = 'technik@evjucelle.de') => {
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const customerName = booking.customerId?.name || 'Unbekannt';
  const customerEmail = booking.customerId?.email || '';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inventarsystem//Absage//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:CANCEL',
    'BEGIN:VEVENT',
    `UID:${booking._id}@evjucelle.de`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Buchung - ${customerName} (storniert)`,
    `ORGANIZER;CN=Technik-Team:MAILTO:${organizerEmail}`,
    'STATUS:CANCELLED',
    'SEQUENCE:1',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  if (customerEmail && customerEmail.toLowerCase() !== organizerEmail.toLowerCase()) {
    const safeCustomerName = customerName.replace(/[,;\\]/g, '').replace(/\n/g, ' ');
    icsLines.splice(icsLines.indexOf('STATUS:CANCELLED'), 0, `ATTENDEE;CN=${safeCustomerName}:MAILTO:${customerEmail}`);
  }

  return icsLines.join('\r\n');
};

// E-Mail mit Absage (Buchung storniert) inkl. .ics METHOD:CANCEL
const sendCancellationEmail = async (booking, sendToCustomer = false) => {
  try {
    const transporter = createTransporter();

    const customerEmail = booking.customerId?.email;
    const customerName = booking.customerId?.name || 'Kunde';

    let toRecipients = [];
    let ccRecipients = [];

    if (sendToCustomer) {
      if (!customerEmail) {
        throw new Error('Kunde hat keine E-Mail-Adresse.');
      }
      toRecipients = [customerEmail];
      const additionalRecipients = emailConfig.getAdditionalRecipients();
      if (additionalRecipients && additionalRecipients.length > 0) {
        ccRecipients = [...additionalRecipients];
      }
    } else {
      const additionalRecipients = emailConfig.getAdditionalRecipients();
      if (additionalRecipients && additionalRecipients.length > 0) {
        toRecipients = [...additionalRecipients];
      } else {
        throw new Error('Keine Empfänger konfiguriert.');
      }
    }

    const itemsList = booking.items && Array.isArray(booking.items)
      ? booking.items.map(item =>
          `- ${item.itemId?.name || 'Unbekannt'} (${item.quantity}x)`
        ).join('\n')
      : 'Keine Items';

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const dateFormat = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const icsContent = createICSCancel(booking);

    const mailOptions = {
      from: 'technik@evjucelle.de',
      replyTo: 'technik@evjucelle.de',
      to: toRecipients.join(', '),
      cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
      subject: `Absage: Buchung – ${customerName} – ${dateFormat.format(startDate)}`,
      headers: {
        'Content-Class': 'urn:content-classes:calendarmessage',
        'Content-Type': 'multipart/alternative; boundary="----=_Part_Cancel_1234567890"'
      },
      alternatives: [
        {
          contentType: 'text/calendar; charset=UTF-8; method=CANCEL',
          content: icsContent,
          headers: {
            'Content-Class': 'urn:content-classes:calendarmessage',
            'Content-Type': 'text/calendar; charset=UTF-8; method=CANCEL'
          }
        },
        {
          contentType: 'text/html; charset=UTF-8',
          content: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Buchung storniert</h2>
              <p>Hallo ${customerName},</p>
              <p>die folgende Buchung wurde storniert:</p>
              <p><strong>Datum:</strong> ${dateFormat.format(startDate)} – ${dateFormat.format(endDate)}</p>
              <p><strong>Kunde:</strong> ${customerName}</p>
              <h3>Gebuchte Items (zur Info):</h3>
              <ul>
                ${booking.items && Array.isArray(booking.items)
                  ? booking.items.map(item =>
                      `<li>${item.itemId?.name || 'Unbekannt'} (${item.quantity}x)</li>`
                    ).join('')
                  : '<li>Keine Items</li>'}
              </ul>
              ${booking.notes ? `<p><strong>Notizen:</strong> ${booking.notes}</p>` : ''}
              <p>Mit freundlichen Grüßen<br>Technik-Team<br>evjucelle.de</p>
            </div>
          `
        },
        {
          contentType: 'text/plain; charset=UTF-8',
          content: `Hallo ${customerName},

die folgende Buchung wurde storniert:

Datum: ${dateFormat.format(startDate)} – ${dateFormat.format(endDate)}
Kunde: ${customerName}

Gebuchte Items:
${itemsList}

${booking.notes ? `Notizen: ${booking.notes}` : ''}

Mit freundlichen Grüßen
Technik-Team
evjucelle.de`
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Fehler beim Versenden der Absage-E-Mail:', error);
    throw error;
  }
};

// E-Mail mit Teams-Einladung versenden
const sendTeamsInvite = async (booking, sendToCustomer = false) => {
  try {
    const transporter = createTransporter();

    // Kunden-E-Mail prüfen
    const customerEmail = booking.customerId?.email;
    const customerName = booking.customerId?.name || 'Kunde';
    
    // Empfänger-Logik:
    // - Wenn sendToCustomer=true: TO=Kunde, CC=Config-Empfänger
    // - Wenn sendToCustomer=false: TO=Config-Empfänger (ohne Kunde)
    let toRecipients = [];
    let ccRecipients = [];
    
    if (sendToCustomer) {
      if (!customerEmail) {
        throw new Error('Kunde hat keine E-Mail-Adresse.');
      }
      toRecipients = [customerEmail];
      // Config-Empfänger als CC
      const additionalRecipients = emailConfig.getAdditionalRecipients();
      if (additionalRecipients && additionalRecipients.length > 0) {
        ccRecipients = [...additionalRecipients];
      }
    } else {
      // Nur Config-Empfänger
      const additionalRecipients = emailConfig.getAdditionalRecipients();
      if (additionalRecipients && additionalRecipients.length > 0) {
        toRecipients = [...additionalRecipients];
      } else {
        throw new Error('Keine Empfänger konfiguriert.');
      }
    }
    
    // Items-Liste für E-Mail-Text
    const itemsList = booking.items && Array.isArray(booking.items)
      ? booking.items.map(item => 
          `- ${item.itemId?.name || 'Unbekannt'} (${item.quantity}x)`
        ).join('\n')
      : 'Keine Items';

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const dateFormat = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // .ics Datei erstellen
    const icsContent = createICSFile(booking);

    // E-Mail-Optionen
    // WICHTIG: Für Zusage-Buttons muss die E-Mail als multipart/alternative versendet werden
    // mit text/calendar als ERSTE Alternative (Outlook/Teams erkennt nur die erste)
    const mailOptions = {
      from: 'technik@evjucelle.de',
      replyTo: 'technik@evjucelle.de',
      to: toRecipients.join(', '),
      cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
      subject: `Buchung - ${customerName} - ${dateFormat.format(startDate)}`,
      headers: {
        'Content-Class': 'urn:content-classes:calendarmessage',
        'Content-Type': 'multipart/alternative; boundary="----=_Part_0_1234567890"'
      },
      // WICHTIG: alternatives Array - text/calendar MUSS zuerst kommen!
      alternatives: [
        {
          contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
          content: icsContent,
          headers: {
            'Content-Class': 'urn:content-classes:calendarmessage',
            'Content-Type': 'text/calendar; charset=UTF-8; method=REQUEST'
          }
        },
        {
          contentType: 'text/html; charset=UTF-8',
          content: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Buchungsbestätigung</h2>
              <p>Hallo ${customerName},</p>
              <p>hier ist Ihre Buchungsbestätigung:</p>
              <p><strong>Datum:</strong> ${dateFormat.format(startDate)} - ${dateFormat.format(endDate)}</p>
              <p><strong>Kunde:</strong> ${customerName}</p>
              <h3>Gebuchte Items:</h3>
              <ul>
                ${booking.items && Array.isArray(booking.items)
                  ? booking.items.map(item => 
                      `<li>${item.itemId?.name || 'Unbekannt'} (${item.quantity}x)</li>`
                    ).join('')
                  : '<li>Keine Items</li>'}
              </ul>
              ${booking.notes ? `<p><strong>Notizen:</strong> ${booking.notes}</p>` : ''}
              <p>Bitte verwenden Sie die Zusage-Buttons oben in dieser E-Mail, um die Einladung zu akzeptieren oder abzulehnen.</p>
              <p>Mit freundlichen Grüßen<br>Technik-Team<br>evjucelle.de</p>
            </div>
          `
        },
        {
          contentType: 'text/plain; charset=UTF-8',
          content: `Hallo ${customerName},

hier ist Ihre Buchungsbestätigung:

Datum: ${dateFormat.format(startDate)} - ${dateFormat.format(endDate)}
Kunde: ${customerName}

Gebuchte Items:
${itemsList}

${booking.notes ? `Notizen: ${booking.notes}` : ''}

Bitte verwenden Sie die Zusage-Buttons in dieser E-Mail, um die Einladung zu akzeptieren oder abzulehnen.

Mit freundlichen Grüßen
Technik-Team
evjucelle.de`
        }
      ]
    };

    // E-Mail versenden
    const info = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Fehler beim Versenden der E-Mail:', error);
    throw error;
  }
};

module.exports = {
  sendTeamsInvite,
  sendCancellationEmail,
  createICSFile,
  createICSCancel
};

