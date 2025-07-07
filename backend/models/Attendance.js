




const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true }, // Changed to use rollNumber directly
  className: { type: String, required: true }, // Changed to use className directly
  subject: { type: String, required: true }, // Changed to use subject directly
  status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
