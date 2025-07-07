const express = require('express');
const router = express.Router();
const { generateAttendanceReport } = require('../controllers/reportController');
const { authenticateAdmin, authenticateTeacher } = require('../middlewares/authMiddleware');

router.get('/generate', 
  (req, res, next) => {
    // Allow both admin and teacher to access this route
    authenticateAdmin(req, res, (err) => {
      if (err) {
        authenticateTeacher(req, res, next);
      } else {
        next();
      }
    });
  }, 
  generateAttendanceReport
);

module.exports = router;