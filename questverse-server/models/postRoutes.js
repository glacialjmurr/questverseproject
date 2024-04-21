// postRoutes.js
const mongoose = require('mongoose');
const express = require('express');
const Post = require('../models/Posts');
const User = require('../models/User');
const router = express.Router();

// Middleware to check if the user is authenticated
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

// Endpoint to fetch all posts
router.get('/all', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'username').exec();
    res.json(posts);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/followed', isAuthenticated, async (req, res) => {
  try {

    const followedPosts = await Post.find({
      userId: { $in: req.user.following }
    }).populate('userId');
    res.json(followedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching posts from followed users" });
  }
});

// Endpoint to create a new post
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Create a new post with the content and the user's document
    const newPost = new Post({
      content: req.body.content,
      userId: user, // Populate userId with the user's document
    });

    // Save the new post to the database
    await newPost.save();

    // Increment user XP and check for level up
    user.xp += 20; // Increment XP by 20
    if (user.xp >= 100) {
      user.level+=1; // Increment the user's level
      user.xp -= 100; // Reset XP to zero, but keep the overflow
    }

    // Save the updated user to the database
    await user.save();

    // Return the newly created post with the user's username
    res.status(201).json({
      _id: newPost._id,
      content: newPost.content,
      userId: {
        _id: user._id,
        username: user.username, 
        level: user.level, 
        xp: user.xp 
      },
      createdAt: newPost.createdAt,
      updatedAt: newPost.updatedAt
    });
  } catch (error) {
    console.error(error); 
    res.status(400).json({ message: "Bad Request", error: error.message });
  }
});

// Get posts by a logged in user
router.get('/byuser', (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) {
      return res.status(401).send('You must be logged in to see this');
  }

  // Use the userId stored in session to query the database
  Post.find({ userId: req.session.userId })
      .populate('userId', 'username')
      .then(posts => {
          res.json(posts);
      })
      .catch(err => {
          res.status(500).send(err);
      });
});





// Search for a user by username
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
                           .populate('followers following');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await Post.countDocuments({ userId: user._id });
    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;
    const level = user.level;

    const posts = await Post.find({ userId: user._id })
                            .populate('userId', 'username');

    res.json({
      username: user.username,
      id: user._id,
      followersCount,
      followingCount,
      postsCount,
      level,
      posts 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});



module.exports = router;