const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');


const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};






// Admin Registration Route
router.post('/admin/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log('Request Body:', req.body); // Log incoming data
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      console.log('Admin already exists');
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();

    res.status(201).json({
      _id: admin.id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin.id),
    });
  } catch (error) {
    console.error('Error during registration:', error.message); // Log the error
    res.status(500).json({ message: 'Server error occurred' });
  }
});




// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin.id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher Login
router.post('/teacher/login', async (req, res) => {
  const { email, id, password } = req.body;
  try {
    const teacher = await Teacher.findOne({ email, id });
    if (teacher && (await bcrypt.compare(password, teacher.password))) {
      res.json({
        _id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        token: generateToken(teacher.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student Login
router.post('/student/login', async (req, res) => {
  const { rollNumber, email, password } = req.body;
  try {
    const student = await Student.findOne({ rollNumber, email,password });
    if (student && (await (password, student.password))) {
      res.json({
        _id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        token: generateToken(student.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
