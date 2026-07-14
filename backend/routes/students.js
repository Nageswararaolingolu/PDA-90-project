const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/students
// @desc    Get all students with populated room details
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    // Find all users with role 'student', omit passwords, and populate room details
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('room');
      
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
