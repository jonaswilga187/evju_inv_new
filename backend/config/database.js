const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log(`MongoDB verbunden: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Fehler bei MongoDB-Verbindung: ${error.message}`);
    console.error('Starte Docker Desktop und führe im Projektordner aus: docker-compose up -d');
    process.exit(1);
  }
};

module.exports = connectDB;

