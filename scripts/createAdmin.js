import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/covidvax';

/**
 * Script to create an admin user
 * Usage: node scripts/createAdmin.js <email> <password> [name]
 */
async function createAdmin() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('\n❌ Error: Missing required arguments');
      console.log('\n📖 Usage:');
      console.log('   node scripts/createAdmin.js <email> <password> [name]');
      console.log('\n📝 Example:');
      console.log('   node scripts/createAdmin.js admin@example.com mypassword123 "Admin User"');
      console.log('\n');
      process.exit(1);
    }

    const [email, password, name] = args;

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Error: Invalid email format');
      process.exit(1);
    }

    // Validate password length
    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters');
      process.exit(1);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Update existing user to admin
      existingUser.role = 'admin';
      if (name) existingUser.name = name;
      // Update password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
      }
      await existingUser.save();
      
      console.log('✅ Existing user updated to admin!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name || 'N/A'}`);
      console.log(`   Role: ${existingUser.role}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || 'Admin',
        role: 'admin',
      });

      await adminUser.save();

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
    }

    console.log('\n🎉 You can now login with these credentials!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();

