const mongoose = require('mongoose');
const { isMockMode } = require('../config/db');
const mockDb = require('./mockDb');

const RoomSchema = new mongoose.Schema({
  roomNumber: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  capacity: { 
    type: Number, 
    required: true 
  },
  currentOccupancy: { 
    type: Number, 
    default: 0 
  },
  type: { 
    type: String, 
    enum: ['AC', 'Non-AC'], 
    default: 'Non-AC' 
  },
  rentAmount: { 
    type: Number, 
    required: true 
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
});

const MongooseRoom = mongoose.model('Room', RoomSchema);

module.exports = {
  find: (query) => isMockMode() ? mockDb.Room.find(query) : MongooseRoom.find(query),
  findOne: (query) => isMockMode() ? mockDb.Room.findOne(query) : MongooseRoom.findOne(query),
  findById: (id) => isMockMode() ? mockDb.Room.findById(id) : MongooseRoom.findById(id),
  create: (data) => isMockMode() ? mockDb.Room.create(data) : MongooseRoom.create(data),
  insertMany: (arr) => isMockMode() ? mockDb.Room.insertMany(arr) : MongooseRoom.insertMany(arr),
  countDocuments: (query) => isMockMode() ? mockDb.Room.countDocuments(query) : MongooseRoom.countDocuments(query),
  MongooseModel: MongooseRoom
};
