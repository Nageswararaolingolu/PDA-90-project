const mongoose = require('mongoose');
const { isMockMode } = require('../config/db');
const mockDb = require('./mockDb');

const ComplaintSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['Plumbing', 'Electrical', 'Wi-Fi', 'Food', 'Housekeeping'], 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  urgency: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Low' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving changes in Mongoose
ComplaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MongooseComplaint = mongoose.model('Complaint', ComplaintSchema);

module.exports = {
  find: (query) => isMockMode() ? mockDb.Complaint.find(query) : MongooseComplaint.find(query),
  findOne: (query) => isMockMode() ? mockDb.Complaint.findOne(query) : MongooseComplaint.findOne(query),
  findById: (id) => isMockMode() ? mockDb.Complaint.findById(id) : MongooseComplaint.findById(id),
  create: (data) => isMockMode() ? mockDb.Complaint.create(data) : MongooseComplaint.create(data),
  insertMany: (arr) => isMockMode() ? mockDb.Complaint.insertMany(arr) : MongooseComplaint.insertMany(arr),
  countDocuments: (query) => isMockMode() ? mockDb.Complaint.countDocuments(query) : MongooseComplaint.countDocuments(query),
  MongooseModel: MongooseComplaint
};
