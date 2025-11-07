/**
 * MongoDB Query to Add rewardPoints to All Users
 * 
 * Run this in MongoDB Shell or MongoDB Compass
 * 
 * This query will:
 * 1. Add rewardPoints field to all users who don't have it
 * 2. Calculate points based on verified certificates (100 points per verified certificate)
 */

// Step 1: Add rewardPoints field to all users (set to 0 if missing)
db.users.updateMany(
  { rewardPoints: { $exists: false } },
  { $set: { rewardPoints: 0 } }
);

// Step 2: Calculate and update reward points for each user based on verified certificates
db.users.find({}).forEach(function(user) {
  // Count verified certificates for this user
  var verifiedCount = db.certificates.countDocuments({
    userId: user._id,
    status: 'verified'
  });
  
  // Calculate reward points (100 points per verified certificate)
  var rewardPoints = verifiedCount * 100;
  
  // Update user's reward points
  db.users.updateOne(
    { _id: user._id },
    { $set: { rewardPoints: rewardPoints } }
  );
  
  print(`Updated user ${user.email}: ${rewardPoints} points (${verifiedCount} verified certificates)`);
});

print('\n✅ All users updated with reward points!');

/**
 * Alternative: Single Query Approach (if you want to do it in one go)
 * 
 * This uses aggregation to calculate points and update in one operation
 */

// Get all users with their verified certificate counts
var userPoints = db.certificates.aggregate([
  { $match: { status: 'verified' } },
  { $group: { _id: '$userId', verifiedCount: { $sum: 1 } } }
]).toArray();

// Update each user
userPoints.forEach(function(item) {
  var rewardPoints = item.verifiedCount * 100;
  db.users.updateOne(
    { _id: item._id },
    { $set: { rewardPoints: rewardPoints } }
  );
});

// Set rewardPoints to 0 for users with no verified certificates
db.users.updateMany(
  { rewardPoints: { $exists: false } },
  { $set: { rewardPoints: 0 } }
);

print('\n✅ Reward points calculated and updated for all users!');

