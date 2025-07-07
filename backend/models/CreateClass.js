const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  year: { type: String, required: true },
  branch: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  teacherName: { type: String, required: true },
  day: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  classCode: { type: String, required: true, length: 5 }
  // className: { type: String, required: true },
  // longitude: { type: Number, required: true },
  // latitude: { type: Number, required: true },
  // radius: { type: Number, required: true }, // Radius in meters
});

module.exports = mongoose.model('Class', classSchema);
