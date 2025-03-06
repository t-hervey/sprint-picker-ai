require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const dbConfig = require('./config/database');
const mongoUrl = dbConfig.url;
const dbName = 'topicAppDB';
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    server.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch(err => console.error(err));

io.on('connection', socket => {
  console.log('New client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

app.get('/api/topics', async (req, res) => {
  try {
    const topics = await db.collection('topics').find({}, { projection: { topic: 1 } }).toArray();
    res.json(topics.map(doc => doc.topic));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve topics' });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const topicsCollection = db.collection('topics');
    const existing = await topicsCollection.findOne({ topic });
    if (existing) return res.status(400).json({ error: 'Topic already exists' });

    await topicsCollection.insertOne({ topic, posts: [] });
    res.json({ message: 'Topic created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

app.get('/api/topics/:topic/posts', async (req, res) => {
  try {
    const { topic } = req.params;
    const document = await db.collection('topics').findOne({ topic });
    if (!document) return res.status(404).json({ error: 'Topic not found' });

    res.json(document.posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

app.post('/api/topics/:topic/posts', async (req, res) => {
  try {
    const { topic } = req.params;
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Post url is required' });

    const topicsCollection = db.collection('topics');
    const updateResult = await topicsCollection.updateOne(
      { topic },
      { $push: { posts: { url } } }
    );
    if (updateResult.matchedCount === 0) {
      await topicsCollection.insertOne({ topic, posts: [{ url }] });
    }
    res.json({ message: 'Post added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add post' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await db.collection('users').findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    res.cookie('userId', String(user._id), { httpOnly: true });
    res.json({ message: 'Login successful', user: { _id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/votes', async (req, res) => {
  try {
    const { movieId, vote } = req.body;
    const userId = req.cookies.userId;
    if (!userId || !movieId || !vote) return res.status(400).json({ error: 'User ID, movie ID, and vote are required' });

    const votesCollection = db.collection('votes');
    const movieVotesCollection = db.collection('movie_votes');
    const existingVote = await votesCollection.findOne({ userId, movieId });

    const voteIncrement = existingVote ? (existingVote.vote === 'down' && vote === 'up' ? 2 : -2) : (vote === 'up' ? 1 : -1);
    if (existingVote) {
      if (existingVote.vote === vote) return res.json({ message: 'Already voted this way' });
      await votesCollection.updateOne({ userId, movieId }, { $set: { vote } });
    } else {
      await votesCollection.insertOne({ userId, movieId, vote });
    }

    await movieVotesCollection.updateOne({ movieId }, { $inc: { voteCount: voteIncrement } }, { upsert: true });
    const updatedVote = await movieVotesCollection.findOne({ movieId });
    io.emit('vote-updated', { movieId, voteCount: updatedVote ? updatedVote.voteCount : 0 });

    res.json({ message: existingVote ? 'Vote updated successfully' : 'Vote recorded successfully' });
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.get('/api/votes/:movieId/count', async (req, res) => {
  try {
    const { movieId } = req.params;
    const movieVote = await db.collection('movie_votes').findOne({ movieId });
    res.json({ voteCount: movieVote ? movieVote.voteCount : 0 });
  } catch (err) {
    console.error('Error getting vote count:', err);
    res.status(500).json({ error: 'Failed to retrieve vote count' });
  }
});

app.get('/api/votes/:movieId/user', async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.cookies.userId;
    if (!userId) return res.json({ hasVoted: false });

    const vote = await db.collection('votes').findOne({ userId, movieId });
    res.json({ hasVoted: !!vote, vote: vote ? vote.vote : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve vote' });
  }
});

app.get('/api/votes/all/counts', async (req, res) => {
  try {
    const movieVotes = await db.collection('movie_votes').find().toArray();
    const voteCounts = movieVotes.reduce((acc, item) => ({ ...acc, [item.movieId]: item.voteCount }), {});
    res.json(voteCounts);
  } catch (err) {
    console.error('Error getting all vote counts:', err);
    res.status(500).json({ error: 'Failed to retrieve vote counts' });
  }
});
