const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const User = require('../models/User');
const Room = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/bills
// @desc    Get bills (Admin gets all, Student gets their own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const bills = await Bill.find({})
        .populate({
          path: 'student',
          select: 'name email phone room bedNumber',
          populate: { path: 'room', select: 'roomNumber' }
        })
        .sort({ createdAt: -1 });
      res.json(bills);
    } else {
      const bills = await Bill.find({ student: req.user._id })
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 });
      res.json(bills);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/bills/generate
// @desc    Generate monthly bills for all students currently allocated to rooms
// @access  Private (Admin Only)
router.post('/generate', protect, adminOnly, async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ message: 'Please specify the billing month (e.g. July 2026)' });
    }

    // Find all students who are currently allocated to a room
    const students = await User.find({ role: 'student', room: { $ne: null } }).populate('room');

    if (students.length === 0) {
      return res.status(400).json({ message: 'No students are currently allocated to any room.' });
    }

    let billsCreated = 0;
    let billsSkipped = 0;

    for (const student of students) {
      // Check if a bill already exists for this student and month
      const existingBill = await Bill.findOne({ student: student._id, month });
      
      if (existingBill) {
        billsSkipped += 1;
        continue;
      }

      // Rent amount from the student's room
      const amount = student.room.rentAmount;
      
      // Due date is set to 10 days from today
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      await Bill.create({
        student: student._id,
        amount,
        month,
        dueDate,
        status: 'Unpaid'
      });

      billsCreated += 1;
    }

    res.status(201).json({
      message: `Billing generation complete.`,
      billsCreated,
      billsSkipped
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bills/:id/status
// @desc    Update a bill status (Paid/Unpaid)
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Paid', 'Unpaid'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Paid/Unpaid) is required' });
    }

    const bill = await Bill.findById(req.id || req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Authorization: Admin can mark anything. Student can only mark their own bill as "Paid" (Pay Now action)
    const billStudentId = bill.student && bill.student._id ? bill.student._id : bill.student;
    
    if (req.user.role !== 'admin' && billStudentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this bill' });
    }

    bill.status = status;
    bill.paymentDate = status === 'Paid' ? new Date() : null;
    await bill.save();

    res.json({
      message: `Bill status updated to ${status}`,
      bill
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/bills/:id/remind
// @desc    Trigger manual reminder notifications (mock)
// @access  Private (Admin Only)
router.post('/:id/remind', protect, adminOnly, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('student', 'name email');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.remindersSent += 1;
    await bill.save();

    res.json({
      message: `Mock notification reminder sent to ${bill.student.name} (${bill.student.email})`,
      bill
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
