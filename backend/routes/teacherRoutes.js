const express = require('express');
const { createClass } = require('../controllers/teacherController');
const router = express.Router();

// Teacher Create Class Route
router.post('/create-class', createClass);

module.exports = router;
