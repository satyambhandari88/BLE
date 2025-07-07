const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require('./routes/reportRoutes');


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize the app
const app = express();

// Middleware

app.use(cors());
app.use(bodyParser.json());

// Basic Route
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/reports', reportRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
