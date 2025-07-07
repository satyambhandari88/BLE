const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const AddClass = require('../models/AddClass');
const moment = require('moment');

// Submit Attendance
router.post('/mark', async (req, res) => {
  const { rollNumber, className, latitude, longitude, faceData } = req.body;

  try {
    // Fetch student details
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch class geofencing data
    const addClass = await AddClass.findOne({ className });
    if (!addClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check geofencing
    const distance = calculateDistance(latitude, longitude, addClass.latitude, addClass.longitude);
    if (distance > addClass.radius) {
      return res.status(403).json({ message: 'You are outside the allowed class location.' });
    }

    // Check timing (15 minutes window)
    const now = moment();
    const classStart = moment(addClass.startTime, 'HH:mm');
    if (now.diff(classStart, 'minutes') > 15) {
      return res.status(403).json({ message: 'Attendance window has closed.' });
    }

    // Match face data
    if (student.faceData !== faceData) {
      return res.status(403).json({ message: 'Facial recognition failed.' });
    }

    // Mark attendance
    const attendance = new Attendance({
      rollNumber: student._id,
      className,
      subject: addClass.subject,
      status: 'Present',
    });

    await attendance.save();
    res.status(200).json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Utility function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

module.exports = router;
