import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Certificate from '../models/Certificate.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/covidvax';

/**
 * Script to update reward points for all existing users
 * This adds rewardPoints field to users who don't have it and calculates points based on verified certificates
 * 
 * Usage: npm run update-reward-points
 */
async function updateRewardPoints() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} user(s) to process\n`);

    let updatedCount = 0;
    let initializedCount = 0;
    let recalculatedCount = 0;

    for (const user of users) {
      // Count verified certificates for this user
      const verifiedCount = await Certificate.countDocuments({
        userId: user._id,
        status: 'verified',
      });
      
      // Calculate reward points (100 points per verified certificate)
      const expectedPoints = verifiedCount * 100;
      
      // Check if user has rewardPoints field
      if (user.rewardPoints === undefined || user.rewardPoints === null) {
        console.log(`📝 Initializing user: ${user.email}`);
        console.log(`   Verified certificates: ${verifiedCount}`);
        
        // Initialize and set reward points
        user.rewardPoints = expectedPoints;
        await user.save();
        
        console.log(`   ✓ Set rewardPoints to ${expectedPoints}`);
        initializedCount++;
        updatedCount++;
      } else {
        // Recalculate points to ensure accuracy
        const currentPoints = user.rewardPoints || 0;
        
        if (currentPoints !== expectedPoints) {
          console.log(`🔄 Recalculating user: ${user.email}`);
          console.log(`   Current points: ${currentPoints}`);
          console.log(`   Verified certificates: ${verifiedCount}`);
          
          user.rewardPoints = expectedPoints;
          await user.save();
          
          console.log(`   ✓ Updated to ${expectedPoints}`);
          recalculatedCount++;
          updatedCount++;
        } else {
          console.log(`✓ User: ${user.email} - Points already correct (${currentPoints})`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Users initialized: ${initializedCount}`);
    console.log(`   Users recalculated: ${recalculatedCount}`);
    console.log(`   Total updated: ${updatedCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating reward points:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
updateRewardPoints();

