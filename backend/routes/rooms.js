const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/rooms
// @desc    Get all rooms with populated student details
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const rooms = await Room.find({}).populate('students', 'name phone');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { roomNumber, capacity, type, rentAmount } = req.body;

    if (!roomNumber || !capacity || !rentAmount) {
      return res.status(400).json({ message: 'Please provide roomNumber, capacity, and rentAmount' });
    }

    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) {
      return res.status(400).json({ message: 'Room already exists' });
    }

    const room = await Room.create({
      roomNumber,
      capacity,
      type: type || 'Non-AC',
      rentAmount,
      currentOccupancy: 0,
      students: []
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms/allocate
// @desc    Allocate a student to a room
// @access  Private (Admin Only)
router.post('/allocate', protect, adminOnly, async (req, res) => {
  try {
    const { studentId, phone, roomId, bedNumber, name } = req.body;

    if ((!studentId && !phone) || !roomId || !bedNumber) {
      return res.status(400).json({ message: 'Please specify student identifier (studentId or phone), roomId, and bedNumber' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    let student;
    if (phone) {
      student = await User.findOne({ phone: phone.trim() });
      if (!student && name) {
        student = await User.create({
          name: name.trim(),
          phone: phone.trim(),
          password: 'password123',
          role: 'student'
        });
      }
    } else if (studentId) {
      student = await User.findById(studentId);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found. Please provide a name to register them manually.' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Selected user is an Admin, cannot allocate to a room' });
    }

    // 1. Capacity Check
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ 
        message: `Allocation failed: Room ${room.roomNumber} is at full capacity (${room.capacity}/${room.capacity} beds occupied)` 
      });
    }

    // 2. Deallocate from previous room if already allocated
    if (student.room) {
      const prevRoomId = student.room;
      const prevRoom = await Room.findById(prevRoomId);
      if (prevRoom) {
        prevRoom.students = prevRoom.students.filter(
          (sId) => sId.toString() !== student._id.toString()
        );
        prevRoom.currentOccupancy = Math.max(0, prevRoom.currentOccupancy - 1);
        await prevRoom.save();
      }
    }

    // 3. Allocate to the new room
    room.students.push(student._id);
    room.currentOccupancy += 1;
    await room.save();

    // 4. Update the student record
    student.room = room._id;
    student.bedNumber = bedNumber;
    student.checkInDate = new Date();
    await student.save();

    res.json({
      message: `Successfully allocated student ${student.name} to room ${room.roomNumber}`,
      student,
      room
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms/deallocate
// @desc    Deallocate a student from a room
// @access  Private (Admin Only)
router.post('/deallocate', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Please specify studentId' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.room) {
      return res.status(400).json({ message: 'Student is not currently allocated to any room' });
    }

    const roomId = student.room;
    const room = await Room.findById(roomId);
    if (room) {
      room.students = room.students.filter(
        (sId) => sId.toString() !== student._id.toString()
      );
      room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
      await room.save();
    }

    student.room = null;
    student.bedNumber = null;
    student.checkInDate = null;
    await student.save();

    res.json({
      message: `Successfully deallocated student ${student.name} from room`,
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
