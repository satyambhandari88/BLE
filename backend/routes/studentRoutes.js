const express = require('express');
const router = express.Router();
const { 
  fetchNotifications, 
  submitAttendance, 
  getAttendanceHistory 
} = require('../controllers/studentController');
const { authenticateStudent } = require('../middlewares/authMiddleware');


// Protect all routes
router.use(authenticateStudent);

// Get class notifications
router.get('/notifications/:rollNumber', fetchNotifications);

// Submit attendance
router.post('/attendance', submitAttendance);

// Get attendance history
router.get('/attendance-history/:rollNumber', getAttendanceHistory);

module.exports = router;