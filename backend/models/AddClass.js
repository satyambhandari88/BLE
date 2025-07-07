const mongoose = require('mongoose');

const addclassSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
  radius: { type: Number, required: true }, // Radius in meters
  beaconId: { type: String, required: true, unique: true } // BLE beacon ID
});

module.exports = mongoose.model('AddClass', addclassSchema);
