const User = require('../models/User');
const Room = require('../models/Room');
const Bill = require('../models/Bill');
const Complaint = require('../models/Complaint');

const seedData = async () => {
  try {
    // 1. Check if we already have users. If yes, skip seeding.
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding initial database data...');

    // 2. Create Default Rooms
    const roomsData = [
      { roomNumber: '101', capacity: 2, currentOccupancy: 0, type: 'AC', rentAmount: 8000, students: [] },
      { roomNumber: '102', capacity: 3, currentOccupancy: 0, type: 'Non-AC', rentAmount: 5000, students: [] },
      { roomNumber: '103', capacity: 1, currentOccupancy: 0, type: 'AC', rentAmount: 12000, students: [] },
      { roomNumber: '104', capacity: 2, currentOccupancy: 0, type: 'Non-AC', rentAmount: 6000, students: [] }
    ];

    const createdRooms = await Room.insertMany(roomsData);
    console.log(`Seeded ${createdRooms.length} rooms.`);

    // 3. Create Admin
    const admin = await User.create({
      name: 'Warden Ramesh',
      email: 'admin@hostel.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'admin',
      phone: '9876543210'
    });
    console.log(`Seeded Admin User: ${admin.email}`);

    // 4. Create Student 1 (allocated to Room 101)
    const room101 = createdRooms.find(r => r.roomNumber === '101');
    const student1 = await User.create({
      name: 'Amit Kumar',
      email: 'student@hostel.com',
      password: 'password123',
      role: 'student',
      phone: '8765432109',
      room: room101._id,
      bedNumber: 'Bed A',
      checkInDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    });
    console.log(`Seeded Student User: ${student1.email}`);

    // Link Student 1 to Room 101
    room101.students.push(student1._id);
    room101.currentOccupancy = 1;
    await room101.save();

    // 5. Create Student 2 (unallocated student, to test room allocation)
    const student2 = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@hostel.com',
      password: 'password123',
      role: 'student',
      phone: '7654321098'
    });
    console.log(`Seeded Unallocated Student: ${student2.email}`);

    // 6. Generate Bills
    // Create an Unpaid bill for Student 1 for "July 2026" (overdue by 6 days relative to July 14th)
    const overdueDueDate = new Date();
    overdueDueDate.setDate(overdueDueDate.getDate() - 6); // Overdue by 6 days to trigger the overdue banner

    const unpaidBill = await Bill.create({
      student: student1._id,
      amount: room101.rentAmount,
      month: 'July 2026',
      dueDate: overdueDueDate,
      status: 'Unpaid'
    });
    console.log(`Seeded Unpaid Overdue Bill for student1.`);

    // Create a Paid bill for Student 1 for "June 2026"
    const paidDueDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const paidBill = await Bill.create({
      student: student1._id,
      amount: room101.rentAmount,
      month: 'June 2026',
      dueDate: paidDueDate,
      status: 'Paid',
      paymentDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000)
    });
    console.log(`Seeded Paid Bill for student1.`);

    // 7. Seed Complaints
    const complaint1 = await Complaint.create({
      student: student1._id,
      category: 'Plumbing',
      description: 'Water leakage in the bathroom tap.',
      urgency: 'Medium',
      status: 'Pending'
    });
    
    const complaint2 = await Complaint.create({
      student: student1._id,
      category: 'Wi-Fi',
      description: 'Internet speed is very slow and dropping frequently.',
      urgency: 'High',
      status: 'In Progress'
    });
    console.log(`Seeded initial complaints.`);

    console.log('Seeding finished successfully!');
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
  }
};

module.exports = seedData;
