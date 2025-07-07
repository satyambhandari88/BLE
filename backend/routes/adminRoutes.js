const express = require('express');
const { addStudent, addTeacher, addClass, fetchStudents, fetchTeachers, fetchClasses, uploadMiddleware, uploadCSV  } = require('../controllers/adminController');
const router = express.Router();
// const { authenticateAdmin } = require('../middlewares/authMiddleware');


// router.use(authenticateAdmin);

router.get('/students',fetchStudents);
router.get('/teachers',fetchTeachers);
router.get('/classes', fetchClasses);

// Add Student
router.post('/add-student', addStudent);


router.get('/students',fetchStudents);

// Add Teacher
router.post('/add-teacher', addTeacher);

// Add Class
router.post('/add-class', addClass);





router.post('/upload-csv', uploadMiddleware, uploadCSV);
module.exports = router;
