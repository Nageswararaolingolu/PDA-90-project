const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMockMode } = require('../config/db');
const mockDb = require('./mockDb');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'student'], 
    default: 'student' 
  },
  phone: { 
    type: String, 
    required: true 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    default: null 
  },
  bedNumber: { 
    type: String, 
    default: null 
  },
  checkInDate: { 
    type: Date, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Hash password before saving in Mongoose
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method for Mongoose
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', UserSchema);

// Export wrapper that swaps between Mongoose and mockDb
module.exports = {
  find: (query) => isMockMode() ? mockDb.User.find(query) : MongooseUser.find(query),
  findOne: (query) => isMockMode() ? mockDb.User.findOne(query) : MongooseUser.findOne(query),
  findById: (id) => isMockMode() ? mockDb.User.findById(id) : MongooseUser.findById(id),
  create: (data) => isMockMode() ? mockDb.User.create(data) : MongooseUser.create(data),
  insertMany: (arr) => isMockMode() ? mockDb.User.insertMany(arr) : MongooseUser.insertMany(arr),
  countDocuments: (query) => isMockMode() ? mockDb.User.countDocuments(query) : MongooseUser.countDocuments(query),
  MongooseModel: MongooseUser
};
