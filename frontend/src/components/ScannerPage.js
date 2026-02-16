import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { scannerAPI } from '../services/api';
import { setScanSessionId, getScanSessionId } from '../utils/scanSession';

const PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Aus gescanntem QR-Text die Item-ID extrahieren (URL .../s/ID oder reine ID)
function parseItemIdFromScan(decodedText) {
  if (!decodedText || typeof decodedText !== 'string') return null;
  const s = decodedText.trim();
  const match = s.match(/\/s\/([a-fA-F0-9]{24})/);
  if (match) return match[1];
  if (/^[a-fA-F0-9]{24}$/.test(s)) return s;
  return null;
}

const ScannerPage = () => {
  const [searchParams] = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const bookingIdFromUrl = searchParams.get('booking');

  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState([]); // { itemName, at } für Anzeige
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ id: null, at: 0 });
  const SCAN_COOLDOWN_MS = 2000;

  const isPhoneView = !!sessionFromUrl;

  useEffect(() => {
    if (isPhoneView) {
      setScanSessionId(sessionFromUrl);
      setSessionId(sessionFromUrl);
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
        setError(err.response?.data?.message || 'Fehler beim Anlegen der Scanner-Session.');
      })
      .finally(() => setLoading(false));
  }, [isPhoneView, sessionFromUrl, bookingIdFromUrl]);

  useEffect(() => {
    if (!sessionId || !isPhoneView) return;
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

  // Kamera-Scanner nur auf Handy-Ansicht (session in URL)
  useEffect(() => {
    if (!isPhoneView || !sessionId) return;
    const sid = getScanSessionId() || sessionId;
    const elId = 'qr-reader';
    let html5Qr = null;

    const onScanSuccess = (decodedText) => {
      const itemId = parseItemIdFromScan(decodedText);
      if (!itemId) return;
      const now = Date.now();
      if (lastScanRef.current.id === itemId && now - lastScanRef.current.at < SCAN_COOLDOWN_MS) return;
      lastScanRef.current = { id: itemId, at: now };

      setScanError('');
      scannerAPI
        .scan(sid, itemId)
        .then((res) => {
          setLastScanned((prev) => [{ itemName: res.data?.itemName || 'Item', at: Date.now() }, ...prev.slice(0, 4)]);
        })
        .catch((err) => {
          setScanError(err.response?.data?.message || 'Scan fehlgeschlagen.');
        });
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setScanError('Keine Kamera gefunden.');
          return;
        }
        html5Qr = new Html5Qrcode(elId);
        const camId = cameras[0].id;
        return html5Qr.start(
          camId,
          {
            fps: 8,
            qrbox: { width: 220, height: 220 },
          },
          onScanSuccess,
          () => {}
        );
      })
      .catch((err) => {
        setScanError('Kamera-Zugriff fehlgeschlagen: ' + (err.message || ''));
      });

    return () => {
      if (html5Qr && html5Qr.isScanning) {
        html5Qr.stop().catch(() => {});
      }
    };
  }, [isPhoneView, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600" />
      </div>
    );
  }

  // Handy: Kamera-Scanner + Liste der gescannten Items
  if (isPhoneView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col p-4">
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Items scannen</h1>
          <p className="text-gray-600 text-sm">QR-Code der Items vor die Kamera halten – wird automatisch hinzugefügt.</p>
        </div>
        <div id="qr-reader" className="rounded-xl overflow-hidden mb-4" style={{ maxWidth: 320 }} />
        {scanError && (
          <p className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded-lg">{scanError}</p>
        )}
        {lastScanned.length > 0 && (
          <div className="bg-white rounded-xl shadow p-3 mb-2">
            <p className="text-sm font-semibold text-gray-700 mb-1">Zuletzt hinzugefügt</p>
            <ul className="space-y-0.5">
              {lastScanned.map((e, i) => (
                <li key={i} className="text-green-700 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </span>
                  {e.itemName}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="bg-white rounded-xl shadow p-3 flex-1">
          <p className="text-sm font-semibold text-gray-700 mb-2">In dieser Session ({items.length})</p>
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">Noch keine Items gescannt.</p>
          ) : (
            <ul className="space-y-1">
              {items.map((entry, idx) => (
                <li key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-900">{entry.itemName || entry.itemId}</span>
                  <span className="text-gray-600">× {entry.quantity || 1}</span>
                </li>
              ))}
            </ul>
          )}
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
          <Link to="/" className="inline-block text-indigo-600 hover:text-indigo-800 mb-4 font-medium">← Zurück zum Inventar</Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scanner</h1>
          <p className="text-gray-600 mb-6">
            Auf dem Handy in der App anmelden, dann diesen QR-Code scannen. Anschließend Item-QR-Codes nacheinander vor die Kamera halten – sie werden automatisch zur Buchung hinzugefügt (ohne erneutes Tippen).
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
