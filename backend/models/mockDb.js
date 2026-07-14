const bcrypt = require('bcryptjs');

const db = {
  users: [],
  rooms: [],
  bills: [],
  complaints: []
};

// Generate mock ID
const mockId = () => 'mock_' + Math.random().toString(36).substring(2, 11);

// Helper to make mock model items saveable
const makeSaveable = (collectionName, item) => {
  if (!item) return item;
  
  // Attach save method
  item.save = async function() {
    const list = db[collectionName];
    const idx = list.findIndex(x => x._id.toString() === this._id.toString());
    
    // Extract functions/extra helpers before saving clean JSON
    const cleanItem = { ...this };
    delete cleanItem.save;
    delete cleanItem.matchPassword;
    
    if (idx !== -1) {
      list[idx] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    
    // Re-attach helper methods
    return makeSaveable(collectionName, this);
  };

  // Attach matchPassword for User models
  if (collectionName === 'users') {
    item.matchPassword = async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    };
  }

  return item;
};

// Chainable query runner to mock Mongoose find/findOne
class MockQuery {
  constructor(data, collectionName) {
    this.data = data;
    this.collectionName = collectionName;
  }

  populate(path) {
    if (!this.data) return this;

    const items = Array.isArray(this.data) ? this.data : [this.data];
    
    items.forEach(item => {
      // 1. Populate 'room' ref inside User/Student
      if (path === 'room' && item.room) {
        const roomId = item.room._id || item.room;
        const roomObj = db.rooms.find(r => r._id.toString() === roomId.toString());
        if (roomObj) {
          item.room = { ...roomObj };
        }
      }

      // 2. Populate 'student' ref inside Bill/Complaint
      if (path === 'student' || (typeof path === 'object' && path.path === 'student')) {
        const studentId = item.student._id || item.student;
        const studentObj = db.users.find(u => u._id.toString() === studentId.toString());
        if (studentObj) {
          item.student = { ...studentObj };
          // Handle deep populate student.room if path is configured for it
          if (item.student.room) {
            const studentRoomId = item.student.room._id || item.student.room;
            const sRoomObj = db.rooms.find(r => r._id.toString() === studentRoomId.toString());
            item.student.room = sRoomObj ? { ...sRoomObj } : item.student.room;
          }
        }
      }

      // 3. Populate 'students' list inside Room
      if (path === 'students' && Array.isArray(item.students)) {
        item.students = item.students.map(sId => {
          const studentId = sId._id || sId;
          const studentObj = db.users.find(u => u._id.toString() === studentId.toString());
          return studentObj ? { ...studentObj } : sId;
        });
      }
    });

    return this;
  }

  sort(options) {
    if (Array.isArray(this.data)) {
      // Default: sort by date descending
      this.data.sort((a, b) => {
        const dateA = a.createdAt || new Date();
        const dateB = b.createdAt || new Date();
        return new Date(dateB) - new Date(dateA);
      });
    }
    return this;
  }

  select(fields) {
    // Mock select omit behavior
    return this;
  }

  // Thenable interface makes this awaitable
  then(resolve, reject) {
    try {
      if (Array.isArray(this.data)) {
        resolve(this.data.map(item => makeSaveable(this.collectionName, { ...item })));
      } else {
        resolve(this.data ? makeSaveable(this.collectionName, { ...this.data }) : null);
      }
    } catch (err) {
      reject(err);
    }
  }
}

const deepClone = (obj) => {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
};

