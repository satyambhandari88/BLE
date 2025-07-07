const AddClass = require('../models/AddClass');
const CreateClass = require('../models/CreateClass');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const haversine = require('haversine-distance');

// Fetch class notifications for a student


const moment = require('moment-timezone');

exports.fetchNotifications = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    // Use consistent timezone
    const serverTime = moment().tz('Asia/Kolkata');
    const formattedDate = serverTime.format('YYYY-MM-DD');

    // Fetch student details
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch classes for today
    const classes = await CreateClass.find({
      year: student.year.toString(),
      branch: student.department,
      date: formattedDate
    }).sort({ startTime: 1 });

    // Process notifications with precise time calculation
    const notifications = await Promise.all(classes.map(async (classInfo) => {
      // Create precise time objects
      const classDate = moment.tz(`${classInfo.date} ${classInfo.startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
      const classEndDate = moment.tz(`${classInfo.date} ${classInfo.endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');

      // Check existing attendance
      const existingAttendance = await Attendance.findOne({
        rollNumber,
        className: classInfo.className,
        subject: classInfo.subject,
        time: {
          $gte: moment(classDate).startOf('day').toDate(),
          $lt: moment(classDate).endOf('day').toDate()
        }
      });

      // Calculate time differences
      const minutesUntilStart = classDate.diff(serverTime, 'minutes');
      const minutesFromStart = serverTime.diff(classDate, 'minutes');
      const isEnded = serverTime.isAfter(classEndDate);

      // Determine status
      let status;
      if (existingAttendance) {
        status = 'marked';
      } else if (isEnded) {
        status = 'expired';
      } else if (minutesFromStart >= 0 && minutesFromStart <= 15) {
        status = 'active';
      } else if (minutesUntilStart <= 5) {
        status = 'starting_soon';
      } else if (minutesUntilStart > 5) {
        status = 'upcoming';
      } else {
        status = 'expired';
      }

      return {
        className: classInfo.className,
        subject: classInfo.subject,
        teacherName: classInfo.teacherName,
        date: classInfo.date,
        startTime: classInfo.startTime,
        endTime: classInfo.endTime,
        day: classInfo.day,
        status,
        minutesUntilStart: Math.max(0, minutesUntilStart),
        minutesRemaining: status === 'active' ? Math.max(0, 15 - minutesFromStart) : 0,
        attendanceId: existingAttendance?._id
      };
    }));

    // Filter active notifications
    const activeNotifications = notifications.filter(n => n.status !== 'expired');

    res.status(200).json({ 
      notifications: activeNotifications,
      serverTime: serverTime.toISOString()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};



// Submit attendance
exports.submitAttendance = async (req, res) => {
  try {
    console.log('📡 Received attendance submission request:', req.body);

    const { rollNumber, className, latitude, longitude, beaconProximity, classCode } = req.body;

    // 1️⃣ Verify student exists
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      console.error("❌ Student not found:", rollNumber);
      return res.status(404).json({ message: 'Student not found' });
    }
    console.log("✅ Student found:", student.name);

    // 2️⃣ Get today's date
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 3️⃣ Find the specific class for today
    const classDetails = await CreateClass.findOne({ classCode });
    if (!classDetails) {
      console.error("❌ No matching class found for today:", { classCode, today });
      return res.status(404).json({ message: 'No matching class found for today' });
    }
    console.log("✅ Class found:", classDetails.className, "-", classDetails.subject);

    // 4️⃣ Fetch geofencing and beacon data
    const geoData = await AddClass.findOne({ className: new RegExp(`^${className}$`, 'i') });
    if (!geoData) {
      console.error("❌ Class geolocation data not found:", className);
      return res.status(404).json({ message: 'Class location data not found' });
    }
    console.log("✅ Geolocation and beacon data found:", geoData);

    // 5️⃣ VALIDATION 1: Check if student is within geofence
    const userLocation = { latitude, longitude };
    const classLocation = { latitude: geoData.latitude, longitude: geoData.longitude };
    const distance = haversine(userLocation, classLocation);

    console.log(`📏 Distance from class: ${distance} meters (Allowed: ${geoData.radius} meters)`);

    if (distance > geoData.radius) {
      console.warn("⚠️ Student is OUTSIDE the allowed geofence.");
      return res.status(403).json({ message: 'You are not within the class area', distance: Math.round(distance), allowedRadius: geoData.radius });
    }
    console.log("✅ Student is WITHIN the geofence.");

    // 6️⃣ VALIDATION 2: Check beacon proximity (normalize & compare)
    const expectedBeaconId = geoData?.beaconId ? geoData.beaconId.trim().toLowerCase() : null;
    const receivedBeaconId = beaconProximity?.beaconId ? beaconProximity.beaconId.trim().toLowerCase() : null;

    console.log("🔎 Normalized Expected Beacon ID:", expectedBeaconId);
    console.log("📡 Normalized Received Beacon ID:", receivedBeaconId);

    // Always enforce beacon check, regardless of method chosen in UI
    if (!expectedBeaconId) {
      console.error("❌ No beacon ID configured for this class");
      return res.status(400).json({ message: 'No beacon ID configured for this class' });
    }

    if (!receivedBeaconId || receivedBeaconId !== expectedBeaconId) {
      console.warn("⚠️ Beacon ID mismatch or not detected.");
      return res.status(403).json({ 
          message: 'Required beacon not detected or out of range', 
          expectedBeaconId: geoData?.beaconId,
          receivedBeaconId: beaconProximity?.beaconId
      });
    }
    console.log("✅ Beacon validation passed.");

    // VALIDATION 3: Verify class code as an additional security measure
    if (classCode !== classDetails.classCode) {
      console.warn("⚠️ Invalid class code provided.");
      return res.status(403).json({
          message: 'Invalid class code provided',
          expected: classDetails.classCode
      });
    }
    console.log("✅ Class code validation passed.");

    // 7️⃣ VALIDATION 4: Check class timing (allow attendance only in valid time range)
    const [startHour, startMinute] = classDetails.startTime.split(':').map(Number);
    const classStartTime = new Date();
    classStartTime.setHours(startHour, startMinute, 0, 0);

    const attendanceWindowEnd = new Date(classStartTime);
    attendanceWindowEnd.setMinutes(attendanceWindowEnd.getMinutes() + 15);

    console.log("⏳ Class Start Time:", classStartTime);
    console.log("⏳ Attendance Window Ends At:", attendanceWindowEnd);
    console.log("⏳ Current Time:", now);

    if (now < classStartTime) {
      const minutesUntilStart = Math.ceil((classStartTime - now) / 60000);
      console.warn(`⚠️ Class has NOT started yet. Starts in ${minutesUntilStart} minutes.`);
      return res.status(403).json({ message: 'Class has not started yet', minutesUntilStart });
    }

    if (now > attendanceWindowEnd) {
      const minutesLate = Math.floor((now - classStartTime) / 60000 - 15);
      console.warn(`⚠️ Attendance window EXPIRED. Student is ${minutesLate} minutes late.`);
      return res.status(403).json({ message: 'Attendance window has expired', minutesLate });
    }
    console.log("✅ Class is within attendance window.");

    // 8️⃣ Check if attendance is already marked
    const existingAttendance = await Attendance.findOne({ 
      rollNumber,
      className: classDetails.className,
      subject: classDetails.subject,
      time: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });
    
    if (existingAttendance) {
      console.warn("⚠️ Attendance already submitted for this class.");
      return res.status(400).json({ message: 'Attendance already submitted for this class' });
    }

    // 9️⃣ All validations passed - Save attendance
    const attendance = new Attendance({
      rollNumber,
      className: classDetails.className,
      subject: classDetails.subject,
      classCode: classDetails.classCode, // Store class code for better tracking
      status: 'Present',
      time: now,
    });

    await attendance.save();
    console.log("✅ Attendance marked successfully!");

    return res.status(200).json({
      message: 'Attendance submitted successfully',
      details: { className: classDetails.className, subject: classDetails.subject, date: today, time: now.toISOString() }
    });

  } catch (error) {
    console.error("❌ Error submitting attendance:", error);
    return res.status(500).json({ message: 'Error submitting attendance', error: error.message });
  }
};



// Get student attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    
    // Verify student exists
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch attendance history with proper date handling
    const attendanceHistory = await Attendance.find({ rollNumber })
      .sort({ time: -1 })
      .lean(); // Use lean() for better performance

    // Format the response with proper date handling
    const formattedHistory = attendanceHistory.map(record => ({
      className: record.className,
      subject: record.subject,
      status: record.status,
      date: new Date(record.time).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: new Date(record.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.status(200).json({ 
      success: true,
      history: formattedHistory 
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance history',
      error: error.message 
    });
  }
};