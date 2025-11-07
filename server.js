import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import certificateRoutes from './routes/certificates.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Check if MongoDB URI is configured
const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  Warning: MONGODB_URI not found in .env file, using default: mongodb+srv://monurajput843320_db_user:W0DxOGOWR5scJW2o@cluster0.zuwu2ep.mongodb.net/?appName=Cluster0');
  console.warn('💡 Tip: Create a .env file in the backend folder with your MongoDB connection string');
}

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${MONGODB_URI.split('/').pop()}`);
  })
  .catch((error) => {
    console.error('\n❌ MongoDB connection error!',MONGODB_URI);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('\n💡 Solutions:');
    console.error('   1. If using LOCAL MongoDB:');
    console.error('      - Make sure MongoDB is installed and running');
    console.error('      - Start MongoDB: mongod (or use Windows Service)');
    console.error('      - Check if MongoDB is running on port 27017');
    console.error('\n   2. If using MONGODB ATLAS (Cloud):');
    console.error('      - Create a .env file in the backend folder');
    console.error('      - Add: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/covidvax');
    console.error('      - Replace username, password, and cluster with your Atlas credentials');
    console.error('      - Make sure your IP is whitelisted in Atlas');
    console.error('\n   3. Check your .env file:');
    console.error(`      - Current MONGODB_URI: ${MONGODB_URI}`);
    console.error('      - Make sure the connection string is correct');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Server will continue to run, but database operations will fail.');
    console.error('Fix the MongoDB connection and restart the server.\n');
    // Don't exit - let the server run so user can see the error message
    // process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (register, login)
app.use('/api/certificates', certificateRoutes); // Certificate upload routes
app.use('/api/admin', adminRoutes); // Admin dashboard routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

