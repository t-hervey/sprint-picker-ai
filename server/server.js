require('dotenv').config();
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
const dbConfig = require('./config/database');
const mongoUrl = dbConfig.url;
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

    // Create a user object without the password
    const safeUser = {
      _id: user._id,
      username: user.username
    };

    // Set a session cookie; expires with the browser
    res.cookie('userId', String(user._id), { httpOnly: true });
    res.json({ message: 'Login successful',
      user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Vote endpoint - Create or update a vote
app.post('/api/votes', async (req, res) => {
  try {
    const { movieId, vote } = req.body;
    const userId = req.cookies.userId;

    if (!userId || !movieId || !vote) {
      return res.status(400).json({ error: 'User ID, movie ID, and vote are required' });
    }

    const votesCollection = db.collection('votes');
    const movieVotesCollection = db.collection('movie_votes');

    // Check if the user has already voted for this movie
    const existingVote = await votesCollection.findOne({ userId, movieId });

    // Handle vote logic
    if (existingVote) {
      if (existingVote.vote === vote) {
        // No change needed if voting the same way
        return res.json({ message: 'Already voted this way' });
      }

      // Update existing vote
      await votesCollection.updateOne(
        { userId, movieId },
        { $set: { vote } }
      );

      // If changing from down to up, add 2 to vote count (remove down, add up)
      // If changing from up to down, subtract 2 from vote count (remove up, add down)
      const voteIncrement = existingVote.vote === 'down' && vote === 'up' ? 2 : -2;

      // Update movie_votes collection
      await movieVotesCollection.updateOne(
        { movieId },
        { $inc: { voteCount: voteIncrement } },
        { upsert: true }
      );

      res.json({ message: 'Vote updated successfully' });
    } else {
      // Create new vote
      await votesCollection.insertOne({ userId, movieId, vote });

      // Increment or decrement vote count
      const voteIncrement = vote === 'up' ? 1 : -1;

      // Update movie_votes collection
      await movieVotesCollection.updateOne(
        { movieId },
        { $inc: { voteCount: voteIncrement } },
        { upsert: true }
      );

      res.json({ message: 'Vote recorded successfully' });
    }
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// New endpoint to get vote count for a single movie directly from movie_votes
app.get('/api/votes/:movieId/count', async (req, res) => {
  try {
    const { movieId } = req.params;
    const movieVotesCollection = db.collection('movie_votes');

    const movieVote = await movieVotesCollection.findOne({ movieId });

    if (!movieVote) {
      return res.json({ voteCount: 0 });
    }

    res.json({ voteCount: movieVote.voteCount });
  } catch (err) {
    console.error('Error getting vote count:', err);
    res.status(500).json({ error: 'Failed to retrieve vote count' });
  }
});

// Get current user's vote for a movie
app.get('/api/votes/:movieId/user', async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.cookies.userId;

    if (!userId) {
      return res.json({ hasVoted: false });
    }

    const votesCollection = db.collection('votes');
    const vote = await votesCollection.findOne({ userId, movieId });

    if (!vote) {
      return res.json({ hasVoted: false });
    }

    res.json({
      hasVoted: true,
      vote: vote.vote
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve vote' });
  }
});

// Get votes for all movies at once
// Update the endpoint that gets all votes
app.get('/api/votes/all/counts', async (req, res) => {
  try {
    const movieVotesCollection = db.collection('movie_votes');

    // Get all movie vote counts
    const movieVotes = await movieVotesCollection.find().toArray();

    // Transform into the expected format
    const voteCounts = {};
    movieVotes.forEach(item => {
      voteCounts[item.movieId] = item.voteCount;
    });

    res.json(voteCounts);
  } catch (err) {
    console.error('Error getting all vote counts:', err);
    res.status(500).json({ error: 'Failed to retrieve vote counts' });
  }
});
