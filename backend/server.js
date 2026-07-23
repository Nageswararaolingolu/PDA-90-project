const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const seedData = require('./config/seed');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Lazy-initialized database connection & seeding promise to avoid cold-start race conditions
let dbInitPromise = null;
const getDbInitPromise = () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      // Connect to Database
      await connectDB();
      // Seed Database (will skip if data exists)
      await seedData();
    })();
  }
  return dbInitPromise;
};

// Middleware to ensure DB connection / mock fallback is fully completed before processing requests
app.use(async (req, res, next) => {
  try {
    await getDbInitPromise();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/students', require('./routes/students'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/complaints', require('./routes/complaints'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hostel and PG Management API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Listen only when running locally (not in serverless production on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  getDbInitPromise().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Database connection failed during boot:', err);
  });
}

module.exports = app;

