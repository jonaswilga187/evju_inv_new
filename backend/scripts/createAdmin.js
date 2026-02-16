const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // MongoDB verbinden
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB verbunden...');

    // Prüfen ob Admin bereits existiert
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@inventory.local' },
        { username: 'admin' }
      ]
    });
    if (existingAdmin) {
      console.log('✅ Admin-Benutzer existiert bereits!');
      console.log('');
      console.log('Anmeldedaten:');
      console.log('E-Mail: admin@inventory.local');
      console.log('Passwort: admin123');
      console.log('');
      console.log('⚠️  Falls das Passwort nicht funktioniert, wurde es möglicherweise geändert.');
      process.exit(0);
    }

    // Admin-Benutzer erstellen
    const admin = new User({
      username: 'admin',
      email: 'admin@inventory.local',
      password: 'admin123' // BITTE IN PRODUCTION ÄNDERN!
    });

    await admin.save();
    console.log('✅ Admin-Benutzer erfolgreich erstellt!');
    console.log('');
    console.log('Anmeldedaten:');
    console.log('E-Mail: admin@inventory.local');
    console.log('Passwort: admin123');
    console.log('');
    console.log('⚠️  WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');

    process.exit(0);
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
    process.exit(1);
  }
};

createAdmin();

