require('dotenv').config();
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env var is required');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const closetRoutes = require('./routes/closet');
const outfitRoutes = require('./routes/outfit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
// TODO: Restrict to known origins in production via ALLOWED_ORIGIN env var
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/closet', closetRoutes);
app.use('/api/v1/outfit', outfitRoutes);

app.use(errorHandler);

module.exports = app;
