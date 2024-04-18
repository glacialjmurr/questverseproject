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
    const users = await User.find({});

    // Update each user
    for (const user of users) {
      user.level = user.level || 1; // Default level to 1 if not set
      user.xp = user.xp || 0; // Default xp to 0 if not set
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
