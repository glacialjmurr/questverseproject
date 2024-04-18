const mongoose = require('mongoose');
const User = require('./User'); // Update this path to where your User model is located

// MongoDB Connection URL
const mongoURI = 'mongodb://localhost:27017/questVerse'; // Update this with your MongoDB URI

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateSchema() {
  try {
    // Find all users that do not have the 'followers' field
    const users = await User.find({ followers: { $exists: false } });

    // Update each user
    for (const user of users) {
      user.followers = []; // Initialize followers as an empty array
      await user.save();
      console.log(`Updated user ${user.username}`);
    }

    console.log('All users have been updated.');
  } catch (error) {
    console.error('Failed to update users:', error);
  } finally {
    mongoose.disconnect(); // Close the connection after updates
  }
}

updateSchema();
