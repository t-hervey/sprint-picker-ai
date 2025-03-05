const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// MongoDB connection settings
const mongoUrl = 'mongodb+srv://dev:HfNdhMAnAGncH71V@sprintnamer.rgdi4.mongodb.net/?retryWrites=true&w=majority&appName=SprintNamer';
const dbName = 'topicAppDB';
let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch(err => console.error(err));

// Endpoints

// GET /api/topics - Get all topic names
app.get('/api/topics', async (req, res) => {
  try {
    const topicsCollection = db.collection('topics');
    const topics = await topicsCollection.find({}, { projection: { topic: 1 } }).toArray();
    const topicNames = topics.map(doc => doc.topic);
    res.json(topicNames);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve topics' });
  }
});

// POST /api/topics - Create a new topic
app.post('/api/topics', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const topicsCollection = db.collection('topics');
    const existing = await topicsCollection.findOne({ topic });
    if (existing) {
      return res.status(400).json({ error: 'Topic already exists' });
    }
    await topicsCollection.insertOne({ topic, posts: [] });
    res.json({ message: 'Topic created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// GET /api/topics/:topic/posts - Get posts for a topic
app.get('/api/topics/:topic/posts', async (req, res) => {
  try {
    const { topic } = req.params;
    const topicsCollection = db.collection('topics');
    const document = await topicsCollection.findOne({ topic });
    if (!document) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(document.posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

// POST /api/topics/:topic/posts - Add a post to a topic
app.post('/api/topics/:topic/posts', async (req, res) => {
  try {
    const { topic } = req.params;
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Post url is required' });
    }
    const topicsCollection = db.collection('topics');
    const updateResult = await topicsCollection.updateOne(
      { topic },
      { $push: { posts: { url } } }
    );
    if (updateResult.matchedCount === 0) {
      // If topic doesn't exist, create it with the post
      await topicsCollection.insertOne({ topic, posts: [{ url }] });
    }
    res.json({ message: 'Post added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add post' });
  }
});


// New endpoint for user login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const usersCollection = db.collection('users');
    // For proof-of-concept, assume plain-text password match.
    const user = await usersCollection.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Set a session cookie; expires with the browser
    res.cookie('userId', String(user._id), { httpOnly: true });
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});
