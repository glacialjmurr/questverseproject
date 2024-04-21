// userRoutes.js
const express = require('express');
const User = require('./User'); 
const Post = require('./Posts'); 
const router = express.Router();

async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}
  
  router.get('/protected', isAuthenticated, (req, res) => {
    res.json({ message: "This is a protected route" });
  });

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    // Extract info from request body
    const { username, email, password } = req.body;

    // Create a new user instance
    const user = new User({
      username,
      email,
      password // This will be hashed by the pre-save hook in the User model
    });

    // Save the user to the database
    await user.save();

    // Respond with success
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    // Handle errors, such as duplicate username/email
    res.status(400).json({ error: error.message });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Authentication failed. User not found." });
    }

    // Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Authentication failed. Wrong password." });
    }

    // Logic to manage session
    if (isMatch) {
      req.session.userId = user._id; 
      req.session.save()
    }

    // Respond with user info
    res.status(200).json({
      message: "User logged in successfully",
      user: { id: user._id, username: user.username, email: user.email, followers: user.followers, following: user.following },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // Logout Endpoint
  router.get('/logout', (req, res) => {
    // Clear user-related data from the session
    delete req.session.userId;
    res.status(200).json({ message: 'Logout successful' });
});


  // Following a user
  router.post('/follow/:userId', isAuthenticated, async (req, res) => {
    const targetUserId = req.params.userId;
    const userId = req.session.userId;

    console.log(`User ${userId} is attempting to follow user ${targetUserId}`);
  
    if(targetUserId === userId) {
      return res.status(400).json({ message: "Cannot follow oneself" });
    }
    
    try {
      const user = await User.findById(userId);
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User to follow not found" });
      }
  
      // User starts following targetUser
      if (!user.following.includes(targetUserId)) {
        console.log(`Adding ${targetUserId} to ${userId}'s following list.`);
        user.following.push(targetUserId);
        await user.save();
      }
  
      // targetUser gains a new follower
      if (!targetUser.followers.includes(userId)) {
        console.log(`Adding ${userId} to ${targetUserId}'s followers list.`);
        targetUser.followers.push(userId);
        await targetUser.save();
      }
  
      res.status(200).json({ message: "User followed" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

  
// Unfollow a user
router.post('/unfollow/:userId', isAuthenticated, async (req, res) => {
  const targetUserId = req.params.userId;
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    // User stops following targetUser
    const followingIndex = user.following.indexOf(targetUserId);
    if (followingIndex > -1) {
      user.following.splice(followingIndex, 1);
      await user.save();
    }

    // targetUser loses a follower
    const followerIndex = targetUser.followers.indexOf(userId);
    if (followerIndex > -1) {
      targetUser.followers.splice(followerIndex, 1);
      await targetUser.save();
    }

    res.status(200).json({ message: "User unfollowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/isFollowing/:username', isAuthenticated, async (req, res) => {
  const username = req.params.username;
  try {
    const targetUser = await User.findOne({ username: username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentUser = await User.findById(req.session.userId);
    const isFollowing = currentUser.following.includes(targetUser._id);
    res.json({ isFollowing, userId: targetUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint to fetch stats for the logged-in user
router.get('/mystats', isAuthenticated, async (req, res) => {
  try {
    // isAuthenticated ensures that we have a logged-in user
    // req.user is set by the isAuthenticated middleware
    const userId = req.user._id;

    const postsCount = await Post.countDocuments({ userId });
    const followersCount = req.user.followers.length;
    const followingCount = req.user.following.length;
    const level = req.user.level; 
    const xp = req.user.xp; 

    res.json({
      postsCount,
      followersCount,
      followingCount,
      level, 
      xp 
    });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    res.status(500).json({ message: "Server error", error });
  }
});


router.get('/recommended', isAuthenticated, async (req, res) => {
  try {
    const currentUser = req.user;
    const randomUsers = await User.aggregate([
      { $match: { _id: { $ne: currentUser._id } } }, // Exclude the current user
      { $sample: { size: 5 } } // Get 5 random users
    ]).exec();

    res.json(randomUsers);
  } catch (error) {
    console.error('Error fetching recommended users:', error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.delete('/delete', async (req, res) => {
  try {
      // Get the user ID from the session
      const userId = req.session.userId;

      // Check if the user is logged in
      if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
      }

      // Delete the user from the database
      await User.findByIdAndDelete(userId);

      await Posts.deleteMany({ userId: userId });

      // Clear the user session
      req.session.destroy((err) => {
          if (err) {
              console.error('Error destroying session:', err);
              return res.status(500).json({ message: 'Error destroying session' });
          }
          res.clearCookie('connect.sid'); // Clear session cookie
          res.status(200).json({ message: 'User account deleted successfully' });
      });
  } catch (error) {
      // Handle errors
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;