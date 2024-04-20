
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const userRoutes = require('./models/userRoutes'); 
const postRoutes = require('./models/postRoutes'); 
const newsRoutes = require('./models/newsRoutes');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());

app.use(session({
  secret: 'hello-new-user-session', 
  resave: false,
  saveUninitialized: true,
  cookie:  {
    maxAge: 3600000
  }
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://13.48.104.96:3000'], 
  credentials: true, 
}));

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/news', newsRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route for the root path to serve 'index.html'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});