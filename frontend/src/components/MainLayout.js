import React, { useState } from 'react';
import InventoryTab from './InventoryTab';
import CalendarTab from './CalendarTab';
import BuchungenTab from './BuchungenTab';
import EinstellungenTab from './EinstellungenTab';

function MainLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Inventarsystem</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/90">Willkommen, {user.username}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex gap-2 mb-8 border-b-2 border-gray-200">
              <button
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'inventory'
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-600 hover:text-green-600 border-transparent'
                }`}
                onClick={() => setActiveTab('inventory')}
              >
                📦 Inventar
              </button>
              <button
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'calendar'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 border-transparent'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                📅 Kalender
              </button>
              <button
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'bookings'
                    ? 'text-amber-600 border-amber-600'
                    : 'text-gray-600 hover:text-amber-600 border-transparent'
                }`}
                onClick={() => setActiveTab('bookings')}
              >
                📋 Buchungen
              </button>
              <button
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'settings'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600 border-transparent'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Einstellungen
              </button>
            </div>

            <div>
              {activeTab === 'inventory' && <InventoryTab />}
              {activeTab === 'calendar' && <CalendarTab />}
              {activeTab === 'bookings' && <BuchungenTab />}
              {activeTab === 'settings' && <EinstellungenTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
