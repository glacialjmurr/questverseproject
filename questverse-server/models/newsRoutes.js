const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to fetch gaming news from GNews
router.get('/gaming-news', async (req, res) => {
  const url = 'https://gnews.io/api/v4/search';
  const parameters = {
    q: 'gaming', // Query for gaming news
    lang: 'en', // Language set to English
    sortBy: 'publishedAt', // Sort by publication date
    token: 'b2e192ed698e2800a0123a6f504d9587' // Your GNews API key
  };


  try {
    const response = await axios.get(url, { params: parameters });
    if (response.data && Array.isArray(response.data.articles)) {
      res.json(response.data.articles); // Send back the articles array to the frontend
    } else {
      throw new Error('Invalid response structure from GNews');
    }
  } catch (error) {
    console.error('Error fetching gaming news from GNews:', error);
    res.status(500).json({ message: "Failed to fetch gaming news", error: error.message });
  }
});




module.exports = router;
