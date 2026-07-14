const mongoose = require('mongoose');
const { isMockMode } = require('../config/db');
const mockDb = require('./mockDb');

const BillSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  }, // e.g. "July 2026"
  dueDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Paid', 'Unpaid'], 
    default: 'Unpaid' 
  },
  paymentDate: { 
    type: Date, 
    default: null 
  },
  remindersSent: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const MongooseBill = mongoose.model('Bill', BillSchema);

module.exports = {
  find: (query) => isMockMode() ? mockDb.Bill.find(query) : MongooseBill.find(query),
  findOne: (query) => isMockMode() ? mockDb.Bill.findOne(query) : MongooseBill.findOne(query),
  findById: (id) => isMockMode() ? mockDb.Bill.findById(id) : MongooseBill.findById(id),
  create: (data) => isMockMode() ? mockDb.Bill.create(data) : MongooseBill.create(data),
  insertMany: (arr) => isMockMode() ? mockDb.Bill.insertMany(arr) : MongooseBill.insertMany(arr),
  countDocuments: (query) => isMockMode() ? mockDb.Bill.countDocuments(query) : MongooseBill.countDocuments(query),
  MongooseModel: MongooseBill
};
