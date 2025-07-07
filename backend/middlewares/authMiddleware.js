const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

exports.authenticateStudent = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    req.student = student;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};



// exports.authenticateAdmin = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Authentication required' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const admin = await Student.findById(decoded.id);

//     if (!admin) {
//       return res.status(404).json({ message: 'Admin not found' });
//     }

//     req.admin = admin;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };
