const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { seedData } = require('./scripts/seed');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Enable CORS for frontend
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads folder for camera photos
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// DB initialization promise for serverless and standalone execution
let dbPromise = null;
const ensureDBConnected = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        await connectDB();
        // Only query Mongoose if connected (readyState === 1) to prevent buffering timeout
        if (mongoose.connection.readyState === 1) {
          const userCount = await User.countDocuments();
          if (userCount === 0) {
            console.log('🌱 [Server] Empty database detected. Seeding factory users and sample tickets...');
            await seedData();
          }
        } else {
          console.log('⚡ [Server] Running in resilient fallback mode (Mongoose not connected).');
        }
      } catch (err) {
        console.warn('⚠️ [Server] Database check notice:', err.message);
      }
    })();
  }
  return dbPromise;
};

// Health check endpoint (always accessible without DB dependency)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Textile & Garment QMS Complaints System',
    timestamp: new Date().toISOString(),
  });
});

// Ensure DB is ready on incoming API requests (essential for Vercel serverless)
app.use('/api', async (req, res, next) => {
  try {
    await ensureDBConnected();
    next();
  } catch (err) {
    console.error('[DB Initialization Error]:', err);
    next(err);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);

  // Multer error handling
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Start standalone server only when executed directly (not in Vercel serverless)
if (require.main === module || !process.env.VERCEL) {
  ensureDBConnected()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🧵 GARMENT QMS SERVER ONLINE ON PORT ${PORT}`);
        console.log(`📍 REST API: http://localhost:${PORT}/api`);
        console.log(`📸 Proof Uploads: http://localhost:${PORT}/uploads`);
        console.log(`=======================================================`);
      });
    })
    .catch((err) => {
      console.error('Fatal database startup failure:', err);
    });
}

module.exports = app;