// Mock Database Schema Operations
const MockModel = (collectionName) => {
  return {
    find: (filter = {}) => {
      let results = db[collectionName].map(item => deepClone(item));
      
      // Simple filter matcher
      Object.keys(filter).forEach(key => {
        const val = filter[key];
        
        // Handle MongoDB operators (like $ne, $in)
        if (val && typeof val === 'object') {
          if (val.$ne !== undefined) {
            results = results.filter(item => {
              const itemVal = item[key] ? (item[key]._id || item[key]) : null;
              const compareVal = val.$ne ? (val.$ne._id || val.$ne) : null;
              return String(itemVal) !== String(compareVal);
            });
          }
        } else {
          // Regular equality check
          results = results.filter(item => {
            const itemVal = item[key] ? (item[key]._id || item[key]) : null;
            const filterVal = val ? (val._id || val) : null;
            return String(itemVal) === String(filterVal);
          });
        }
      });

      return new MockQuery(results, collectionName);
    },

    findOne: (filter = {}) => {
      let results = db[collectionName].map(item => deepClone(item));
      const match = results.find(item => {
        return Object.keys(filter).every(key => {
          const itemVal = item[key] ? (item[key]._id || item[key]) : null;
          const filterVal = filter[key] ? (filter[key]._id || filter[key]) : null;
          return String(itemVal) === String(filterVal);
        });
      });
      return new MockQuery(match || null, collectionName);
    },

    findById: (id) => {
      const match = db[collectionName].find(item => item._id.toString() === id.toString());
      return new MockQuery(deepClone(match) || null, collectionName);
    },

    create: async (data) => {
      const salt = await bcrypt.genSalt(10);
      const cleanData = { ...data };
      
      if (cleanData.password) {
        cleanData.password = await bcrypt.hash(cleanData.password, salt);
      }
      
      const newItem = {
        _id: mockId(),
        createdAt: new Date(),
        ...cleanData
      };
      
      db[collectionName].push(newItem);
      return makeSaveable(collectionName, newItem);
    },

    insertMany: async (array) => {
      const created = [];
      for (const item of array) {
        const newItem = {
          _id: mockId(),
          createdAt: new Date(),
          ...item
        };
        db[collectionName].push(newItem);
        created.push(makeSaveable(collectionName, newItem));
      }
      return created;
    },

    countDocuments: (filter = {}) => {
      const results = db[collectionName].filter(item => {
        return Object.keys(filter).every(key => String(item[key]) === String(filter[key]));
      });
      return {
        then: (resolve) => resolve(results.length)
      };
    }
  };
};

const seedMockDb = async () => {
  try {
    console.log('Initializing Mock In-Memory Database Seeding...');
    
    // Seed Rooms
    db.rooms = [
      { _id: 'room_101', roomNumber: '101', capacity: 2, currentOccupancy: 0, type: 'AC', rentAmount: 8000, students: [] },
      { _id: 'room_102', roomNumber: '102', capacity: 3, currentOccupancy: 0, type: 'Non-AC', rentAmount: 5000, students: [] },
      { _id: 'room_103', roomNumber: '103', capacity: 1, currentOccupancy: 0, type: 'AC', rentAmount: 12000, students: [] },
      { _id: 'room_104', roomNumber: '104', capacity: 2, currentOccupancy: 0, type: 'Non-AC', rentAmount: 6000, students: [] }
    ];

    // Password hashing for mock seeds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Seed Admin
    db.users.push({
      _id: 'user_admin',
      name: 'Warden Ramesh',
      email: 'admin@hostel.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9876543210',
      room: null,
      bedNumber: null,
      checkInDate: null,
      createdAt: new Date()
    });

    // Seed Student 1 (allocated to Room 101)
    db.users.push({
      _id: 'user_student1',
      name: 'Amit Kumar',
      email: 'student@hostel.com',
      password: hashedPassword,
      role: 'student',
      phone: '8765432109',
      room: 'room_101',
      bedNumber: 'Bed A',
      checkInDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      createdAt: new Date()
    });
    db.rooms[0].students.push('user_student1');
    db.rooms[0].currentOccupancy = 1;

    // Seed Student 2 (unallocated student)
    db.users.push({
      _id: 'user_student2',
      name: 'Rohan Sharma',
      email: 'rohan@hostel.com',
      password: hashedPassword,
      role: 'student',
      phone: '7654321098',
      room: null,
      bedNumber: null,
      checkInDate: null,
      createdAt: new Date()
    });

    // Seed Bills
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 6); // Overdue by 6 days to trigger student dashboard warning banner

    db.bills.push({
      _id: 'bill_overdue',
      student: 'user_student1',
      amount: 8000,
      month: 'July 2026',
      dueDate: overdueDate,
      status: 'Unpaid',
      remindersSent: 0,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    db.bills.push({
      _id: 'bill_paid',
      student: 'user_student1',
      amount: 8000,
      month: 'June 2026',
      dueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      status: 'Paid',
      paymentDate: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000),
      remindersSent: 0,
      createdAt: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000)
    });

    // Seed Complaints
    db.complaints.push({
      _id: 'comp_plumbing',
      student: 'user_student1',
      category: 'Plumbing',
      description: 'Water leakage in the bathroom tap.',
      urgency: 'Medium',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    db.complaints.push({
      _id: 'comp_wifi',
      student: 'user_student1',
      category: 'Wi-Fi',
      description: 'Internet speed is very slow and dropping frequently.',
      urgency: 'High',
      status: 'In Progress',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    console.log('Mock database seeding completed successfully.');
  } catch (err) {
    console.error('Error seeding mock database:', err.message);
  }
};

module.exports = {
  db,
  seedMockDb,
  User: MockModel('users'),
  Room: MockModel('rooms'),
  Bill: MockModel('bills'),
  Complaint: MockModel('complaints')
};
