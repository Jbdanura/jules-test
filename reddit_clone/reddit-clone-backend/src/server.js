require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const db = require('./models'); // Will uncomment once models are set up

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Community routes
const communityRoutes = require('./routes/communityRoutes');
app.use('/api/communities', communityRoutes);

// Post routes
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);

// Comment routes
const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

// Vote routes
const voteRoutes = require('./routes/voteRoutes');
app.use('/api/votes', voteRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Reddit Clone backend API.' });
});

// db.sequelize.sync().then(() => { // Will uncomment and potentially use migrations instead
//     console.log('Database synced.');
// }).catch(err => {
//     console.error('Failed to sync db: ' + err.message);
// });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
