import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { scannerAPI } from '../services/api';
import { getScanSessionId } from '../utils/scanSession';

const ScanReceiverPage = () => {
  const { itemId } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error | no-session
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = getScanSessionId();
    if (!sessionId) {
      setStatus('no-session');
      setMessage('Bitte zuerst die Scanner-Seite auf dem Handy öffnen (QR auf dem PC scannen).');
      return;
    }

    if (!itemId) {
      setStatus('error');
      setMessage('Keine Item-ID in der URL.');
      return;
    }

    scannerAPI
      .scan(sessionId, itemId)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.itemName ? `${res.data.itemName} erfasst.` : 'Erfasst.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Fehler beim Erfassen des Scans.');
      });
  }, [itemId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Wird erfasst…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-700">{message}</p>
          </>
        )}
        {status === 'no-session' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-700">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ScanReceiverPage;
