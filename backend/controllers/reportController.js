const PDFDocument = require('pdfkit');
const moment = require('moment');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const generateAttendanceReport = async (req, res) => {
  try {
    const { year, branch, reportType, startDate, endDate } = req.query;

    // Validate input
    if (!year || !branch || !reportType) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    console.log("📌 Received Request for Report:", { year, branch, reportType, startDate, endDate });

    // Calculate date range
    const dateRange = calculateDateRange(reportType, startDate, endDate);
    if (!dateRange) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // Fetch students based on year and branch
    const students = await Student.find({ year: parseInt(year), department: branch }).sort('rollNumber');
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for given criteria' });
    }

    console.log("📌 Students Found:", students.length);

    // Fetch attendance records for these students
    const rollNumbers = students.map(student => student.rollNumber);
    
    const attendanceRecords = await Attendance.find({
      rollNumber: { $in: rollNumbers },
      time: {
        $gte: dateRange.start.toDate(),
        $lt: dateRange.end.toDate()
      }
    });

    console.log("📌 Attendance Records Found:", attendanceRecords.length);

    // Check if attendance records exist
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for the given criteria' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Buffer to store PDF data
    let buffers = [];

    doc.on('data', buffer => buffers.push(buffer));

    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      console.log("✅ Final PDF Data Size:", pdfData.length, "bytes");

      res.writeHead(200, {
        'Content-Length': pdfData.length,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance_report_${moment().format('YYYY-MM-DD')}.pdf"`
      });

      res.end(pdfData);
    });

    // Generate PDF content
    generatePDFContent(doc, { students, attendanceRecords, year, branch, dateRange });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('❌ Error generating report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating report', error: error.message });
    }
  }
};

// Function to calculate the date range
const calculateDateRange = (reportType, startDate, endDate) => {
  const now = moment();

  switch (reportType) {
    case 'daily':
      return { start: now.startOf('day'), end: now.endOf('day') };
    case 'weekly':
      return { start: now.startOf('week'), end: now.endOf('week') };
    case 'monthly':
      return { start: now.startOf('month'), end: now.endOf('month') };
    case 'custom':
      if (!startDate || !endDate) return null;
      return { start: moment(startDate), end: moment(endDate) };
    default:
      return null;
  }
};

// Function to generate PDF content
const generatePDFContent = (doc, { students, attendanceRecords, year, branch, dateRange }) => {
  doc.fontSize(16).text('Student Attendance Report', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Year: ${year} | Branch: ${branch}`).text(`Date Range: ${dateRange.start.format('YYYY-MM-DD')} to ${dateRange.end.format('YYYY-MM-DD')}`).moveDown();

  // Table Headers
  doc.fontSize(10);
  doc.text('Roll No.', 50, doc.y, { width: 80 });
  doc.text('Name', 130, doc.y, { width: 120 });
  doc.text('Class', 260, doc.y, { width: 100 });
  doc.text('Subject', 370, doc.y, { width: 100 });
  doc.text('Status', 470, doc.y, { width: 50 });
  doc.moveDown();

  students.forEach((student, index) => {
    const studentAttendance = attendanceRecords.filter(record => record.rollNumber === student.rollNumber);

    studentAttendance.forEach(record => {
      doc.text(student.rollNumber, 50, doc.y, { width: 80 });
      doc.text(student.name, 130, doc.y, { width: 120 });
      doc.text(record.className, 260, doc.y, { width: 100 });
      doc.text(record.subject, 370, doc.y, { width: 100 });
      doc.text(record.status, 470, doc.y, { width: 50 });
      doc.moveDown();
    });

    if (index % 2 === 0) {
      doc.rect(50, doc.y - 12, 500, 12).fill('#f9f9f9').fillColor('black');
    }
  });

  console.log("✅ PDF Content Successfully Written");
};

module.exports = {
  generateAttendanceReport
};
