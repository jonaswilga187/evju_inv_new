import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { scannerAPI } from '../services/api';
import { setScanSessionId } from '../utils/scanSession';

const PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const ScannerPage = () => {
  const [searchParams] = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const bookingIdFromUrl = searchParams.get('booking');

  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPhoneView = !!sessionFromUrl;

  useEffect(() => {
    if (isPhoneView) {
      setScanSessionId(sessionFromUrl);
      setLoading(false);
      return;
    }

    scannerAPI
      .createSession(bookingIdFromUrl || undefined)
      .then((res) => {
        setSessionId(res.data.sessionId);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Fehler beim Anlegen der Session.');
      })
      .finally(() => setLoading(false));
  }, [isPhoneView, sessionFromUrl, bookingIdFromUrl]);

  useEffect(() => {
    if (!sessionId || isPhoneView) return;
    const fetchItems = () => {
      scannerAPI
        .getSessionItems(sessionId)
        .then((res) => setItems(res.data || []))
        .catch(() => {});
    };
    fetchItems();
    const interval = setInterval(fetchItems, 2500);
    return () => clearInterval(interval);
  }, [sessionId, isPhoneView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600" />
      </div>
    );
  }

  if (isPhoneView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">Scanner aktiv</p>
          <p className="text-gray-600">
            Scannen Sie jetzt die Item-QR-Codes mit Ihrer Kamera oder einer QR-App. Jeder Scan wird automatisch erfasst.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const scannerUrl = sessionId ? `${PUBLIC_URL}/scanner?session=${sessionId}${bookingIdFromUrl ? `&booking=${bookingIdFromUrl}` : ''}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scanner</h1>
          <p className="text-gray-600 mb-6">
            Mit dem Handy diesen QR-Code scannen, dann Item-QR-Codes scannen. Die Liste unten aktualisiert sich automatisch.
          </p>
          {scannerUrl && (
            <div className="flex justify-center mb-8 p-4 bg-gray-50 rounded-xl">
              <QRCodeSVG value={scannerUrl} size={280} level="M" includeMargin />
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Gescannte Items</h2>
          {items.length === 0 ? (
            <p className="text-gray-500">Noch keine Items gescannt.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((entry, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-900">{entry.itemName || entry.itemId}</span>
                  <span className="text-gray-600">× {entry.quantity || 1}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
