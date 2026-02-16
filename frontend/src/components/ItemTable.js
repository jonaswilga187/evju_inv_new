import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import CategoryIcon, { SIZE } from './CategoryIcon';

const PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const ItemTable = ({ items, onEdit, onDelete }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-600">Keine Items vorhanden. Fügen Sie ein neues Item hinzu.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 w-0">Bild</th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 w-0">QR</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Beschreibung</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Menge</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Kategorie</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 border-b border-gray-200 align-middle">
                  <div className="flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
                    {item.image && item.image.trim() ? (
                      <button
                        type="button"
                        onClick={() => setImagePreview(item)}
                        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 flex-shrink-0"
                      >
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                          const el = e.target;
                          el.style.display = 'none';
                          const fallback = el.parentElement?.querySelector('.img-fallback');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                            fallback.classList.add('flex', 'items-center', 'justify-center');
                          }
                        }}
                        />
                        <span className="img-fallback hidden w-full h-full bg-gray-100 rounded-lg">
                          <CategoryIcon category={item.category} className="!bg-gray-100" />
                        </span>
                      </button>
                    ) : (
                      <CategoryIcon category={item.category} />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 border-b border-gray-200 align-middle">
                  <div className="flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
                    <button
                      type="button"
                      onClick={() => setQrPreview(item)}
                      className="flex items-center justify-center w-full h-full rounded-lg border border-gray-200 hover:ring-2 hover:ring-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white p-0.5"
                      title="QR-Code anzeigen"
                    >
                      <QRCodeSVG
                        value={PUBLIC_URL ? `${PUBLIC_URL}/s/${item._id}` : item._id}
                        size={SIZE - 4}
                        level="M"
                        includeMargin={false}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 border-b border-gray-200 text-gray-900 font-mono">
                  {(index + 1).toString().padStart(3, '0')}
                </td>
                <td className="px-6 py-4 border-b border-gray-200 text-gray-900 font-medium">{item.name}</td>
                <td className="px-6 py-4 border-b border-gray-200 text-gray-600">{item.description || '-'}</td>
                <td className={`px-6 py-4 border-b border-gray-200 font-semibold ${item.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.quantity}
                </td>
                <td className="px-6 py-4 border-b border-gray-200 text-gray-600">{item.category || '-'}</td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(item._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {imagePreview && imagePreview.image && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Bild vergrößern"
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm mb-2">{imagePreview.name}</p>
            <img
              src={imagePreview.image}
              alt={imagePreview.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="mt-2 px-4 py-2 bg-white/90 text-gray-800 rounded-lg font-medium hover:bg-white"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {qrPreview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setQrPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="QR-Code vergrößern"
        >
          <div className="bg-white rounded-xl p-6 flex flex-col items-center max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-900 font-medium mb-4">{qrPreview.name}</p>
            <QRCodeSVG
              value={PUBLIC_URL ? `${PUBLIC_URL}/s/${qrPreview._id}` : qrPreview._id}
              size={256}
              level="M"
              includeMargin
            />
            <button
              type="button"
              onClick={() => setQrPreview(null)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemTable;

