const Class = require('../models/CreateClass'); // Class model
const Student = require('../models/Student'); // Student model

// Generate random 5-digit code
const generateClassCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Create Class
exports.createClass = async (req, res) => {
  const { year, branch, subject, className, teacherName, day, date, startTime, endTime } = req.body;

  try {
    // Generate unique class code
    const classCode = generateClassCode();
    
    // Create the class with code
    const newClass = new Class({
      year,
      branch,
      subject,
      className,
      teacherName,
      day,
      date,
      startTime,
      endTime,
      classCode
    });

    await newClass.save();

    res.status(201).json({ 
      message: 'Class created successfully',
      classCode: classCode,
      className: className
    });
  } catch (error) {
    console.log('Error creating class:', error);
    res.status(500).json({ message: 'Error creating class', error });
  }
};
