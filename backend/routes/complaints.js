const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');

// @route   GET /api/complaints
// @desc    Get all complaints (Admin gets all, Student gets their own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const complaints = await Complaint.find({})
        .populate('student', 'name email phone room bedNumber')
        .sort({ createdAt: -1 });
      res.json(complaints);
    } else {
      const complaints = await Complaint.find({ student: req.user._id })
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 });
      res.json(complaints);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/complaints
// @desc    File a new complaint
// @access  Private (Student Only)
router.post('/', protect, async (req, res) => {
  try {
    const { category, description, urgency } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can file complaints' });
    }

    if (!category || !description) {
      return res.status(400).json({ message: 'Please provide category and description' });
    }

    const complaint = await Complaint.create({
      student: req.user._id,
      category,
      description,
      urgency: urgency || 'Low',
      status: 'Pending'
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update a complaint status or priority
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, urgency } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Admins can update status and urgency
    if (req.user.role === 'admin') {
      if (status) complaint.status = status;
      if (urgency) complaint.urgency = urgency;
      await complaint.save();
      
      const updatedComplaint = await Complaint.findById(complaint._id)
        .populate('student', 'name email phone room bedNumber');

      return res.json({
        message: 'Complaint updated by admin',
        complaint: updatedComplaint
      });
    }

    // Students can update details only if complaint is still Pending
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this complaint' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot modify complaints that are already In Progress or Resolved' });
    }

    const { category, description, urgency: studentUrgency } = req.body;
    if (category) complaint.category = category;
    if (description) complaint.description = description;
    if (studentUrgency) complaint.urgency = studentUrgency;

    await complaint.save();
    res.json({
      message: 'Complaint details updated',
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
